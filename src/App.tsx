import { UserButton, useUser } from "@clerk/clerk-react";
import { Check, Copy, Download, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import AudioPlayer from "./components/AudioPlayer";
import AuthModal from "./components/AuthModal";
import ExampleSection from "./components/ExampleSection";
import Footer from "./components/Footer";
import MediaPlayer from "./components/MediaPlayer";
import MediaUploader, { Media } from "./components/MediaUploader";
import Modal from "./components/Modal";
import MusicInfo from "./components/MusicInfo";
import PricingSection from "./components/PricingSection";
import { Button } from "./components/ui/button";
import UpgradePrompt from "./components/UpgradePrompt";
import { Progress } from "./components/ui/progress";
import axios from "axios";

function App() {
  const { isSignedIn, user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [importMedia, setImportMedia] = useState<string>("");

  const [transcription, setTranscription] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [musicInfo, setMusicInfo] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [usedFreeAnalysis, setUsedFreeAnalysis] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [copySuccess, setCopySuccess] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [progress, setProgress] = useState(0);
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
      setProgress(0);
      setError("");
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100; // Ensure it doesn't exceed 100
          }
          return prev + 10; // Increment progress
        });
      }, 500);
      // set file to import
      const url = URL.createObjectURL(file);
      //return the real url from the local machine
      setImportMedia(url);
      setFile(file);
      // convert to audio
      const arrayBuffer = await file.arrayBuffer();
      const audioResponse = await axios.post(
        "http://localhost:3000/api/extract-audio",
        arrayBuffer,
        {
          headers: {
            "Content-Type": "application/octet-stream",
            "X-File-Name": file.name,
          },
          responseType: "blob",
        }
      );
      if (audioResponse.status !== 200) {
        const error = await audioResponse.data;
        throw new Error(error.error || "Failed to download audio");
      }

      // transcribe audio
      //const transcriptionText = await transcribeAudio(audioData);
      setTranscription("transcriptionText");
      // Convert the audio response to a blob
      const audioBlob = new Blob([audioResponse.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      // Send the audio blob to the recognition API
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3");

      const recognizeResponse = await axios.post(
        "http://localhost:3000/api/recognize-music",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (recognizeResponse.data) {
        setMusicInfo(recognizeResponse.data);
      } else {
        setError("Failed to recognize music");
      }

      if (!isPro) {
        setUsedFreeAnalysis(true);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err.message ||
          "An error occurred while processing the file. Please try again."
      );
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };
  // download audio
  const handleDownloadAudio = async () => {
    try {
      let downloadUrl: string;
      let filename: string;

      if (media?.originalUrl) {
        // Handle YouTube/online media
        const response = await fetch(
          `http://localhost:3000/api/download-audio?url=${encodeURIComponent(
            media.originalUrl.toString()
          )}`
        );

        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
        filename = `${media.mediaId || "audio"}.mp3`;
      } else {
        if (!file) {
          setError("No file selected");
          return;
        }
        // Handle local file
        downloadUrl = URL.createObjectURL(file);
        filename = file.name.replace(/\.[^/.]+$/, ".mp3");
      }
      // Download the file
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download audio. Please try again.");
    }
  };

  // copy transcription
  const handleCopyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const processMedia = async (media: Media) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setError("");
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      setMedia(media);
      // convert to audio
      const audioUrlResponse = await fetch(
        `http://localhost:3000/api/audio-url?url=${encodeURIComponent(
          media.originalUrl.toString()
        )}&platform=${media.platform}`
      );
      if (!audioUrlResponse.ok) {
        const error = await audioUrlResponse.json();
        throw new Error(error.error || "Failed to download audio");
      }
      const audioUrlData = await audioUrlResponse.json();

      setAudioUrl(audioUrlData.url);

      // Download the audio file using the proxy endpoint
      const audioResponse = await axios.get(
        `http://localhost:3000/api/proxy-audio?url=${encodeURIComponent(
          audioUrlData.url
        )}&platform=${media.platform}`,
        {
          responseType: "arraybuffer",
        }
      );

      // Convert the audio response to a blob
      const audioBlob = new Blob([audioResponse.data], { type: "audio/mpeg" });

      // Send the audio blob to the recognition API
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3");

      const recognizeResponse = await axios.post(
        "http://localhost:3000/api/recognize-music",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (recognizeResponse.data) {
        setMusicInfo(recognizeResponse.data);
      } else {
        setError("Failed to recognize music");
      }
    } catch (err) {
      console.error("Error processing media:", err);
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Sparkles className="h-6 w-6 text-indigo-500" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 italic">
                vizmuze
              </h1>
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
          <div className=" w-full">
            {/* <UrlPlayer
              platform={media?.platform || ""}
              mediaId={media?.mediaId || ""}
            /> */}
            <div className="space-y-6">
              {audioUrl && (
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
                  <AudioPlayer src={audioUrl} />
                </div>
              )}
              {musicInfo && <MusicInfo songInfo={musicInfo} />}

              {transcription && (
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Transcription</h3>
                    <button
                      onClick={handleCopyTranscription}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-indigo-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {copySuccess ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
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
        ) : (
          importMedia && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                <MediaPlayer src={importMedia} type={file?.type || ""} />
              </div>

              <div className="space-y-6">
                {audioUrl && (
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
                    <AudioPlayer src={audioUrl} />
                  </div>
                )}
                {musicInfo && <MusicInfo songInfo={musicInfo} />}

                {transcription && (
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Transcription</h3>
                      <button
                        onClick={handleCopyTranscription}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-indigo-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {copySuccess ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
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
          )
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
