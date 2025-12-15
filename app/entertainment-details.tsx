import { Stack } from 'expo-router';
import React from 'react';
import EntertainmentDetailsScreen from '../src/screens/EntertainmentDetailsScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Details',
          headerShown: true, // Shows the back arrow automatically
          headerBackTitle: 'Back',
          headerTintColor: '#007AFF', // Color of the back arrow
          headerTitleStyle: { color: 'black' }
        }} 
      />
      <EntertainmentDetailsScreen />
    </>
  );
}