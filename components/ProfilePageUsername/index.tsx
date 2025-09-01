import { useGlobalSearchParams } from 'expo-router';
import { useProfileInformation } from '@/hooks/useProfileInformation';
import { CustomTitle } from '../CustomTitle';
import ProfileHeader from '../ProfileHeader';

function ProfilePageUsername() {
  const { userId } = useGlobalSearchParams<{ userId: string }>();
  const { data: profile } = useProfileInformation(userId);

  return (
    <ProfileHeader
      customTitleComponent={<CustomTitle text={profile?.username || '...'} />}
      customButtons={<></>}
    />
  );
}

export { ProfilePageUsername };
