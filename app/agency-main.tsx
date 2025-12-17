import { Stack } from 'expo-router';
import React from 'react';
import AgencyMainPageScreen from '../src/screens/AgencyMainPageScreen.js';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: 'Agency Main Page', headerBackTitle: 'Back' ,headerShown: false}} />
      <AgencyMainPageScreen />
    </>
  );
}