import { Stack } from 'expo-router';
import React from 'react';
import AgencyDetailsScreen from '../src/screens/AgencyDetailsScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: 'Agency Details', headerBackTitle: 'Back' }} />
      <AgencyDetailsScreen />
    </>
  );
}