// PlanDetailsScreen.js
// This screen displays a single plan's timeline, order form, and expense breakdown

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'; // [1] Add useNavigation
import React, { useEffect, useLayoutEffect, useState } from 'react'; // [2] Add useLayoutEffect
import {
    ActivityIndicator,
    Alert,
    Animated,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { addMasterPlanToUser, getPlanById } from '../services/AuthService';

export default function PlanDetailsScreen() {
    const { planId } = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation(); // [3] Initialize navigation

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- NEW STATE FOR POP-UP ---
    const [showSuccess, setShowSuccess] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (planId) {
            console.log("Fetching Plan ID:", planId); // Debugging
            fetchPlan();
        }
    }, [planId]);

    // [4] Dynamically update the Stack Header title
    useLayoutEffect(() => {
        navigation.setOptions({
            title: plan?.planName || 'Plan Details',
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => Alert.alert("Coming Soon", "Edit UI will be implemented next.")}
                    style={{ marginRight: 15 }}
                >
                    <Ionicons name="create-outline" size={24} color="#6C8CF5" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, plan]);

    const fetchPlan = async () => {
        try {
            const data = await getPlanById(planId);
            setPlan(data);
        } catch (e) {
            console.error("Failed to load plan:", e);
            Alert.alert("Error", "Could not fetch plan details.");
        } finally {
            setLoading(false);
        }
    };

    // --- NEW: HANDLE ADD TO CART ---
    const handleAddToCart = async () => {
        try {
            // Save the plan to the user's specific collection
            await addMasterPlanToUser(plan);

            // Show UI feedback
            setShowSuccess(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();

            setTimeout(() => {
                hidePopUp();
            }, 3000);
        } catch (error) {
            console.error("Add to cart failed:", error);
            Alert.alert("Error", "Failed to add plan to your account.");
        }
    };

    const hidePopUp = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setShowSuccess(false));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C8CF5" />
            </SafeAreaView>
        );
    }

    if (!plan) return (
        <View style={styles.loadingContainer}>
            <Text>Plan not found.</Text>
        </View>
    );

    const items = plan.items || [];
    const totalCost = parseFloat(plan.estimatedCost) || 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* REMOVED: The custom <View style={styles.header}> was here */}

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <Text style={styles.sectionHeader}>Itinerary</Text>

                <View style={styles.timelineCard}>
                    {items.length > 0 ? items.map((item, index) => (
                        <View key={index} style={styles.timelineRow}>
                            <View style={styles.timeCol}>
                                <Ionicons
                                    name={item.type === 'food' ? 'restaurant' : 'ticket'}
                                    size={20}
                                    color="#6C8CF5"
                                />
                                <Text style={styles.timeText}>
                                    {item.addedAt ? new Date(item.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </Text>
                            </View>

                            {index !== items.length - 1 && <View style={styles.dashLine} />}

                            <View style={styles.contentCol}>
                                <Text style={styles.activityTitle}>{item.title}</Text>
                                <Text style={styles.activityDesc}>
                                    RM {(item.price || 0).toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )) : (
                        <Text style={{ color: '#999', textAlign: 'center' }}>No items in this itinerary.</Text>
                    )}
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Total Expenses</Text>
                    {/* Display estimatedCost from DB */}
                    <Text style={styles.total}>RM {totalCost.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    style={styles.addToCartBtn}
                    onPress={handleAddToCart}
                >
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={() => Alert.alert("Confirm", "Proceed to payment?")}>
                    <Text style={styles.confirmText}>Confirm Order</Text>
                </TouchableOpacity>
            </ScrollView>

            {showSuccess && (
                <Animated.View style={[styles.successPopUp, { opacity: fadeAnim }]}>
                    <View style={styles.popUpContent}>
                        <Text style={styles.popUpText}>Plan add to cart successfully</Text>
                        <TouchableOpacity onPress={hidePopUp}>
                            <Ionicons name="close" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    sectionHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#1F3A5F' },
    timelineCard: { borderWidth: 1, borderColor: '#EEE', borderRadius: 16, padding: 16, marginBottom: 20, backgroundColor: '#FAFAFA' },
    timelineRow: { flexDirection: 'row', marginBottom: 20, position: 'relative' },
    timeCol: { width: 60, alignItems: 'center', marginRight: 10 },
    timeText: { fontSize: 12, color: '#888', marginTop: 4 },
    dashLine: { position: 'absolute', left: 29, top: 25, bottom: -15, width: 1, backgroundColor: '#DDD' },
    contentCol: { flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    activityDesc: { marginTop: 4, color: '#777' },
    formCard: { backgroundColor: '#F5F5F5', borderRadius: 16, padding: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555' },
    total: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#333' },

    // Buttons
    addToCartBtn: {
        backgroundColor: '#7395F7', // Lighter blue like the image
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 12,
        width: '60%',
        alignSelf: 'center'
    },
    addToCartText: { color: '#FFF', fontWeight: 'bold' },
    confirmBtn: {
        backgroundColor: '#6C8CF5',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#6C8CF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 5, elevation: 5
    },
    confirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Success Pop-Up Style
    successPopUp: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: '#FFF',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 25,
        // Shadow for the "floating" effect
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    popUpContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    popUpText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    }
});