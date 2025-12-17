import { Stack } from 'expo-router';
import React, { ComponentType } from 'react';
import AFoodDetailsScreen from '../src/screens/AgencyFoodDetailsScreen';

const TypedFoodDetailsScreen = AFoodDetailsScreen as ComponentType;

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ title: 'Food Details' }} />
            <TypedFoodDetailsScreen />
        </>
    );
}