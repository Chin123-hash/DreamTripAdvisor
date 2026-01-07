import { Stack } from 'expo-router';
import React from 'react';
import AgencyEditEntertainmentScreen from '../src/screens/AgencyEditEntertainmentScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Entertainment', 
          headerShown: true, 
          headerBackTitle: 'Cancel', 
          headerTintColor: '#007AFF',
          headerTitleStyle: { color: 'black' }
        }} 
      />
      <AgencyEditEntertainmentScreen />
    </>
  );
}