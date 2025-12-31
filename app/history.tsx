// app/history.tsx
import { Stack } from 'expo-router';
import React from 'react';
import HistoryScreen from '../src/screens/OrderScreen';

export default function HistoryRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Orders', headerBackTitle: 'Back' }} />
      <HistoryScreen />
    </>
  );
}