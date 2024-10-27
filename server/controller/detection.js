const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const { PassThrough } = require("stream");
const { createCanvas, loadImage } = require("canvas");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const upload = multer({ dest: "uploads/" });

// Configure CORS to allow video upload
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

async function detectEdges(imageData, width, height) {
  // Sobel operators for edge detection
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  // Create output array for edges
  const edges = new Uint8ClampedArray(width * height);

  // Function to get pixel value safely
  const getPixel = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return imageData[y * width * 4 + x * 4]; 
  };

 
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0;
      let gy = 0;

      // Apply Sobel operators
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const pixel = getPixel(x + j, y + i);
          gx += pixel * sobelX[(i + 1) * 3 + (j + 1)];
          gy += pixel * sobelY[(i + 1) * 3 + (j + 1)];
        }
      }

      // Calculate gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      // Apply threshold to create binary edge image
      edges[y * width + x] = magnitude > 50 ? 255 : 0;
    }
  }

  return edges;
}

// Helper function to clean plate numbers (add this if missing)
function cleanPlateNumber(text) {
  // Remove whitespace and special characters
  const cleaned = text.replace(/[^A-Z0-9]/g, "").trim();

  // Basic validation - plate should be at least 5 characters
  if (cleaned.length >= 5 && cleaned.length <= 8) {
    return cleaned;
  }
  return null;
}

app.use(express.json());
app.use("/processed", express.static("processed"));

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir("uploads", { recursive: true });
  await fs.mkdir("processed", { recursive: true });
}

// Helper function to extract frames using WASM-based FFmpeg
async function extractFrames(videoPath) {
  try {
    const framesDir = path.join(path.dirname(videoPath), "frames");
    await fs.mkdir(framesDir, { recursive: true });

    console.log("Extracting frames from:", videoPath);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .fps(1)
        .output(path.join(framesDir, "frame-%d.jpg")) // Output pattern for frames
        .on("start", (commandLine) => {
          console.log("FFmpeg process started:", commandLine);
        })
        .on("progress", (progress) => {
          console.log("Processing: " + progress.percent + "% done");
        })
        .on("end", () => {
          console.log("Frames extracted successfully");
          resolve(framesDir);
        })
        .on("error", (err) => {
          console.error("Error:", err);
          reject(err);
        })
        .run(); // Execute the FFmpeg command
    });
  } catch (error) {
    console.error("Error in extractFrames:", error);
    throw error;
  }
}

// Rest of the image processing functions remain the same
async function convertToGrayscale(inputPath) {
  const outputPath = inputPath.replace(".jpg", "-gray.jpg");
  await sharp(inputPath).grayscale().threshold(128).toFile(outputPath);
  return outputPath;
}

// process video endpoint
app.post("/process-video", upload.single("video"), async (req, res) => {
  console.log("Received video processing request");
  const processStream = new PassThrough();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    if (!req.file) {
      throw new Error("No video file provided");
    }

    console.log("Video file received:", req.file);
    const videoPath = req.file.path;

    // Send initial progress
    processStream.write(`data: ${JSON.stringify({ progress: 0 })}\n\n`);

    // Extract frames
    const framesDir = await extractFrames(videoPath);
    processStream.write(`data: ${JSON.stringify({ progress: 30 })}\n\n`);

    const frames = await fs.readdir(framesDir);
    console.log(`Processing ${frames.length} frames`);

    const plateDetections = new Map();
    let processedFrames = 0;

    // Process each frame
    for (const frame of frames) {
      const framePath = path.join(framesDir, frame);
      const frameNumber = parseInt(frame.match(/\d+/)[0]);

      // Process frame for plate detection
      const plates = await processFrame(framePath);

      plates.forEach((plate) => {
        if (plateDetections.has(plate.number)) {
          plateDetections.get(plate.number).timestamps.add(frameNumber);
        } else {
          plateDetections.set(plate.number, {
            number: plate.number,
            timestamps: new Set([frameNumber]),
          });
        }
      });

      processedFrames++;
      const progress = Math.round((processedFrames / frames.length) * 100);
      processStream.write(`${JSON.stringify({ progress })}\n`);
    }

    // Create output directory for processed frames
    const outputDir = path.join("processed", `${Date.now()}`);
    await fs.mkdir(outputDir);

    // Copy processed frames to output directory
    for (const frame of frames) {
      await fs.copyFile(
        path.join(framesDir, frame),
        path.join(outputDir, frame)
      );
    }

    const platesList = Array.from(plateDetections.values()).map((plate) => ({
      number: plate.number,
      timestamps: Array.from(plate.timestamps).sort((a, b) => a - b),
    }));

    processStream.write(
      `data: ${JSON.stringify({
        progress: 100,
        message: "Processing complete",
        frames: frames.length,
      })}\n\n`
    );

    processStream.end();
  } catch (error) {
    console.error("Error processing video:", error);
    processStream.write(
      `data: ${JSON.stringify({
        error: error.message,
        details: error.stack,
      })}\n\n`
    );
    processStream.end();
  }
});

