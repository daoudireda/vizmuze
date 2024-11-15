// types.ts
export interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
  publishedAt: string;
}

export interface YouTubeSearchResponse {
  items: {
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string; width: number; height: number };
        medium: { url: string; width: number; height: number };
        high: { url: string; width: number; height: number };
      };
      channelTitle: string;
      publishedAt: string;
    };
  }[];
}

// youtubeClient.ts
export class YouTubeClient {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Extracts video ID from various YouTube URL formats
   */
  private extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Handle different YouTube URL formats
      if (urlObj.hostname.includes("youtube.com")) {
        // Regular watch URL: https://www.youtube.com/watch?v=VIDEO_ID
        if (urlObj.searchParams.has("v")) {
          return urlObj.searchParams.get("v");
        }
        // Shortened watch URL: https://youtube.com/v/VIDEO_ID
        // eslint-disable-next-line no-useless-escape
        const vMatch = urlObj.pathname.match(/^\/v\/([^\/\?]+)/);
        if (vMatch) return vMatch[1];

        // Embedded URL: https://youtube.com/embed/VIDEO_ID
        // eslint-disable-next-line no-useless-escape
        const embedMatch = urlObj.pathname.match(/^\/embed\/([^\/\?]+)/);
        if (embedMatch) return embedMatch[1];

        // handle short video urls https://youtube.com/shorts/KjN8HReN6yM?si=o5F_mnLLvLEf-Gy4
        if (urlObj.pathname.includes("/shorts/")) {
          return urlObj.pathname.split("/shorts/")[1].split("?")[0];
        }
      }

      return null;
    } catch (error) {
      console.error("Error parsing YouTube URL:", error);
      return null;
    }
  }

  /**
   * Get video details from a YouTube URL
   */
  async getVideoFromUrl(url: string): Promise<YouTubeVideoDetails | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL or could not extract video ID");
    }

    return this.getVideoDetails(videoId);
  }

  async searchVideos(
    query: string,
    maxResults: number = 10
  ): Promise<YouTubeVideoDetails[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&type=video&q=${encodeURIComponent(
          query
        )}&maxResults=${maxResults}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data: YouTubeSearchResponse = await response.json();

      return data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos?part=snippet&id=${videoId}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();
      const video = data.items[0];

      if (!video) {
        return null;
      }

      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnails: video.snippet.thumbnails,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
      };
    } catch (error) {
      console.error("Error fetching video details:", error);
      throw error;
    }
  }
}
