import { useState } from "react";
import { Loader2, Sparkles, Download, Copy, Check } from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import AuthModal from "./components/AuthModal";
import ExampleSection from "./components/ExampleSection";
import MediaPlayer from "./components/MediaPlayer";
import MediaUploader from "./components/MediaUploader";
import Modal from "./components/Modal";
import MusicInfo from "./components/MusicInfo";
import PricingSection from "./components/PricingSection";
import UpgradePrompt from "./components/UpgradePrompt";
import { transcribeAudio, recognizeSongShazam } from "./utils/api";
import { convertToAudio, uint8ArrayToUrl } from "./utils/ffmpeg";
import { Button } from "./components/ui/button";
import AudioPlayer from "./components/AudioPlayer";
import Footer from "./components/Footer";

function App() {
  const { isSignedIn, user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [transcription, setTranscription] = useState<string>("");
  const [musicInfo, setMusicInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [usedFreeAnalysis, setUsedFreeAnalysis] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [copySuccess, setCopySuccess] = useState(false);

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);

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
      setError("");

      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setFile(file);

      const audioData = await convertToAudio(file);
      const audioUrl = uint8ArrayToUrl(audioData, "audio/wav");
      setAudioUrl(audioUrl);
      console.log("Audio url:", audioUrl);
      const transcriptionText = await transcribeAudio(audioData);
      setTranscription(transcriptionText);

      const musicData = await recognizeSongShazam(audioData);
      if (musicData) {
        setMusicInfo(musicData);
      }

      if (!isPro) {
        setUsedFreeAnalysis(true);
      }
    } catch (err: any) {
      setError(
        err.message ||
          "An error occurred while processing the file. Please try again."
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleDownloadAudio = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.[^/.]+$/, ".mp3");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  // const handleDownload = useCallback((content: string, filename: string) => {
  //   const blob = new Blob([content], { type: "text/plain" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = filename;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Sparkles className="h-6 w-6 text-indigo-500" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 italic">VizMuz</h1>
            </div>
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <>
                  <Button
                    onClick={() => setPricingModalOpen(true)}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <span>Pricing</span>
                  </Button>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <div className="flex gap-4">
                  <Button
                    onClick={() => openAuth("signin")}
                    className="text-gray-600 hover:text-gray-900 bg-white/50"
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
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-600">
            Your All-in-One Media Analyzer
          </h1>
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-2xl text-gray-700">
              Extract Music, Vocals & Transcripts from Any Media
            </p>
            <p className="text-lg text-gray-600">
              Upload your media files and let AI do the magic. Identify songs,
              isolate audio, and get accurate transcriptions - all in one place.
            </p>
          </div>
        </div>

        {!file && <MediaUploader onFileSelect={processFile} />}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">Processing your media file...</p>
          </div>
        )}

        {mediaUrl && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
              <MediaPlayer src={mediaUrl} type={file?.type || ""} />
            </div>

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
          </div>
        )}

        <ExampleSection />
      </div>
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
