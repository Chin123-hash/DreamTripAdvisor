import { Stack } from 'expo-router';
import React from 'react';
import OrderDetailsScreen from '../src/screens/OrderDetailsScreen';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <OrderDetailsScreen />
        </>
    );
}