import { Stack } from 'expo-router';
import React, { ComponentType } from 'react';
import CartScreen from '../src/screens/CartScreen';

// The original CartScreen is a JS component, so we explicitly type it
const TypedCartScreen = CartScreen as ComponentType;

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ title: 'Cart' }} />
            <TypedCartScreen />
        </>
    );
}
