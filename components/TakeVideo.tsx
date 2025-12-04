import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from './Button';
import { useToast } from './ToastUsage';

export default function TakeVideo({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const { feedId } = useLocalSearchParams();
  const { dismiss } = useToast();

  const onTakeVideoClick = async () => {
    dismiss('all');

    try {
      router.navigate({
        pathname: `/record`,
        params: {
          feedId: feedId as string,
        },
      });
    } catch (e) {
      console.error('Error accessing camera or cached video:', e);
    }
  };

  return (
    <Button
      disabled={disabled}
      onPress={onTakeVideoClick}
      icon="add"
      size="large"
      glassy
      iconSize={32}
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
      }}
    />
  );
}
