import { Stack } from 'expo-router';
import React from 'react';
import AdminOrdersScreen from '../src/screens/AdminOrdersScreen';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AdminOrdersScreen />
        </>
    );
}