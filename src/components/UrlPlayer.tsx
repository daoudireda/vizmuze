import { useEffect } from "react";

const UrlPlayer = ({
  platform,
  mediaId,
}: {
  platform: string;
  mediaId: string;
}) => {
  const renderEmbed = () => {
    switch (platform.toLowerCase()) {
      case "tiktok":
        return (
          <blockquote
            className="tiktok-embed"
            cite={`https://www.tiktok.com/video/${mediaId}?origin=${window.location.origin}`}
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
            src={`https://www.youtube.com/embed/${mediaId}?origin=${window.location.origin}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover rounded-lg"
          ></iframe>
        );

      default:
        return <div>Unsupported platform</div>;
    }
  };
  // Load platform-specific scripts
  useEffect(() => {
    if (platform === "tiktok") {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      return () => {
        document.body.removeChild(script);
      };
    }

    if (platform === "instagram") {
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }
  }, [platform]);

  return (
    <div className="relative aspect-[9/16] w-full h-full overflow-hidden">
      {/* Media Display */}
      <div className="w-full h-full object-cover">{renderEmbed()}</div>
    </div>
  );
};

export default UrlPlayer;
