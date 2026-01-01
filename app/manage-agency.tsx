import { Stack } from 'expo-router';
import React from 'react';
import ManageAgencyScreen from '../src/screens/ManageAgencyScreen.js';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: 'Manage Agency', headerBackTitle: 'Back' ,headerShown: false}} />
      <ManageAgencyScreen />
    </>
  );
}