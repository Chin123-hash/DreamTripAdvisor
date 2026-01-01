import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllOrders, getUserProfile } from '../services/AuthService'; // Change this to fetch all

const DATE_FILTERS = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 3 Days', value: 3 },
    { label: 'Last Week', value: 7 },
    { label: 'Last Month', value: 30 },
    { label: 'Last 6 Months', value: 180 },
];

export default function AdminOrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Filters
    const [selectedDateFilter, setSelectedDateFilter] = useState('all');
    const [selectedAgencies, setSelectedAgencies] = useState([]); // Array for multi-select

    const loadData = async () => {
        try {
            // 1. Fetch All Orders
            const orderData = await getAllOrders();

            // 2. Extract Unique Customer IDs
            const uniqueCustomerIds = [...new Set(orderData.map(o => o.customerId).filter(id => id))];

            // 3. Fetch Profiles (Enrichment Logic)
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
                    customerName: profile?.fullName || profile?.username || order.customerName || 'Guest',
                    customerEmail: profile?.email || order.customerEmail || 'No Email',
                    customerPhone: profile?.phone || order.customerPhone || 'No Phone'
                };
            });

            // 5. Sort by latest first
            const sortedData = enrichedData.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });

            setOrders(sortedData);
        } catch (error) {
            console.error("Admin Dashboard Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Extract unique agencies from data for the filter list
    const agencyList = useMemo(() => {
        const names = [...new Set(orders.map(o => o.agencyName).filter(Boolean))];
        return names.sort();
    }, [orders]);

    const toggleAgency = (name) => {
        if (selectedAgencies.includes(name)) {
            // Allow deselecting as long as it's not the only one left? 
            // Or just allow 0 and handle it as "Select Agency"
            setSelectedAgencies(prev => prev.filter(a => a !== name));
        } else {
            if (selectedAgencies.length >= 3) {
                Alert.alert("Limit Reached", "You can select up to 3 agencies only.");
                return;
            }
            setSelectedAgencies(prev => [...prev, name]);
        }
    };

    // Filter Logic: Applies BOTH Date and Agency filters
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            let dateMatch = true;
            if (selectedDateFilter !== 'all') {
                const now = new Date();
                const filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                filterDate.setDate(filterDate.getDate() - (selectedDateFilter - 1));
                const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                dateMatch = orderDate >= filterDate;
            }

            let agencyMatch = true;
            if (selectedAgencies.length > 0) {
                agencyMatch = selectedAgencies.includes(order.agencyName);
            }
            return dateMatch && agencyMatch;
        });
    }, [orders, selectedDateFilter, selectedAgencies]);

    const stats = useMemo(() => {
        const revenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
        return {
            revenue: revenue.toFixed(2),
            bookings: filteredOrders.length,
            customers: new Set(filteredOrders.map(o => o.customerId)).size
        };
    }, [filteredOrders]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const FilterSection = () => (
        <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Filter by Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowMargin}>
                {DATE_FILTERS.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, selectedDateFilter === opt.value && styles.activeChip]}
                        onPress={() => setSelectedDateFilter(opt.value)}
                    >
                        <Text style={[styles.chipText, selectedDateFilter === opt.value && styles.activeChipText]}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Filter by Agency (Max 3)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowMargin}>
                <TouchableOpacity
                    style={[styles.chip, selectedAgencies.length === 0 && styles.activeChip]}
                    onPress={() => setSelectedAgencies([])}
                >
                    <Text style={[styles.chipText, selectedAgencies.length === 0 && styles.activeChipText]}>All Agencies</Text>
                </TouchableOpacity>
                {agencyList.map((name) => (
                    <TouchableOpacity
                        key={name}
                        style={[styles.chip, selectedAgencies.includes(name) && styles.activeAgencyChip]}
                        onPress={() => toggleAgency(name)}
                    >
                        {selectedAgencies.includes(name) && <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{ marginRight: 4 }} />}
                        <Text style={[styles.chipText, selectedAgencies.includes(name) && styles.activeChipText]}>{name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

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

            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <FilterBar />
        </View>
    );

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity style={styles.orderCard}>
            <View style={styles.cardHeader}>
                <View style={styles.customerAvatar}>
                    <Text style={styles.avatarText}>{item.customerName?.charAt(0) || 'C'}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.customerName}>{item.customerName || 'Customer'}</Text>
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

    const handleBackPress = () => {
        console.log("Back pressed");
        Alert.alert("Page Not Ready", "The Admin main page is still under development.");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                {/* Updated Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    //onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Admin Order & Sales Dashboard</Text>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#333" /></View>
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
                            <Text style={styles.emptyText}>No sales data for this period.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    summaryContainer: { marginTop: 10 },
    mainStatCard: { borderRadius: 15, padding: 20, marginBottom: 15 },
    statLabel: { color: '#FFF', opacity: 0.8 },
    statValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
    statIcon: { position: 'absolute', right: 20, bottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    miniStatCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#EEE' },
    miniLabel: { fontSize: 12, color: '#666' },
    miniValue: { fontSize: 18, fontWeight: 'bold' },
    filterSection: { marginBottom: 20 },
    filterLabel: { fontSize: 12, fontWeight: 'bold', color: '#999', marginBottom: 8, textTransform: 'uppercase' },
    rowMargin: { marginBottom: 15 },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 10, flexDirection: 'row', alignItems: 'center' },
    activeChip: { backgroundColor: '#333' },
    activeAgencyChip: { backgroundColor: '#648DDB' },
    chipText: { fontSize: 13, color: '#666' },
    activeChipText: { color: '#FFF', fontWeight: 'bold' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    orderCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    agencyBadge: { backgroundColor: '#E8F0FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
    agencyText: { fontSize: 10, color: '#648DDB', fontWeight: 'bold' },
    customerName: { fontSize: 15, fontWeight: 'bold' },
    amountContainer: { alignItems: 'flex-end' },
    amountText: { fontSize: 15, fontWeight: 'bold', color: '#28A745' },
    dateText: { fontSize: 10, color: '#BBB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});