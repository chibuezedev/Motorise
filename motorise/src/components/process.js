import React, { useState, useEffect } from "react";
import { Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alertComponent";
import Progress from "./ui/progress";


const VideoProcessing = () => {
  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [processingComplete, setProcessingComplete] = useState(false);
  

  const outputVideoUrl = "https://res.cloudinary.com/vendstore/video/upload/v1730148956/out_dfxuxe.mp4";

  // Progress simulation
  useEffect(() => {
    if (loading) {
      const duration = 120000; // 2 minutes in milliseconds
      const interval = 1000; // Update every second
      const steps = duration / interval;
      const increment = 100 / steps;
      
      const timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + increment;
          if (next >= 100) {
            clearInterval(timer);
            setLoading(false);
            setProcessingComplete(true);
            return 100;
          }
          return next;
        });
      }, interval);
      
      return () => clearInterval(timer);
    }
  }, [loading]);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideo(file);
        setPreview(URL.createObjectURL(file));
        setProcessingComplete(false);
        setError("");
      } else {
        setError("Please upload a video file");
      }
    }
  };

  const handleSubmit = () => {
    if (!video) {
      setError("Please select a video first");
      return;
    }
    
    setLoading(true);
    setProgress(0);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>License Plate Video Recognition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Input Video Section */}
            <div>
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
            </div>

            {/* Process Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? "Processing Video..." : "Process Video"}
            </button>

            {/* Progress Bar */}
            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-500">
                  Processing: {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Output Video Section */}
            {processingComplete && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Processed Output</h3>
                <div className="w-full border rounded p-4">
                  <video
                    src={outputVideoUrl}
                    className="w-full"
                    controls
                    key={processingComplete ? "processed" : "unprocessed"}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoProcessing;