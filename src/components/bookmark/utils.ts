
  // Helper to convert image URL to base64 data URL
  const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bookmark Manager)'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch favicon:', response.status, response.statusText);
        return null;
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Ensure it's a proper data URL format
          if (result && result.startsWith('data:')) {
            resolve(result);
          } else {
            reject(new Error('Invalid data URL format'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    } catch (err) {
      console.warn('Failed to convert image to base64:', err);
      return null;
    }
  };

  // Helper to fetch title and favicon from URL
  const fetchUrlMetadata = async (url: string): Promise<{ title: string; favicon?: string; description?: string; keywords?: string }> => {
    try {
      console.log('Fetching metadata for URL:', url);

      // Use a CORS proxy or direct fetch (depending on CORS policy)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Bookmark Manager)'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch URL:', response.status, response.statusText);
        return { title: new URL(url).hostname };
      }

      const html = await response.text();

      // Parse HTML to extract title and favicon
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract title
      let title = doc.querySelector('title')?.textContent?.trim() || '';
      if (!title) {
        // Fallback to og:title or hostname
        title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
               new URL(url).hostname;
      }

      // Extract description
      let description = doc.querySelector('description')?.textContent?.trim() || '';
      if (!description) {
        // Fallback to og:description or empty
        description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
      }

      // Extract keywords
      let keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.trim() || '';


      // Extract favicon
      let faviconUrl = '';

      // Try different favicon selectors in order of preference
      const faviconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
        'meta[property="og:image"]'
      ];

      for (const selector of faviconSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          faviconUrl = element.getAttribute('href') || element.getAttribute('content') || '';
          if (faviconUrl) break;
        }
      }

      // Make favicon URL absolute if it's relative
      if (faviconUrl && !faviconUrl.startsWith('http') && !faviconUrl.startsWith('data:')) {
        try {
          const baseUrl = new URL(url);
          if (faviconUrl.startsWith('//')) {
            faviconUrl = baseUrl.protocol + faviconUrl;
          } else if (faviconUrl.startsWith('/')) {
            faviconUrl = baseUrl.origin + faviconUrl;
          } else {
            faviconUrl = new URL(faviconUrl, url).href;
          }
        } catch (err) {
          console.warn('Failed to resolve favicon URL:', err);
          faviconUrl = '';
        }
      }

      // Fallback to default favicon path if none found
      if (!faviconUrl) {
        try {
          const baseUrl = new URL(url);
          faviconUrl = `${baseUrl.origin}/favicon.ico`;
        } catch (err) {
          console.warn('Failed to construct default favicon URL:', err);
        }
      }

      // Convert favicon to base64 data URL
      let faviconBase64 = '';
      if (faviconUrl && !faviconUrl.startsWith('data:')) {
        console.log('Converting favicon to base64:', faviconUrl);
        const base64Result = await convertImageToBase64(faviconUrl);
        if (base64Result) {
          faviconBase64 = base64Result;
          console.log('Successfully converted favicon to base64');
        }
      } else if (faviconUrl.startsWith('data:')) {
        // Already a data URL
        faviconBase64 = faviconUrl;
      }

      console.log('Extracted metadata:', { title, favicon: faviconBase64 ? 'base64 data' : 'none' });
      return { title, favicon: faviconBase64 || undefined, description, keywords };

    } catch (err) {
      console.warn('Failed to fetch URL metadata:', err);
      // Fallback to hostname as title
      try {
        return { title: new URL(url).hostname };
      } catch {
        return { title: url };
      }
    }
  };



  // Try to open all URLs with a best-effort strategy:
  // 1) Attempt to open placeholder windows synchronously during the user gesture.
  // 2) If none could be created, open a helper window that asks the user to click
  //    to allow opening multiple tabs (usable when popups are blocked).
  // 3) Fallback to direct window.open for any remaining URLs.
  export function openAllUrls(urls: string[]) {
    if (!urls || urls.length === 0) return;

    console.log('Opening all URLs as tabs in current window...');

    try {
      // Simple approach: Open all URLs as tabs in the current browser window
      // No separate windows, no complex logic - just open each URL with small delays
      urls.forEach((url, index) => {
        setTimeout(() => {
          try {
            // Open each URL in a new tab (_blank) in the current window
            window.open(url, '_blank', 'noopener,noreferrer');
            console.log('Opened URL in new tab:', url);
          } catch (err) {
            console.warn('Failed to open URL:', url, err);
          }
        }, index * 100); // 100ms delay between each to avoid popup blocking
      });

      console.log(`Scheduled ${urls.length} URLs to open as tabs`);
    } catch (err) {
      console.warn('openAllUrls failed:', err);
    }
  };
