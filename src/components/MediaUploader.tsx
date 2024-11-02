import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, FileVideo } from 'lucide-react';

interface MediaUploaderProps {
  onFileSelect: (file: File) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onFileSelect }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg'],
      'audio/*': ['.mp3', '.wav', '.ogg']
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative rounded-xl p-12 text-center transition-all duration-300 ease-in-out
        ${isDragActive 
          ? 'bg-indigo-50 border-2 border-dashed border-indigo-400' 
          : 'bg-white border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
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
          {isDragActive ? "Drop it like it's hot!" : "Upload your media file"}
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
  );
};

export default MediaUploader;