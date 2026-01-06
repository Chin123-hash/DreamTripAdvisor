import { Stack } from 'expo-router';
import React from 'react';
import AdminMainPageScreen from '../src/screens/AdminMainPageScreen.js';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ title: 'Admin Main Page', headerBackTitle: 'Back' ,headerShown: false}} />
      <AdminMainPageScreen />
    </>
  );
}