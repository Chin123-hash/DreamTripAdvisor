import { Stack } from 'expo-router';
import React from 'react';
import AgencyUploadEntertainmentScreen from '../src/screens/AgencyUploadEntertainmentScreen.js';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgencyUploadEntertainmentScreen />
    </>
  );
}