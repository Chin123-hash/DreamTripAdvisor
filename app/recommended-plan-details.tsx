import { Stack } from 'expo-router';
import React, { ComponentType } from 'react';
import RecommededPlanDetailsScreen from '../src/screens/RecommendedPlansDetailsScreen';

const RPlanDetailsScreen = RecommededPlanDetailsScreen as ComponentType;

export default function Page() {
    return (
        <>
            {/* This provides the single top bar. The title will be overwritten by the screen. */}
            <Stack.Screen options={{ title: 'Loading...' }} />
            <RPlanDetailsScreen />
        </>
    );
}
