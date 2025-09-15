import LocationFeed from '@/components/LocationFeed';
import useAuth from '@/hooks/useAuth';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';

function FactCheckScreen() {
  const { user } = useAuth();
  const { content_type } = useLocalSearchParams<{
    content_type: 'last24h' | 'youtube_only' | 'social_media_only';
  }>();
  return (
    <LocationFeed
      isFactCheckFeed={true}
      isNewsFeed={false}
      content_type={content_type}
      feedId={user.preferred_fact_check_feed_id!}
    />
  );
}

export default FactCheckScreen;
