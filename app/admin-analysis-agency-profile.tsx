import { Stack } from 'expo-router';
import React from 'react';
import AdminAnalysisAgencyProfile from '../src/screens/AdminAnalysisAgencyProfile';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AdminAnalysisAgencyProfile />
        </>
    );
}