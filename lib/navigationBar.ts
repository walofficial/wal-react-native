import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

import { isAndroid } from '@/lib/platform';

export function setNavigationBar(themeType: 'theme' | 'lightbox') {
  if (isAndroid) {
    if (themeType === 'theme') {
      NavigationBar.setBackgroundColorAsync('black');
      NavigationBar.setBorderColorAsync('black');
      NavigationBar.setButtonStyleAsync('light');
      SystemUI.setBackgroundColorAsync('black');
    } else {
      NavigationBar.setBackgroundColorAsync('black');
      NavigationBar.setBorderColorAsync('black');
      NavigationBar.setButtonStyleAsync('light');
      SystemUI.setBackgroundColorAsync('black');
    }
  }
}
