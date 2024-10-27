import React, { useState, useRef } from "react";
import { Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alertComponent";
import Progress from "./ui/progress";

const PlateRecognition = () => {
  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processedFrames, setProcessedFrames] = useState([]);
  const [plates, setPlates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const frameViewerRef = useRef(null);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideo(file);
        setPreview(URL.createObjectURL(file));
        setProcessedFrames([]);
        setPlates([]);
        setError("");
      } else {
        setError("Please upload a video file");
      }
    }
  };

  const handleSubmit = async () => {
    if (!video) {
      setError("Please select a video first");
      return;
    }

    setLoading(true);
    setProgress(0);
    setProcessedFrames([]); // Clear any existing frames
    const formData = new FormData();
    formData.append("video", video);

    try {
      const response = await fetch("http://localhost:3001/process-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to process video");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.progress) {
              setProgress(data.progress);
            }
            if (data.frames) {
              // Update processed frames with actual frame data
              setProcessedFrames(
                Array.from({ length: data.frames }, (_, i) => ({
                  id: i,
                  path: `processed/${Date.now()}/frame-${i}.jpg`,
                }))
              );
            }
            if (data.plates) {
              setPlates(data.plates);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || "Failed to process video. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>License Plate Video Recognition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {preview ? (
                  <video
                    src={preview}
                    className="max-h-60 object-contain"
                    controls
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Video className="w-12 h-12 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Click or drag to upload video
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={handleVideoChange}
                />
              </label>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? "Processing Video..." : "Analyze Video"}
            </button>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-500">
                  Processing: {progress}%
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {processedFrames.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Processed Frames</h3>
                <div
                  ref={frameViewerRef}
                  className="w-full h-64 overflow-auto border rounded"
                >
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {processedFrames.map((frame) => (
                      <img
                        key={frame.id}
                        src={frame.path}
                        alt={`Frame ${frame.id}`}
                        className="w-full h-auto rounded"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {plates.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detected Plates</h3>
                <div className="grid grid-cols-1 gap-2">
                  {plates.map((plate, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded flex justify-between items-center"
                    >
                      <span className="font-mono">{plate.number}</span>
                      <span className="text-sm text-gray-500">
                        Appears in frames: {plate.timestamps.join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlateRecognition;
