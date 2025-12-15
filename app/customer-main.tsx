import { Stack } from 'expo-router';
import React from 'react';
import CustomerMainPage from '../src/screens/CustomerMainPage.js';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CustomerMainPage />
    </>
  );
}