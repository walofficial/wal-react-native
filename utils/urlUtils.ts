export function extractDomain(url: string): string {
  try {
    // Add https:// if the URL doesn't start with http:// or https://
    const urlWithProtocol =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    const domain = new URL(urlWithProtocol).hostname.replace("www.", "");
    return domain;
  } catch {
    return "";
  }
}

// Helper function to get favicon URL
export const getFaviconUrl = (uri: string) => {
  // Extract domain from URI if it's a full URL
  let domain = uri;
  try {
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const url = new URL(uri);
      domain = url.hostname;
    }
  } catch (error) {
    // If URL parsing fails, use the original string
    console.log("Error extracting domain:", error);
  }

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
};
