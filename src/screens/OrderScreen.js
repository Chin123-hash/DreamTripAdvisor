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
// CHANGED: Import getUserOrders instead of getUserPlans
import { getUserOrders } from '../services/AuthService';

export default function HistoryScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadOrders = async () => {
        try {
            const data = await getUserOrders();
            setOrders(data);
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    // Helper to get status color

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({
                pathname: '/order-details',
                params: { orderId: item.id } // <--- FIX: Pass the ID
            })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    {/* Changed icon to receipt/ticket */}
                    <Ionicons name="ticket-outline" size={24} color="#5A8AE4" />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.planName}>{item.planName || "Trip Order"}</Text>
                    <Text style={styles.agencyName}>Agency: {item.agencyName || "Unknown"}</Text>
                    <Text style={styles.dateText}>
                        Travel Date: {item.travelDate ? new Date(item.travelDate).toLocaleDateString() : "N/A"}
                    </Text>
                </View>
                {/* Status Badge */}
                
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.stat}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.statText}>{item.pax || 1} Pax</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="wallet-outline" size={16} color="#666" />
                    <Text style={styles.statText}>RM {item.totalAmount ? item.totalAmount.toFixed(2) : "0.00"}</Text>
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
            {/* Added a Header Title since it's now Orders */}

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No orders yet.</Text>
                        <Text style={styles.subEmptyText}>Book a trip to see it here!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    screenHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

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
    planName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    agencyName: { fontSize: 12, color: '#666', marginBottom: 2 },
    dateText: { fontSize: 12, color: '#888' },
    
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', textTransform: 'capitalize' },

    divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    stat: { flexDirection: 'row', alignItems: 'center' },
    statText: { fontSize: 13, color: '#666', marginLeft: 6, fontWeight: '500' },

    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 15 },
    subEmptyText: { fontSize: 14, color: '#CCC', marginTop: 5 },
});