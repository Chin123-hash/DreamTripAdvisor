import { Stack } from 'expo-router';
import React, { ComponentType } from 'react';
import PlanDetailsScreen from '../src/screens/AgencyPlanDetails';

const TypedPlanDetailsScreen = PlanDetailsScreen as ComponentType;

export default function Page() {
    return (
        <>
            {/* This provides the single top bar. The title will be overwritten by the screen. */}
            <Stack.Screen options={{ title: 'Plan Details' }} />
            <TypedPlanDetailsScreen />
        </>
    );
}
