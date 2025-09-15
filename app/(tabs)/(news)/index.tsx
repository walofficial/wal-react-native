import LocationFeed from '@/components/LocationFeed';
import useAuth from '@/hooks/useAuth';

function NewsScreen() {
  const { user } = useAuth();
  return (
    <LocationFeed
      isFactCheckFeed={true}
      isNewsFeed={true}
      feedId={user.preferred_news_feed_id!}
    />
  );
}

export default NewsScreen;
