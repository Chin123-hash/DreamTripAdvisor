import { Stack } from 'expo-router';
import React from 'react';
import HelpSupportScreen from '../src/screens/HelpSupportScreen';

export default function HelpSupportPage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <HelpSupportScreen />
    </>
  );
}