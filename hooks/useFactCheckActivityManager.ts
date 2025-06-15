import { useEffect, useRef } from 'react';
import useVerificationById from './useVerificationById';
import { endFactCheckActivity, updateFactCheckActivity } from '@/modules/FactCheckActivityModule';
import { Platform } from 'react-native';

function useFactCheckActivityManager(verificationId: string | null | undefined) {
    // Only enable the query if we have a verificationId and are on iOS
    const enabled = !!verificationId && Platform.OS === 'ios';
    const { data } = useVerificationById(verificationId || '', enabled);

    // Keep track of the previous status
    const previousStatusRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!enabled || !data) {
            return;
        }

        const currentStatus = data.fact_check_status;
        const previousStatus = previousStatusRef.current;

        console.log(`[FactCheckManager] ID: ${verificationId} PrevStatus: ${previousStatus}, CurrentStatus: ${currentStatus}`);

        // Store the current status for the next render
        previousStatusRef.current = currentStatus;

        // If the status was PENDING and now it's something else, end the activity
        if (previousStatus === 'PENDING' && currentStatus !== 'PENDING') {
            console.log(`[FactCheckManager] Ending activity for ${verificationId} with status: ${currentStatus}`);
            // Provide a user-friendly final status message based on defined types
            let finalMessage = "Check complete";
            if (currentStatus === 'COMPLETED') {
                // Assuming COMPLETED means verified or successful check
                finalMessage = "Check results";
            } else if (currentStatus === 'FAILED') {
                finalMessage = "Check failed";
            }
            // If currentStatus is undefined or another value not explicitly handled,
            // it will use the default "Check complete"

            endFactCheckActivity(finalMessage); // Use the module function
        }
        // Optional: Update activity if it's still pending but status text changes
        // else if (currentStatus === 'PENDING' && previousStatus === 'PENDING') {
        //    // Potentially update with more specific pending steps if available
        //    // updateFactCheckActivity("Analyzing...");
        // }

    }, [data?.fact_check_status, verificationId, enabled]);

    // No return value needed, this hook manages the activity lifecycle
}

export default useFactCheckActivityManager; 