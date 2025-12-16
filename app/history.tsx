// app/history.tsx
import { Stack } from 'expo-router';
import React from 'react';
import HistoryScreen from '../src/screens/HistoryScreen';

export default function HistoryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Trip History', headerBackTitle: 'Back' }} />
      <HistoryScreen />
    </>
  );
}