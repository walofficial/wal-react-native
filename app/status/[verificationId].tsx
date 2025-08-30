import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import useVerificationById from '@/hooks/useVerificationById';
import CommentsView from '@/components/VerificationView/CommentsView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

function VerificationView() {
  const params = useLocalSearchParams<{
    verificationId: string;
  }>();

  // Runtime check and type assertion
  const verificationId = params.verificationId || '';
  const insets = useSafeAreaInsets();
  const color = useThemeColor({}, 'text');

  // Early return if verificationId is empty
  if (!verificationId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: color }}>Invalid verification ID</Text>
      </View>
    );
  }

  const { data: verification, isLoading } = useVerificationById(
    verificationId,
    true,
    {
      refetchInterval: 5000,
    },
  );

  if (!verification || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <BottomSheetModalProvider>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <SimpleGoBackHeader title="ფოსტი" verificationId={verificationId} />
        <CommentsView
          verification={verification}
          verificationId={verificationId}
        />
      </View>
    </BottomSheetModalProvider>
  );
}

export default VerificationView;
