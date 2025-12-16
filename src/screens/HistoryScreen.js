// src/screens/HistoryScreen.js

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getUserPlans } from '../services/AuthService';

export default function HistoryScreen() {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadPlans = async () => {
        try {
            const data = await getUserPlans();
            setPlans(data);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadPlans();
    };

    // Calculate total cost for a plan (just an estimate based on items)
    const calculateTotal = (items) => {
        if (!items) return "0.00";
        return items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2);
    };

    const renderPlanItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => alert(`Details for ${item.planName} coming soon!`)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <Ionicons name="map" size={24} color="#5A8AE4" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.planName}>{item.planName}</Text>
                    <Text style={styles.planDate}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.stat}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.statText}>{item.items?.length || 0} Places</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="wallet-outline" size={16} color="#666" />
                    <Text style={styles.statText}>RM {calculateTotal(item.items)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#5A8AE4" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={plans}
                renderItem={renderPlanItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="time-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No history yet.</Text>
                        <Text style={styles.subEmptyText}>Start planning your first trip!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconBox: {
        width: 50, height: 50, borderRadius: 12,
        backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    cardInfo: { flex: 1 },
    planName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    planDate: { fontSize: 12, color: '#888' },
    
    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { flexDirection: 'row', alignItems: 'center' },
    statText: { fontSize: 13, color: '#666', marginLeft: 6, fontWeight: '500' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 15 },
    subEmptyText: { fontSize: 14, color: '#CCC', marginTop: 5 },
});