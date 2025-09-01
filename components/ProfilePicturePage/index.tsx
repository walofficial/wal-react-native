import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { convertToCDNUrl } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';

const ProfilePicture = ({
  showMessageOption = false,
}: {
  showMessageOption?: boolean;
}) => {
  const { imageUrl, userId } = useLocalSearchParams();

  return (
    <SafeAreaView style={[styles.container]}>
      <Image
        source={{ uri: convertToCDNUrl(imageUrl as string) }}
        style={styles.image}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 20,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default ProfilePicture;
