import React from 'react';
import { FileAudio, FileVideo, Music } from 'lucide-react';

const ExampleSection: React.FC = () => {
  const examples = [
    {
      title: "Song Recognition",
      description: "Instantly identify any song playing in your media",
      icon: Music,
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      title: "Audio Extraction",
      description: "Isolate and extract high-quality audio",
      icon: FileAudio,
      image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=800&q=80",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Smart Transcription",
      description: "Convert speech to accurate text",
      icon: FileVideo,
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
        Powerful Features
      </h2>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Upload any media file and let our AI-powered tools handle the rest. Get professional results in seconds.
      </p>
      
      <div className="grid gap-8 md:grid-cols-3">
        {examples.map((example, index) => (
          <div key={index} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r opacity-75 rounded-xl transition-opacity duration-300 group-hover:opacity-90"
                 style={{
                   backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                 }}
            />
            <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
              <img
                src={example.image}
                alt={example.title}
                className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white backdrop-gradient-bottom">
                <example.icon className="h-8 w-8 mb-3" />
                <h3 className="text-xl font-semibold mb-2">{example.title}</h3>
                <p className="text-sm opacity-90">{example.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center justify-center space-x-2 text-sm text-gray-600 bg-white rounded-full px-6 py-3 shadow-md">
          <span>Supported formats:</span>
          <span className="font-mono text-indigo-600">MP4, WebM, MP3, WAV, OGG</span>
        </div>
      </div>
    </div>
  );
};

export default ExampleSection;