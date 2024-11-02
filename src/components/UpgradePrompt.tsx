import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import Modal from './Modal';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ isOpen, onClose, onUpgrade }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-indigo-100 rounded-full">
            <Sparkles className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-4">
          Ready to Unlock More?
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          You've used your free analysis. Upgrade to Pro for unlimited access and premium features.
        </p>

        <div className="space-y-4">
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span>View Pro Features</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpgradePrompt;