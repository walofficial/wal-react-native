//@ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { getLinkPreview } from 'link-preview-js';
import { extractSocialMediaURL, extractURL } from '../utils/socialMediaUtils';
import { LinkPreviewData } from '@/lib/api/generated';

const fetchLinkPreview = async (url: string): Promise<LinkPreviewData> => {
  const data = await getLinkPreview(url, {
    timeout: 5000,
    followRedirects: 'follow',
    headers: {
      'user-agent': 'googlebot/1.0',
    },
  });

  // Check if this is a social media URL to set platform
  const socialMediaInfo = extractSocialMediaURL(url);

  return {
    url,
    title: data.title,
    description: data.description,
    images: data.images,
    siteName: data.siteName,
    platform: socialMediaInfo?.platform,
  };
};

export function useLinkPreview(text: string, enabled: boolean = true) {
  // First try to extract a social media URL
  const socialMediaInfo = extractSocialMediaURL(text);

  // If no social media URL found, fall back to generic URL extraction
  let firstUrl = '';
  if (socialMediaInfo) {
    firstUrl = socialMediaInfo.url;
  } else {
    // Fall back to generic URL extraction
    firstUrl = extractURL(text) || '';
  }

  const {
    data: previewData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['linkPreview', firstUrl],
    queryFn: () => fetchLinkPreview(firstUrl),
    enabled: !!firstUrl && enabled,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
  });

  const clearPreview = () => {
    // You might want to implement cache invalidation here if needed
  };

  return {
    previewData,
    isLoading,
    error,
    clearPreview,
    refetch,
  };
}
