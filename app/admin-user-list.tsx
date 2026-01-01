import { Stack } from 'expo-router';
import React from 'react';
import AdminUserListScreen from '../src/screens/AdminUserListScreen'; // 确保路径对应你的文件夹结构

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AdminUserListScreen />
    </>
  );
}