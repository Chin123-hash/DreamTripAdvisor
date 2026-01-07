import { Stack } from 'expo-router';
import React from 'react';
import FavoritesScreen from '../src/screens/FavouriteScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'My Favorites',
          headerBackTitle: 'Back',
          headerTintColor: '#000'
        }} 
      />
      <FavoritesScreen />
    </>
  );
}