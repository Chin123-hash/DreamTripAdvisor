import { Stack } from 'expo-router';
import CartScreen from '../src/screens/CartScreen';

export default function Page() {
    return (
        <>
            <Stack.Screen options={{ title: 'Cart' }} />
            <CartScreen />
        </>
    );
}
