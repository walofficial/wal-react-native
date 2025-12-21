import { Redirect } from 'expo-router';

export default function LanguageRegionRedirect() {
  return <Redirect href="/(tabs)/(user)/user-preferences" />;
}
