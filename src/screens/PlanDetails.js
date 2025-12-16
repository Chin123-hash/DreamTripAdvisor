// PlanDetailsScreen.js
// This screen displays a single plan's timeline, order form, and expense breakdown

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'; // [1] Add useNavigation
import React, { useEffect, useLayoutEffect, useState } from 'react'; // [2] Add useLayoutEffect
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getPlanById } from '../services/AuthService';

export default function PlanDetailsScreen() {
    const { planId } = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation(); // [3] Initialize navigation

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (planId) {
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
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C8CF5" />
            </SafeAreaView>
        );
    }

    if (!plan) return null;

    const items = plan.items || [];
    const totalExpenses = items.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* REMOVED: The custom <View style={styles.header}> was here */}

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.sectionHeader}>Itinerary</Text>

                <View style={styles.timelineCard}>
                    {items.map((item, index) => (
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
                    ))}
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Total Expenses</Text>
                    <Text style={styles.total}>RM {totalExpenses.toFixed(2)}</Text>
                </View>

                <TouchableOpacity style={styles.confirmBtn}>
                    <Text style={styles.confirmText}>Confirm Order</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1F3A5F'
    },
    timelineCard: {
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#FAFAFA'
    },
    timelineRow: {
        flexDirection: 'row',
        marginBottom: 20,
        position: 'relative' // Needed for dash line positioning
    },
    timeCol: {
        width: 60,
        alignItems: 'center',
        marginRight: 10
    },
    timeText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4
    },
    dashLine: {
        position: 'absolute',
        left: 29, // Horizontally align with the icon center (width 60 / 2 approx)
        top: 25,  // Start below the icon
        bottom: -15, // Extend down to the next item
        width: 1,
        backgroundColor: '#DDD'
    },
    contentCol: { flex: 1 },
    activityTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    activityDesc: { marginTop: 4, color: '#777' },
    formCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555' },
    total: { fontSize: 24, fontWeight: 'bold', marginTop: 8, color: '#333' },
    confirmBtn: {
        backgroundColor: '#6C8CF5',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#6C8CF5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    confirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptyDesc: {
        marginTop: 8,
        color: '#888',
        textAlign: 'center',
    },
});