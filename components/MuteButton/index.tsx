import { Volume2, VolumeX } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { ViewStyle } from 'react-native';

export default function MuteButton({
  muted,
  onChange,
  className,
  style,
  iconColor = 'black',
}: {
  muted: boolean;
  onChange: () => void;
  className?: string;
  style?: ViewStyle;
  iconColor?: string;
}) {
  return (
    <Button
      style={style}
      className={className}
      variant={'default'}
      onPress={() => {
        onChange();
      }}
    >
      {muted ? <VolumeX color={iconColor} /> : <Volume2 color={iconColor} />}
    </Button>
  );
}
