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
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAgencies, getAllOrders, getUserProfile } from '../services/AuthService'; // Change this to fetch all

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
    const [agencyModalVisible, setAgencyModalVisible] = useState(false);
    const [agencySearch, setAgencySearch] = useState('');
    const [tempSelectedAgencies, setTempSelectedAgencies] = useState([]); 
    const [agencyList, setAgencyList] = useState([]);

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

    const loadAgencies = async () => {
        const agencies = await getAgencies();
        setAgencyList(agencies.map(a => a.name));
    };

    useEffect(() => {
        loadData();
        loadAgencies();
    }, []);

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

            <Text style={styles.filterLabel}>Filter by Agency</Text>

            <TouchableOpacity
                style={styles.openFilterButton}
                onPress={() => {
                    setTempSelectedAgencies(selectedAgencies);
                    setAgencyModalVisible(true);
                }}
            >
                <Text style={styles.openFilterText}>
                    {selectedAgencies.length > 0
                        ? `${selectedAgencies.length} Agencies Selected`
                        : 'Select Agencies'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#555" />
            </TouchableOpacity>

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
            <LinearGradient colors={['#333', '#555']} style={styles.mainStatCard}>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <Text style={styles.statValue}>RM {stats.revenue}</Text>
                <Ionicons name="stats-chart" size={40} color="rgba(255,255,255,0.2)" style={styles.statIcon} />
            </LinearGradient>

            <View style={styles.row}>
                <View style={[styles.miniStatCard, { backgroundColor: '#F8F9FA' }]}>
                    <Text style={styles.miniLabel}>Bookings</Text>
                    <Text style={styles.miniValue}>{stats.bookings}</Text>
                </View>
                <View style={[styles.miniStatCard, { backgroundColor: '#F8F9FA' }]}>
                    <Text style={styles.miniLabel}>Customers</Text>
                    <Text style={styles.miniValue}>{stats.customers}</Text>
                </View>
            </View>

            <FilterSection />
            <Text style={styles.sectionTitle}>Order History</Text>
        </View>
    );

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => router.push({ pathname: '/order-details', params: { orderData: JSON.stringify(item) } })}
        >
            <View style={styles.cardHeader}>
                {/* Consistent Avatar UI */}
                <View style={styles.customerAvatar}>
                    <Text style={styles.avatarText}>{item.customerName?.charAt(0) || 'C'}</Text>
                </View>

                <View style={styles.headerInfo}>
                    <Text style={styles.customerName}>{item.customerName}</Text>
                    <Text style={styles.customerSub}>{item.customerEmail}</Text>

                    {/* Admin Specific Agency Badge */}
                    <View style={styles.agencyBadge}>
                        <Text style={styles.agencyText}>{item.agencyName || 'Unknown Agency'}</Text>
                    </View>
                </View>

                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>RM {parseFloat(item.totalAmount || 0).toFixed(2)}</Text>
                    <Text style={styles.dateText}>
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const filteredAgencyList = agencyList.filter(name =>
        name.toLowerCase().includes(agencySearch.toLowerCase())
    );

    const toggleTempAgency = (name) => {
        if (tempSelectedAgencies.includes(name)) {
            setTempSelectedAgencies(prev => prev.filter(a => a !== name));
        } else {
            if (tempSelectedAgencies.length >= 3) {
                Alert.alert("Limit Reached", "You can select up to 3 agencies only.");
                return;
            }
            setTempSelectedAgencies(prev => [...prev, name]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>

                {/* Title */}
                <Text style={styles.headerTitle}>Admin Control Center</Text>

                {/* Analytics Button */}
                <TouchableOpacity
                    style={styles.analyticsButton}
                    onPress={() => router.push('/admin-analytic')}
                >
                    <Ionicons name="analytics-outline" size={26} color="#333" />
                </TouchableOpacity>
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
                            <Text style={styles.emptyText}>No matching orders found.</Text>
                        </View>
                    }
                />
            )}

            {agencyModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>

                        <Text style={styles.modalTitle}>Select Agencies</Text>

                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={18} color="#999" />
                            <TextInput
                                placeholder="Search agency..."
                                value={agencySearch}
                                onChangeText={setAgencySearch}
                                style={styles.searchInput}
                            />
                        </View>

                        <FlatList
                            data={filteredAgencyList}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const selected = tempSelectedAgencies.includes(item);
                                return (
                                    <TouchableOpacity
                                        style={styles.agencyRow}
                                        onPress={() => toggleTempAgency(item)}
                                    >
                                        <Text style={styles.agencyName}>{item}</Text>
                                        {selected && (
                                            <Ionicons name="checkmark-circle" size={22} color="#648DDB" />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => setTempSelectedAgencies([])}
                            >
                                <Text style={styles.resetText}>Reset</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => {
                                    setSelectedAgencies(tempSelectedAgencies);
                                    setAgencyModalVisible(false);
                                }}
                            >
                                <Text style={styles.applyText}>Apply</Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
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
    mainStatCard: { borderRadius: 15, padding: 20, marginBottom: 15 },
    statLabel: { color: '#FFF', fontSize: 14, opacity: 0.9 },
    statValue: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
    statIcon: { position: 'absolute', right: 20, bottom: 10 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    miniStatCard: { width: '48%', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    miniLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
    miniValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    filterSection: { marginBottom: 10 },
    filterLabel: { fontSize: 11, fontWeight: 'bold', color: '#999', marginBottom: 8, textTransform: 'uppercase' },
    rowMargin: { marginBottom: 15 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    activeChip: { backgroundColor: '#333', borderColor: '#333' },
    activeAgencyChip: { backgroundColor: '#648DDB', borderColor: '#648DDB' },
    chipText: { fontSize: 13, color: '#666' },
    activeChipText: { color: '#FFF', fontWeight: 'bold' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },

    orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#666', fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    customerName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    customerSub: { fontSize: 11, color: '#999', marginTop: 1 },
    agencyBadge: { backgroundColor: '#E8F0FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' },
    agencyText: { fontSize: 10, color: '#648DDB', fontWeight: 'bold' },
    amountContainer: { alignItems: 'flex-end' },
    amountText: { fontSize: 15, fontWeight: 'bold', color: '#28A745' },
    dateText: { fontSize: 10, color: '#BBB', marginTop: 4 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', marginTop: 10 },
    openFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#DDD',
        marginBottom: 15,
    },

    openFilterText: {
        fontSize: 13,
        color: '#555',
    },

    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },

    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F1F1',
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 10,
    },

    searchInput: {
        flex: 1,
        padding: 8,
        fontSize: 13,
    },

    agencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },

    agencyName: {
        fontSize: 14,
        color: '#333',
    },

    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },

    resetButton: {
        padding: 12,
    },

    resetText: {
        color: '#999',
        fontSize: 14,
    },

    applyButton: {
        backgroundColor: '#333',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
    },

    applyText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    analyticsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});