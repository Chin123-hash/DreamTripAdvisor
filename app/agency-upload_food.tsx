import { Stack } from 'expo-router';
import React from 'react';
import { AgencyUploadFoodScreen } from '../src/screens/AgencyUploadFoodScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgencyUploadFoodScreen />
    </>
  );
}