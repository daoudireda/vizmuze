import React from 'react';
import { Music, Calendar, Album, Star, ExternalLink } from 'lucide-react';

interface MusicInfoProps {
  songInfo: {
    title: string;
    artist: string;
    album?: string;
    releaseDate?: string;
    spotify?: {
      external_urls: {
        spotify: string;
      };
    };
    confidence: number;
  };
}

const MusicInfo: React.FC<MusicInfoProps> = ({ songInfo }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-blue-600">
        <div className="flex items-center space-x-3">
          <Music className="h-6 w-6 text-white" />
          <h2 className="text-xl font-semibold text-white">Detected Music</h2>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Music className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="text-lg font-semibold text-gray-900">{songInfo.title}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Star className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Artist</p>
                <p className="text-lg font-semibold text-gray-900">{songInfo.artist}</p>
              </div>
            </div>

            {songInfo.album && (
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Album className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Album</p>
                  <p className="text-lg font-semibold text-gray-900">{songInfo.album}</p>
                </div>
              </div>
            )}

            {songInfo.releaseDate && (
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Release Date</p>
                  <p className="text-lg font-semibold text-gray-900">{songInfo.releaseDate}</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Match Confidence</p>
                <p className="text-lg font-semibold text-gray-900">
                  {(songInfo.confidence * 100).toFixed(1)}%
                </p>
              </div>
              
              {songInfo.spotify && (
                <a
                  href={songInfo.spotify.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-[#1ed760] transition-colors shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Spotify
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicInfo;