// app/profile.tsx
import { Stack } from 'expo-router';
import React from 'react';
import ProfileScreen from '../src/screens/ProfileScreen';

export default function ProfileRoute() {
  return (
    <>
      {/* We set shown to true, but title is handled dynamically in the screen */}
      <Stack.Screen options={{ headerShown: true, title: 'My Profile' }} />
      <ProfileScreen />
    </>
  );
}