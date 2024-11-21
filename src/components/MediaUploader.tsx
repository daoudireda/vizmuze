import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileAudio,
  FileVideo,
  Link2,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";
import { YouTubeClient } from "../utils/youtubeUtils";
import { isValidSocialMediaURL, parseMediaURL } from "../utils/videoUtils";
import { Button } from "./ui/button";

export interface Media {
  platform: string;
  mediaId: string;
  originalUrl: string | URL;
  type: string;
}

interface MediaUploaderProps {
  onFileSelect: (file: File) => void;
  onMediaSelect: (media: Media) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onFileSelect,
  onMediaSelect,
}) => {
  const [url, setUrl] = useState("");
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [,setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".webm", ".ogg"],
      "audio/*": [".mp3", ".wav", ".ogg"],
    },
    maxFiles: 1,
    disabled: isUrlMode,
  });

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isValidSocialMediaURL(url)) {
        setError("Invalid media URL");
        return;
      }
      setError(null);

      const media = parseMediaURL(url);
      if (media?.platform == "youtube") {
        const client = new YouTubeClient(import.meta.env.VITE_YOUTUBE_API_KEY);
        const result = await client.getVideoFromUrl(url);
        if (result) {
          console.log("Result:", result);
        }
      }

      if (media) {
        onMediaSelect(media);
      } else {
        setError("Invalid media URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const socialPlatforms = [
    {
      name: "YouTube",
      icon: Youtube,
      color: "hover:text-red-500",
      placeholder: "https://www.youtube.com/watch?v=...",
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "hover:text-pink-500",
      placeholder: "https://www.instagram.com/p/...",
      disabled: true,
    },
    {
      name: "Other",
      icon: Globe,
      color: "hover:text-blue-500",
      placeholder: "https://...",
       disabled: true,
    },
  ];

  const [selectedPlatform, setSelectedPlatform] = useState(socialPlatforms[0]);

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4">
        <Button
          size={"lg"}
          onClick={() => setIsUrlMode(false)}
          className={`px-6 py-3 rounded-full transition-all ${
            !isUrlMode
              ? "bg-indigo-500 text-white shadow-lg hover:bg-indigo-600"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Upload className="h-5 w-5 inline-block mr-2" />
          Upload File
        </Button>
        <Button
          size={"lg"}
          onClick={() => setIsUrlMode(true)}
          className={`px-6 py-3 rounded-full transition-all ${
            isUrlMode
              ? "bg-indigo-500 text-white shadow-lg hover:bg-indigo-600"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Link2 className="h-5 w-5 inline-block mr-2" />
          Import URL
        </Button>
      </div>

      {isUrlMode ? (
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-dashed border-gray-200">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-700">
                Import from URL
              </h3>
              <p className="text-gray-500">
                Paste a link from supported platforms
              </p>
            </div>

            <div className="flex justify-center gap-6">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => !platform.disabled && setSelectedPlatform(platform)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${
                    selectedPlatform.name === platform.name
                    ? "bg-indigo-50 shadow-md"
                    : platform.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50 hover:shadow-sm"
                  }`}
                  disabled={platform.disabled}
                >
                  <platform.icon className={`h-8 w-8 ${platform.color}`} />
                  <span className="text-sm text-gray-600">{platform.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={selectedPlatform.placeholder}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <Button
                size={"lg"}
                type="submit"
                className="w-full bg-indigo-500 text-white py-3 rounded-lg hover:bg-indigo-600 transition-colors"
              >
                Import Media
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            relative rounded-xl p-12 text-center transition-all duration-300 ease-in-out
            ${
              isDragActive
                ? "bg-indigo-50 border-2 border-dashed border-indigo-400"
                : "bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
            }
            shadow-lg hover:shadow-xl
          `}
        >
          <input {...getInputProps()} />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-xl pointer-events-none" />

          <div className="relative">
            <div className="flex justify-center space-x-4 mb-6">
              <FileAudio className="h-12 w-12 text-indigo-400" />
              <Upload className="h-12 w-12 text-indigo-500" />
              <FileVideo className="h-12 w-12 text-indigo-400" />
            </div>

            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragActive
                ? "Drop it like it's hot!"
                : "Upload your media file"}
            </h3>

            <p className="text-gray-600 mb-4">
              {isDragActive
                ? "Release to begin the magic..."
                : "Drag and drop your file here, or click to browse"}
            </p>

            <div className="inline-flex items-center justify-center space-x-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-2">
              <span>Supported formats:</span>
              <span className="font-mono">MP4, WebM, MP3, WAV, OGG</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
