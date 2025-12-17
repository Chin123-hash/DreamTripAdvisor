// Change the import to point to FoodDetailsScreen
import FoodDetailsScreen from '@/src/screens/FoodDetailsScreen';
import { Stack } from 'expo-router';
import React from 'react';

export default function Page() {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Food Details', // Updated title
                    headerShown: true,
                    headerBackTitle: 'Back',
                    headerTintColor: '#007AFF',
                    headerTitleStyle: { color: 'black' },
                    headerTransparent: true, // Optional: matches your FoodDetailsScreen design
                    headerTitle: "" // Optional: matches your FoodDetailsScreen design
                }}
            />
            {/* Render the correct screen */}
            <FoodDetailsScreen /> 
        </>
    );
}