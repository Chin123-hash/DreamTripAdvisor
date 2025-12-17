// app/cart-details.tsx
import { Stack } from 'expo-router';
import React from 'react';
import PlanDetailsScreen from '../src/screens/CartDetailsScreen';

export default function PlanDetailsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PlanDetailsScreen />
    </>
  );
}