import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "What is Vizmuze ?",
      answer: "Vizmuze is a music recognition and extraction platform that allows users to upload audio and video files, and extract the music from them. It also provides a music recognition feature that can identify songs, artists, and even specific versions or remixes."
    },
    {
      question: "What file formats are supported?",
      answer: "We support various audio and video formats including MP3, MP4, WAV, and WebM. You can also import media directly from YouTube links."
    },
    {
      question: "How accurate is the music recognition?",
      answer: "Our music recognition system uses advanced algorithms to provide highly accurate results. It can identify songs, artists, and even specific versions or remixes."
    },
    {
      question: "Is there a file size limit?",
      answer: "Yes, the maximum file size is 100MB for free users. Premium users can upload files up to 500MB."
    },
    {
      question: "Can I download the extracted audio?",
      answer: "Yes, you can download the extracted audio in various formats including MP3 and WAV. Premium users have access to higher quality audio exports."
    },

    {
      question: "Do you support batch processing?",
      answer: "Premium users can process multiple files simultaneously. Free users can process one file at a time."
    },

  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div id="faq" className="mt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                <span className="text-left font-medium text-gray-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-white">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
