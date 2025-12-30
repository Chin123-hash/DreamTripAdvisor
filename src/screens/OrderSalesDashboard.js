import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAgencyOrders } from '../services/AuthService';

export default function AgencyOrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, bookings: 0, customers: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const data = await getAgencyOrders(); // Fetches where agencyId == currentUser.uid
            setOrders(data);

            // Calculate Summary Data
            const totalRevenue = data.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
            const uniqueCustomers = new Set(data.map(o => o.customerId)).size;

            setStats({
                revenue: totalRevenue.toFixed(2),
                bookings: data.length,
                customers: uniqueCustomers
            });
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // UI Component for the Summary Cards
    const SummarySection = () => (
        <View style={styles.summaryContainer}>
            <LinearGradient colors={['#648DDB', '#5A8AE4']} style={styles.mainStatCard}>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <Text style={styles.statValue}>RM {stats.revenue}</Text>
                <Ionicons name="wallet-outline" size={40} color="rgba(255,255,255,0.3)" style={styles.statIcon} />
            </LinearGradient>

            <View style={styles.row}>
                <View style={[styles.miniStatCard, { backgroundColor: '#F4FFF2', borderColor: '#E1E1E1', borderWidth: 1 }]}>
                    <Text style={styles.miniLabel}>Bookings</Text>
                    <Text style={styles.miniValue}>{stats.bookings}</Text>
                </View>
                <View style={[styles.miniStatCard, { backgroundColor: '#F4FFF2', borderColor: '#E1E1E1', borderWidth: 1 }]}>
                    <Text style={styles.miniLabel}>Customers</Text>
                    <Text style={styles.miniValue}>{stats.customers}</Text>
                </View>
            </View>
        </View>
    );

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity style={styles.orderCard}>
            <View style={styles.cardHeader}>
                <View style={styles.customerAvatar}>
                    <Text style={styles.avatarText}>{item.customerName?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.customerName}>{item.customerName || 'Chin'}</Text>
                    <Text style={styles.planName}>{item.items?.[0]?.title || 'Package Fee'}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>+RM {parseFloat(item.totalAmount || 0).toFixed(2)}</Text>
                    <Text style={styles.dateText}>
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Dec 24, 2025'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Bar matching Upload Screen */}
            <View style={styles.headerBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order & Sales</Text>
                <View style={{ width: 33 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#648DDB" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    ListHeaderComponent={SummarySection}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={50} color="#CCC" />
                            <Text style={styles.emptyText}>No sales data available.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    backButton: { width: 40, height: 40, justifyContent: 'center' },

    listContent: { paddingHorizontal: 20, paddingBottom: 40 },

    // Summary Styles
    summaryContainer: { marginBottom: 25, marginTop: 10 },
    mainStatCard: { borderRadius: 15, padding: 20, marginBottom: 15, position: 'overflow' },
    statLabel: { color: '#FFF', fontSize: 14, opacity: 0.9 },
    statValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
    statIcon: { position: 'absolute', right: 20, bottom: 10 },

    row: { flexDirection: 'row', justifyContent: 'space-between' },
    miniStatCard: { width: '48%', borderRadius: 12, padding: 15, alignItems: 'center' },
    miniLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    miniValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    // Order Card Styles
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 1
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F0FE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#648DDB', fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    customerName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    planName: { fontSize: 12, color: '#888', marginTop: 2 },
    amountContainer: { alignItems: 'flex-end' },
    amountText: { fontSize: 15, fontWeight: 'bold', color: '#28A745' },
    dateText: { fontSize: 10, color: '#BBB', marginTop: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', marginTop: 10 }
});