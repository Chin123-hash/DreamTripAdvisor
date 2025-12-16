// app/settings.tsx
import { Stack } from 'expo-router';
import React from 'react';
import SettingsScreen from '../src/screens/SettingsScreen';

export default function SettingsRoute() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Settings', 
          headerBackTitle: 'Back',
          headerShown: true 
        }} 
      />
      <SettingsScreen />
    </>
  );
}