import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from "@/lib/api";
import { formatRelativeTime } from '@/lib/utils/date';
import { isWeb } from "@/lib/platform";

/**
 * Custom hook to retrieve and format the timestamp of a verification
 */
export default function useVerificationTimestamp(verificationId?: string) {
    const [formattedTimestamp, setFormattedTimestamp] = useState<string>('');

    const { data: verification } = useQuery({
        queryKey: ['verification-timestamp', verificationId],
        queryFn: () => {
            if (!verificationId) return null;
            return isWeb
                ? api.getPublicVerificationById(verificationId)
                : api.getVerificationById(verificationId);
        },
        enabled: !!verificationId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (verification?.last_modified_date) {
            setFormattedTimestamp(formatRelativeTime(verification.last_modified_date));
        }
    }, [verification]);

    return { formattedTimestamp };
} 