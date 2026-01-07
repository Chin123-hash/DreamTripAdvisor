import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// CHANGED: Import getUserProfile
import { getAgencyOrders, getUserProfile } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

export default function AgencyOrdersScreen() {
    const router = useRouter();
    // 2. Destructure Hook
    const { t } = useLanguage();

    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ revenue: 0, bookings: 0, customers: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [selectedFilter, setSelectedFilter] = useState('all');

    // --- Dynamic Filters based on Language ---
    const FILTER_OPTIONS = [
        { label: t('all'), value: 'all' },
        { label: t('last3Days'), value: 3 },
        { label: t('lastWeek'), value: 7 },
        { label: t('lastMonth'), value: 30 },
        { label: t('last6Months'), value: 180 },
    ];

    const loadData = async () => {
        try {
            // 1. Fetch Orders
            const orderData = await getAgencyOrders();

            // 2. Extract Unique Customer IDs
            const uniqueCustomerIds = [...new Set(orderData.map(o => o.customerId).filter(id => id))];

            // 3. Fetch Profiles for these IDs
            const profilesMap = {};
            await Promise.all(uniqueCustomerIds.map(async (uid) => {
                const profile = await getUserProfile(uid);
                if (profile) {
                    profilesMap[uid] = profile;
                }
            }));

            // 4. Merge Profile Data into Orders
            const enrichedData = orderData.map(order => {
                const profile = profilesMap[order.customerId];
                return {
                    ...order,
                    // Prefer profile data, fallback to order data, fallback to defaults
                    customerName: profile?.fullName || profile?.username || order.customerName || t('guest'),
                    customerEmail: profile?.email || order.customerEmail || 'No Email',
                    customerPhone: profile?.phone || order.customerPhone || 'No Phone'
                };
            });

            // 5. Sort by latest first (descending)
            const sortedData = enrichedData.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });

            setOrders(sortedData);

            // Calculate Summary Data
            const totalRevenue = sortedData.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
            const uniqueCustomers = new Set(sortedData.map(o => o.customerId)).size;

            setStats({
                revenue: totalRevenue.toFixed(2),
                bookings: sortedData.length,
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

    const filteredOrders = useMemo(() => {
        if (selectedFilter === 'all') return orders;

        const now = new Date();
        const filterDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        filterDate.setDate(filterDate.getDate() - (selectedFilter - 1));

        return orders.filter(order => {
            const orderDate = order.createdAt?.toDate
                ? order.createdAt.toDate()
                : new Date(order.createdAt);
            return orderDate >= filterDate;
        });
    }, [orders, selectedFilter]);


    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const FilterBar = () => (
        <View style={styles.filterWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {FILTER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.filterChip, selectedFilter === opt.value && styles.activeFilterChip]}
                        onPress={() => setSelectedFilter(opt.value)}
                    >
                        <Text style={[styles.filterChipText, selectedFilter === opt.value && styles.activeFilterChipText]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const SummarySection = () => (
        <View style={styles.summaryContainer}>
            <LinearGradient colors={['#648DDB', '#5A8AE4']} style={styles.mainStatCard}>
                <Text style={styles.statLabel}>{t('totalRevenue')}</Text>
                <Text style={styles.statValue}>RM {stats.revenue}</Text>
                <Ionicons name="wallet-outline" size={40} color="rgba(255,255,255,0.3)" style={styles.statIcon} />
            </LinearGradient>

            <View style={styles.row}>
                <View style={[styles.miniStatCard, { backgroundColor: '#F4FFF2', borderColor: '#E1E1E1', borderWidth: 1 }]}>
                    <Text style={styles.miniLabel}>{t('bookings')}</Text>
                    <Text style={styles.miniValue}>{stats.bookings}</Text>
                </View>
                <View style={[styles.miniStatCard, { backgroundColor: '#F4FFF2', borderColor: '#E1E1E1', borderWidth: 1 }]}>
                    <Text style={styles.miniLabel}>{t('customers')}</Text>
                    <Text style={styles.miniValue}>{stats.customers}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>{t('recentTrans')}</Text>
            <FilterBar />
        </View>
    );

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() =>
                router.push({
                    pathname: '/order-details',
                    params: {
                        orderData: JSON.stringify(item),
                    },
                })
            }
        >
            <View style={styles.cardHeader}>
                <View style={styles.customerAvatar}>
                    <Text style={styles.avatarText}>{item.customerName?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.customerName}>{item.customerName || t('guest')}</Text>
                    {/* Added Email for better context since we fetched it */}
                    <Text style={{fontSize: 10, color: '#999'}}>{item.customerEmail}</Text> 
                    <Text style={styles.planName}>{item.items?.[0]?.title || t('packageFee')}</Text>
                </View>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>+RM {parseFloat(item.totalAmount || 0).toFixed(2)}</Text>
                    <Text style={styles.dateText}>
                        {item.createdAt
                            ? (item.createdAt.toDate
                                ? item.createdAt.toDate().toLocaleDateString()
                                : new Date(item.createdAt).toLocaleDateString())
                            : '—'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{t('orderSales')}</Text>

                <TouchableOpacity
                    onPress={() => router.push('/agency-analytic')}
                    style={styles.analyticsButton}
                >
                    <Ionicons name="analytics-outline" size={26} color="#333" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#648DDB" />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    ListHeaderComponent={SummarySection}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={50} color="#CCC" />
                            <Text style={styles.emptyText}>{t('noSalesData')}</Text>
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

    summaryContainer: { marginBottom: 15, marginTop: 10 },
    mainStatCard: { borderRadius: 15, padding: 20, marginBottom: 15, overflow: 'hidden' },
    statLabel: { color: '#FFF', fontSize: 14, opacity: 0.9 },
    statValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
    statIcon: { position: 'absolute', right: 20, bottom: 10 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    miniStatCard: { width: '48%', borderRadius: 12, padding: 15, alignItems: 'center' },
    miniLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    miniValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },

    // Filter Styles
    filterWrapper: { marginBottom: 10 },
    filterScroll: { paddingRight: 20 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#EEE'
    },
    activeFilterChip: { backgroundColor: '#648DDB', borderColor: '#648DDB' },
    filterChipText: { fontSize: 13, color: '#666' },
    activeFilterChipText: { color: '#FFF', fontWeight: 'bold' },

    // Order Card Styles
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEE',
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
    emptyText: { color: '#999', marginTop: 10 },
    analyticsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});