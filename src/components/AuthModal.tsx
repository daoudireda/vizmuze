import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import Modal from './Modal';


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-6">
          {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        {mode === 'signin' ? (
          <SignIn routing="hash" redirectUrl="/" signUpUrl="#" />
        ) : (
          <SignUp routing="hash" redirectUrl="/" signInUrl="#" />
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;