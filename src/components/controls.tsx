import { Check, Copy, Download } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import MusicInfo from "./MusicInfo";

const Controls = ({ 
    handleDownloadAudio, 
    audioUrl, 
    musicInfo, 
    transcription, 
    handleCopyTranscription, 
    copySuccess 
  }: {
    handleDownloadAudio: () => void;
    audioUrl: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    musicInfo: any;
    transcription: string;
    handleCopyTranscription: () => void;
    copySuccess: boolean;
  }) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Audio Controls</h3>
          <button
            onClick={handleDownloadAudio}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-indigo-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
        {audioUrl && <AudioPlayer src={audioUrl} />}
      </div>
  
      {musicInfo && <MusicInfo songInfo={musicInfo} />}
  
      {transcription && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Transcription</h3>
            <button
              onClick={handleCopyTranscription}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copySuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {transcription}
          </p>
        </div>
      )}
    </div>
  );

export default Controls;
