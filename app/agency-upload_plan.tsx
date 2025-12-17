import { Stack } from 'expo-router';
import React from 'react';
import { AgencyUploadPlanScreen } from '../src/screens/AgencyUploadPlanScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgencyUploadPlanScreen />
    </>
  );
}