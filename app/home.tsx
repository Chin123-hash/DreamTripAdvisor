import { Stack } from 'expo-router';
import HomeScreen from '../src/screens/CustomerMainPage';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HomeScreen />
    </>
  );
}