import { Stack } from 'expo-router';
import React from 'react';
// 指向下一步创建的 Logic 文件
import AgencyEditFoodScreen from '../src/screens/AgencyEditFoodScreen';

export default function Page() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Food', 
          headerShown: true, 
          headerBackTitle: 'Cancel', 
          headerTintColor: '#007AFF',
          headerTitleStyle: { color: 'black' }
        }} 
      />
      <AgencyEditFoodScreen />
    </>
  );
}