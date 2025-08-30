import { isIOS } from '@/lib/platform';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useFeeds from './useFeeds';

function useKeyboardVerticalOffset() {
  const { headerHeight } = useFeeds();

  const { top, bottom } = useSafeAreaInsets();
  // Android etc
  if (!isIOS) {
    // if Android <35 or web, bottom is 0 anyway. if >=35, this is needed to account
    // for the edge-to-edge nav bar
    return headerHeight - 40;
  }

  // iPhone SE
  if (top === 20) return 40;

  // all other iPhones
  return top;
}

export default useKeyboardVerticalOffset;
