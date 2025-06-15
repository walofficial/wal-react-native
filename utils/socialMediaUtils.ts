/**
 * Utility functions for extracting and handling social media URLs
 */

interface SocialMediaURL {
    url: string;
    platform: 'youtube' | 'facebook' | 'x';
}

/**
 * Extracts social media URLs from text with platform detection
 * Supports YouTube, Facebook, and X/Twitter (formerly Twitter)
 */
export function extractSocialMediaURL(text: string): SocialMediaURL | null {
    // Clean up the input text
    text = text.trim();

    // Remove leading @ if present
    if (text.startsWith('@')) {
        text = text.substring(1);
    }

    // YouTube extraction
    const youtubePattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+)/i;
    let match = youtubePattern.exec(text);
    if (match) {
        return { url: match[1], platform: 'youtube' };
    }

    // Facebook mobile URL conversion
    const mobileFbPattern = /https?:\/\/m\.facebook\.com\/story\.php\?story_fbid=(\d+)&id=(\d+)/i;
    match = mobileFbPattern.exec(text);
    if (match) {
        const storyFbid = match[1];
        const userId = match[2];
        // Convert to standard web format
        const fullUrl = `https://www.facebook.com/${userId}/posts/${storyFbid}`;
        return { url: fullUrl, platform: 'facebook' };
    }

    // Facebook variations
    const fbPatterns = [
        /(https?:\/\/(?:www\.)?facebook\.com\/share\/v\/[\w-]+\/?(?:\?[\w=&%.-]+)?)/i,
        /(https?:\/\/(?:www\.)?facebook\.com\/share\/p\/[\w-]+\/?(?:\?[\w=&%.-]+)?)/i,
        /(https?:\/\/(?:www\.)?facebook\.com\/[\w.-]+\/posts\/[\w.-]+)/i,
        /(https?:\/\/(?:www\.)?facebook\.com\/share\/p\/[\w-]+\/?\?[\w=&%.-]+)/i,
        /(https?:\/\/(?:www\.)?facebook\.com\/[^\s]+)/i // Fallback pattern
    ];

    for (const pattern of fbPatterns) {
        match = pattern.exec(text);
        if (match) {
            let fullUrl = match[1];
            // Clean up URL if it's from the fallback pattern
            if (pattern.toString() === fbPatterns[4].toString()) {
                fullUrl = fullUrl.split(' ')[0]; // Take only first part if space found
            }
            return { url: fullUrl, platform: 'facebook' };
        }
    }

    // X/Twitter extraction
    const xPattern = /(https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[\w./?=&%-]+)/i;
    match = xPattern.exec(text);
    if (match) {
        return { url: match[1], platform: 'x' };
    }

    // No social media URL found
    return null;
}

/**
 * Extracts any URL from text
 */
export function extractURL(text: string): string | null {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlPattern);
    return matches?.[0] || null;
} 