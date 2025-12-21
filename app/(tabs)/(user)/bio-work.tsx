import { Redirect } from 'expo-router';

export default function BioWorkRedirect() {
  return <Redirect href="/(tabs)/(user)/user-preferences" />;
}
