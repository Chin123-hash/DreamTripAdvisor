import { Stack } from 'expo-router'; // <--- Import this
import React from 'react';
import RegisterScreen from '../src/screens/RegisterScreen';

export default function Page() {
  return (
    <>
      {/* This controls the top navigation bar */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <RegisterScreen />
    </>
  );
}