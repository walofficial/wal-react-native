import { useLocalSearchParams } from 'expo-router';
import UserGNContentProfile from '@/components/UserGNContentProfile';
import ProfileView from '@/components/ProfileView';

export default function Profile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  if (!userId) {
    return null;
  }

  return (
    <>
      <UserGNContentProfile
        userId={userId}
        topHeader={<ProfileView userId={userId} />}
      />
    </>
  );
}
