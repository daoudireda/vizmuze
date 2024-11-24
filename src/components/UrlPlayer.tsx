import { useEffect } from "react";

const UrlPlayer = ({
  platform,
  mediaId,
}: {
  platform: string;
  mediaId: string;
}) => {
  const loadScript = (url: string) => {
    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) return existingScript;

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
    return script;
  };

  const renderEmbed = () => {
    switch (platform.toLowerCase()) {
      case "tiktok":
        return (
          <blockquote
            className="tiktok-embed"
            cite={`https://www.tiktok.com/video/${mediaId}`}
            data-video-id={mediaId}
            style={{ maxWidth: "325px" }}
          >
            <div className="h-[580px] bg-gray-100 animate-pulse flex items-center justify-center">
              <p className="text-gray-500">Loading TikTok...</p>
            </div>
          </blockquote>
        );

      case "instagram":
        return (
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={`https://www.instagram.com/p/${mediaId}/`}
            data-instgrm-version="14"
            style={{
              maxWidth: "540px",
              width: "100%",
              background: "#FFF",
              borderRadius: "3px",
              border: "1px solid #dbdbdb",
              padding: 0,
              margin: "1px",
            }}
          ></blockquote>
        );

      case "youtube":
        return (
          <iframe
            src={`https://www.youtube.com/embed/${mediaId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover rounded-lg"
            frameBorder="0"
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        );

      default:
        return <div>Unsupported platform</div>;
    }
  };

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const loadPlatformScript = async () => {
      try {
        switch (platform.toLowerCase()) {
          case "tiktok":
            script = loadScript("/embed.js") as HTMLScriptElement;
            break;
          case "instagram":
            script = loadScript("/embed") as HTMLScriptElement;
            break;
        }
      } catch (error) {
        console.error(`Error loading ${platform} script:`, error);
      }
    };

    loadPlatformScript();

    return () => {
      if (script?.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [platform]);

  return (
    <div className="relative aspect-[9/16] w-full h-full overflow-hidden">
      <div className="w-full h-full object-cover">{renderEmbed()}</div>
    </div>
  );
};

export default UrlPlayer;