// Process single frame for plate detection
async function processFrame(framePath) {
  // Convert to grayscale and apply threshold
  const grayPath = await convertToGrayscale(framePath);
  const image = await loadImage(grayPath);

  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const edges = await detectEdges(imageData.data, canvas.width, canvas.height);

  // Find potential plate regions using aspect ratio and area
  const regions = [];
  const minArea = 1000;
  const maxArea = 50000;
  const minRatio = 2;
  const maxRatio = 5;

  // Simple connected components analysis to find regions
  const visited = new Set();

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (edges[y * canvas.width + x] === 255 && !visited.has(`${x},${y}`)) {
        const region = {
          minX: x,
          maxX: x,
          minY: y,
          maxY: y,
          points: [],
        };

        // Flood fill to find connected region
        const queue = [[x, y]];
        while (queue.length > 0) {
          const [px, py] = queue.pop();
          const key = `${px},${py}`;

          if (visited.has(key)) continue;
          visited.add(key);

          region.points.push([px, py]);
          region.minX = Math.min(region.minX, px);
          region.maxX = Math.max(region.maxX, px);
          region.minY = Math.min(region.minY, py);
          region.maxY = Math.max(region.maxY, py);

          // Check neighbors
          for (const [dx, dy] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nx = px + dx;
            const ny = py + dy;
            if (
              nx >= 0 &&
              nx < canvas.width &&
              ny >= 0 &&
              ny < canvas.height &&
              edges[ny * canvas.width + nx] === 255
            ) {
              queue.push([nx, ny]);
            }
          }
        }

        const width = region.maxX - region.minX;
        const height = region.maxY - region.minY;
        const area = width * height;
        const ratio = width / height;

        if (
          area >= minArea &&
          area <= maxArea &&
          ratio >= minRatio &&
          ratio <= maxRatio
        ) {
          regions.push(region);
        }
      }
    }
  }

  const plates = [];

  // Process each potential plate region
  for (const region of regions) {
    const regionCanvas = createCanvas(
      region.maxX - region.minX,
      region.maxY - region.minY
    );
    const regionCtx = regionCanvas.getContext("2d");
    regionCtx.drawImage(
      image,
      region.minX,
      region.minY,
      region.maxX - region.minX,
      region.maxY - region.minY,
      0,
      0,
      region.maxX - region.minX,
      region.maxY - region.minY
    );

    const tempPath = `${path.dirname(framePath)}/temp-plate.jpg`;
    const buffer = regionCanvas.toBuffer("image/jpeg");
    await fs.writeFile(tempPath, buffer);

    // Perform OCR
    const result = await Tesseract.recognize(tempPath, "eng", {
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    });

    const plateNumber = cleanPlateNumber(result.data.text);
    if (plateNumber) {
      plates.push({
        number: plateNumber,
        bbox: {
          x: region.minX,
          y: region.minY,
          width: region.maxX - region.minX,
          height: region.maxY - region.minY,
        },
      });

      // Draw rectangle and text on original frame
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        region.minX,
        region.minY,
        region.maxX - region.minX,
        region.maxY - region.minY
      );

      ctx.fillStyle = "#00FF00";
      ctx.font = "24px Arial";
      ctx.fillText(plateNumber, region.minX, region.minY - 10);
    }

    await fs.unlink(tempPath);
  }

  // Save processed frame
  const buffer = canvas.toBuffer("image/jpeg");
  await fs.writeFile(framePath, buffer);

  await fs.unlink(grayPath);
  return plates;
}

// Initialize the app
async function initializeApp() {
  try {
    await ensureDirectories();
    console.log("Directories created successfully");
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

initializeApp();

module.exports = app;
