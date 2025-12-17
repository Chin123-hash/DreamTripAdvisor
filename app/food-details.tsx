import { Stack } from 'expo-router';
import React, { ComponentType } from 'react';
import FoodDetailsScreen from '../src/screens/FoodDetailsScreen';

const TFoodDetailsScreen = FoodDetailsScreen as ComponentType;

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ title: 'Food Details' }} />
            <TFoodDetailsScreen />
        </>
    );
}