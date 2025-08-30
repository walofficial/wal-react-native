import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { LinearGradient } from 'expo-linear-gradient';
import LikeButton from '@/components/FeedItem/LikeButton';
import CommentButton from '@/components/FeedItem/CommentButton';
import ShareButton from '@/components/FeedItem/ShareButton';
import { LocationFeedPost } from '@/lib/api/generated';
import { useTheme } from '@/lib/theme';

interface MediaControlsProps {
  verification: LocationFeedPost;
  verificationId: string;
  formattedTime: string;
  hideUserInfo?: boolean;
}

const MediaControls = ({
  verification,
  verificationId,
  formattedTime,
  hideUserInfo = false,
}: MediaControlsProps) => {
  const router = useRouter();
  const theme = useTheme();

  const UserInfo = () => (
    <View style={styles.userInfoContainer}>
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/(tabs)/(home)/profile',
            params: { userId: verification.assignee_user?.id || '' },
          });
        }}
      >
        <Avatar
          style={styles.avatar}
          alt={verification.assignee_user?.username || ''}
        >
          <AvatarImage
            source={{
              uri: verification.assignee_user?.photos[0].image_url[0] || '',
            }}
          />
        </Avatar>
      </TouchableOpacity>
      <View style={styles.userTextContainer}>
        <Text style={styles.username}>
          {verification.assignee_user?.username || ''}
        </Text>
        <Text style={styles.timestamp}>{formattedTime}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <View style={styles.actionGroup}>
          {/* <LikeButton bright verificationId={verificationId} large /> */}
          <CommentButton bright verificationId={verificationId} large />
        </View>
        <View style={styles.actionGroup}>
          <ShareButton bright verificationId={verificationId} />
        </View>
      </View>
      {verification.text_content && (
        <Text style={styles.contentText}>{verification.text_content}</Text>
      )}
      {!hideUserInfo && <UserInfo />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 40,
    height: 40,
  },
  userTextContainer: {
    marginLeft: 8,
  },
  username: {
    color: 'white',
    fontWeight: '600',
  },
  timestamp: {
    color: '#f1f5f9', // gray-100
    fontSize: 14,
  },
  contentText: {
    color: 'white',
    marginTop: 16,
  },
});

export default MediaControls;
