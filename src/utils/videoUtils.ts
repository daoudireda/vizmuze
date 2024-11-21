
export const getVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  
  export const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };
  
  export const getEmbedUrl = (url: string): string => {
    if (isYouTubeUrl(url)) {
      const videoId = getVideoId(url);
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1`;
    }
    return url;
  };

 export const extractVideoId = (url: string): string | null => {
    const match = 
      url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/.*v=([^&]+)/) ||      // Standard YouTube URLs
      url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&]+)/) ||             // Shortened YouTube URLs
      url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^?]+)/);    // YouTube Shorts URLs
    return match ? match[1] : null;
  };

  export const isValidSocialMediaURL = (url: string | URL) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      const supportedDomains = [
        'tiktok.com',
        'vm.tiktok.com',
        'instagram.com',
        'www.instagram.com',
        'youtube.com',
        'www.youtube.com',
        'youtu.be'
      ];
  
      return supportedDomains.some(domain => hostname.includes(domain));
    } catch {
      return false;
    }
  };

  export const parseMediaURL = (url: string | URL) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const pathname = urlObj.pathname;

     
      
      // TikTok URL patterns:
      // - https://www.tiktok.com/@username/video/7123456789123456789
      // - https://vm.tiktok.com/1234567890/
      // - https://www.tiktok.com/t/1234567890/
      // - https://www.tiktok.com/player/v1/6718335390845095173?&music_info=1&description=1
      if (hostname.includes('tiktok.com')) {
        // Handle short URL format
        if (hostname.startsWith('vm.') || pathname.startsWith('/t/')) {
          const shortId = pathname.split('/').filter(Boolean)[0];
          return {
            platform: 'tiktok',
            mediaId: shortId,
            originalUrl: url,
            type: 'short'
          };
        }
        console.log("TikTok Full:", pathname);
        
        // Handle full URL format
        const videoId = pathname.split('video/')[1]?.split('/')[0];
        if (videoId) {
          return {
            platform: 'tiktok',
            mediaId: videoId,
            originalUrl: url,
            type: 'full'
          };
        }
        console.log("TikTok No ID:", pathname);
      }
  
      // Instagram URL patterns:
      // - https://www.instagram.com/p/ABC123/
      // - https://www.instagram.com/reel/ABC123/
      // - https://www.instagram.com/stories/username/ABC123/
      // - https://instagram.com/stories/highlights/ABC123/
      if (hostname.includes('instagram.com')) {
        const paths = pathname.split('/').filter(Boolean);
        
        if (paths[0] === 'p' || paths[0] === 'reel') {
          return {
            platform: 'instagram',
            mediaId: paths[1],
            originalUrl: url,
            type: paths[0] // 'p' or 'reel'
          };
        }
        
        if (paths[0] === 'stories') {
          return {
            platform: 'instagram',
            mediaId: paths[2],
            originalUrl: url,
            type: paths[1] === 'highlights' ? 'highlight' : 'story'
          };
        }
      }
  
      // YouTube URL patterns:
      // - https://www.youtube.com/watch?v=ABC123
      // - https://youtu.be/ABC123
      // - https://www.youtube.com/shorts/ABC123
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        // Handle youtube.com/watch?v= format
        if (hostname.includes('youtube.com')) {
          const videoId = urlObj.searchParams.get('v');
          if (videoId) {
            return {
              platform: 'youtube',
              mediaId: videoId,
              originalUrl: url,
              type: 'full'
            };
          }
          
          // Handle youtube.com/shorts/ format
          if (pathname.includes('/shorts/')) {
            const shortId = pathname.split('/shorts/')[1]?.split('/')[0];
            return {
              platform: 'youtube',
              mediaId: shortId,
              originalUrl: url,
              type: 'short'
            };
          }
        }
        
        // Handle youtu.be/ format
        if (hostname === 'youtu.be') {
          const videoId = pathname.split('/')[1];
          return {
            platform: 'youtube',
            mediaId: videoId,
            originalUrl: url,
            type: 'short'
          };
        }
      }
  
      return null; // Return null if no matching pattern is found
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  };



  