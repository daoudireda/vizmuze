import React from 'react';
import { Download, FileText } from 'lucide-react';

interface TranscriptionViewProps {
  transcription: string;
  onDownload: () => void;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ transcription, onDownload }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-500 to-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Transcription</h2>
          </div>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="prose prose-gray prose-sm sm:prose-base lg:prose-lg max-w-none">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{transcription}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptionView;