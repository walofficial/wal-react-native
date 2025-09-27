import React from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import useVerificationById from '@/hooks/useVerificationById';
import CommentsView from '@/components/VerificationView/CommentsView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { activeLivekitRoomState } from '@/components/SpacesBottomSheet/atom';
import { useAtom } from 'jotai';

function VerificationView() {
  const params = useLocalSearchParams<{
    verificationId: string;
  }>();

  const color = useThemeColor({}, 'text');

  // Runtime check and type assertion
  const verificationId = params.verificationId || '';

  // Early return if verificationId is empty
  if (!verificationId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: color }}>Invalid verification ID</Text>
      </View>
    );
  }

  const {
    data: verification,
    isLoading,
    isError,
  } = useVerificationById(verificationId, true, {
    refetchInterval: 5000,
  });
  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: color }}>ფოსტი წაშლილია ან არ მოიძებნა</Text>
      </View>
    );
  }
  if (!verification || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    // We need to use keyboardAvoider because we are in navigation screen  with a header
    <>
      <CommentsView
        verification={verification}
        verificationId={verificationId}
      />
    </>
  );
}

export default VerificationView;
