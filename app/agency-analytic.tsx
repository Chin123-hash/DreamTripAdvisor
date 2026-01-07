import { Stack } from 'expo-router';
import React from 'react';
import AgencyAnalyticsScreen from '../src/screens/AgencyAnalyticScreen';

export default function AgencyAnalyticPage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AgencyAnalyticsScreen />
    </>
  );
}