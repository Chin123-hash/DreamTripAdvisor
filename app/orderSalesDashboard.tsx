import { Stack } from 'expo-router';
import React from 'react';
import OrderSalesDashboard from '../src/screens/OrderSalesDashboard';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <OrderSalesDashboard />
        </>
    );
}