import { UserButton, useUser } from "@clerk/clerk-react";
import { RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import AuthModal from "./components/AuthModal";
import Controls from "./components/controls";
import ExampleSection from "./components/ExampleSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";
import MediaPlayer from "./components/MediaPlayer";
import MediaUploader, { Media } from "./components/MediaUploader";
import Modal from "./components/Modal";
import PricingSection from "./components/PricingSection";
import { Button } from "./components/ui/button";
import UpgradePrompt from "./components/UpgradePrompt";
import { Progress } from "./components/ui/progress";
import {
  processLocalFile,
  processMediaUrl,
  handleDownloadAudio,
} from "./utils/mediaUtils";
import { MusicInfoProps } from "./components/MusicInfo";

function App() {
  const { isSignedIn, user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [importMedia, setImportMedia] = useState<string>("");
  const [transcription] = useState<string>("");
  const [musicInfo, setMusicInfo] = useState<MusicInfoProps | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [usedFreeAnalysis, setUsedFreeAnalysis] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [copySuccess, setCopySuccess] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [progress, setProgress] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const processFile = async (file: File) => {
    if (!isSignedIn) {
      openAuth("signin");
      return;
    }

    const isPro = user.publicMetadata.plan === "pro";
    if (!isPro && usedFreeAnalysis) {
      setUpgradePromptOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setError("");

      const url = URL.createObjectURL(file);
      setImportMedia(url);
      setFile(file);

      await processLocalFile(file, {
        setProgress,
        setError,
        setAudioUrl,
        setMusicInfo,
      });

      if (!isPro) {
        setUsedFreeAnalysis(true);
      }
    } catch (err) {
      console.error("Error processing file:", err);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const processMedia = async (media: Media) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setError("");
      setMedia(media);

      await processMediaUrl(media, {
        setProgress,
        setError,
        setAudioUrl,
        setMusicInfo,
      });
    } catch (err) {
      console.error("Error processing media:", err);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleDownloadClick = async () => {
    if (!file && !media) {
      setError("No file or media selected");
      return;
    }
    try {
      setIsDownloading(true);
      if (media) {
        await handleDownloadAudio(media, file!, setError);
      } else if (file) {
        await handleDownloadAudio(null as unknown as Media, file, setError);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm"></div>
              <h1 className="text-xl font-semibold text-gray-900">Vizmuze</h1>
            </div>

            <div className="flex-1 flex justify-center space-x-4 ">
              <Button
                asChild
                variant="ghost"
                className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <a href="#services">Services</a>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <a href="#faq">FAQ</a>
              </Button>

              <Button
                onClick={() => setPricingModalOpen(true)}
                variant="ghost"
                className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
              >
                Pricing
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <div className="flex gap-4">
                  <Button
                    onClick={() => openAuth("signin")}
                    className="text-gray-600 hover:text-white bg-white/50 hover:bg-indigo-500"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => openAuth("signup")}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex justify-center gap-3 mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <Sparkles className="h-10 w-10 text-indigo-500" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-600 ">
            Your All-in-One Media Analyzer
          </h1>
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-2xl text-gray-700">
              Extract Music, Vocals & Transcripts from Any Media
            </p>
            <p className="text-lg text-gray-600">
              Upload or paste the URL of your short video and let AI do the
              magic. Identify songs, isolate audio, and get accurate
              transcriptions - all in one place.
            </p>
          </div>
        </div>
        <br />

        {!file && !media && (
          <MediaUploader
            onFileSelect={processFile}
            onMediaSelect={processMedia}
          />
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-12">
            <Progress value={progress} className="w-full bg-indigo-300 h-2" />
            <p className="mt-2 text-gray-600">Processing your media file...</p>
          </div>
        )}

        {(media || importMedia) && !isProcessing ? (
          <div className="text-center mt-8 flex-1 mb-8">
            <Button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white hover:bg-indigo-600 transition-colors rounded-full shadow-lg"
            >
              <RotateCcw></RotateCcw>
              Start Over
            </Button>
          </div>
        ) : null}

        {media ? (
          <div className="w-full">
            <Controls
              handleDownloadAudio={handleDownloadClick}
              audioUrl={audioUrl || ""}
              musicInfo={musicInfo}
              transcription={transcription}
              handleCopyTranscription={handleCopyTranscription}
              copySuccess={copySuccess}
              isDownloading={isDownloading}
            />
          </div>
        ) : (
          importMedia && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                <MediaPlayer src={importMedia} type={file?.type || ""} />
              </div>

              <Controls
                handleDownloadAudio={handleDownloadClick}
                audioUrl={audioUrl || ""}
                musicInfo={musicInfo}
                transcription={transcription}
                handleCopyTranscription={handleCopyTranscription}
                copySuccess={copySuccess}
                isDownloading={isDownloading}
              />
            </div>
          )
        )}
      </div>
      <div id="services">
        <ExampleSection />
      </div>

      <FAQSection />

      <Footer></Footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />

      <Modal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        size="full"
      >
        <div className="p-8">
          <PricingSection />
        </div>
      </Modal>

      <UpgradePrompt
        isOpen={upgradePromptOpen}
        onClose={() => setUpgradePromptOpen(false)}
        onUpgrade={() => {
          setUpgradePromptOpen(false);
          setPricingModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;
