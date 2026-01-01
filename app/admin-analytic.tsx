import { Stack } from 'expo-router';
import React from 'react';
import AdminAnalytics from '../src/screens/AdminAnalytics';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AdminAnalytics />
        </>
    );
}