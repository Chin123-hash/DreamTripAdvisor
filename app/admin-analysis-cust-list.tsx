import { Stack } from 'expo-router';
import React from 'react';
import AdminAnalysisCustomerList from '../src/screens/AdminAnalysisCustomerList';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <AdminAnalysisCustomerList />
        </>
    );
}