import { Stack } from 'expo-router';
import React from 'react';
import AgencyAnalytics from '../src/screens/AgencyAnalytics';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AgencyAnalytics />
        </>
    );
}