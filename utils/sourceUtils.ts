import { useMemo } from "react";

export interface SourceWithUrl {
    uri?: string;
    url?: string;
    title?: string;
    domain?: string;
}

/**
 * Filters an array of sources to only include unique domains/hosts
 * @param sources Array of sources with either uri or url property
 * @returns Array of unique sources filtered by domain
 */
export const getUniqueSources = (sources: SourceWithUrl[]): SourceWithUrl[] => {
    if (!sources || sources.length === 0) return [];

    const uniqueDomains = new Set<string>();
    return sources.filter((source) => {
        try {
            // Handle both uri and url properties
            const sourceUrl = source.uri || source.url;
            if (!sourceUrl) return false;

            const url = new URL(sourceUrl);
            const domain = url.hostname;

            if (uniqueDomains.has(domain)) {
                return false;
            }

            uniqueDomains.add(domain);
            return true;
        } catch (e) {
            // If URL parsing fails, include the source
            return true;
        }
    });
};

/**
 * React hook for getting unique sources with memoization
 * @param sources Array of sources with either uri or url property
 * @returns Memoized array of unique sources
 */
export const useUniqueSources = (sources: SourceWithUrl[]): SourceWithUrl[] => {
    return useMemo(() => getUniqueSources(sources), [sources]);
}; 