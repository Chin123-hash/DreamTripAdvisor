import { Stack } from 'expo-router';
import React from 'react';
import ChatbotScreen from '../src/screens/ChatbotScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatbotScreen />
    </>
  );
}