import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    BarChart,
    LineChart,
    PieChart,
} from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';
import { getAllOrders, getTopAgencies } from '../services/AuthService';

const screenWidth = Dimensions.get('window').width - 40;

export default function AdminAnalyticsScreen() {
    const router = useRouter();
    // 2. Destructure Hook
    const { t } = useLanguage();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState(null);
    // Added time range state if you want filtering (based on your previous code patterns)
    const [timeRange, setTimeRange] = useState('30'); 

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAnalytics();
        setSelectedPoint(null);
    }, []);

    const getFormattedDate = (createdAt) => {
        if (!createdAt) return "Unknown";
        if (createdAt.toDate) return createdAt.toDate().toLocaleDateString();
        return new Date(createdAt).toLocaleDateString();
    };

    // --- FILTER LOGIC (Optional, but good for UX) ---
    const filteredOrders = useMemo(() => {
        if (timeRange === 'all') return orders;
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - parseInt(timeRange));
        
        return orders.filter(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return d >= cutoff;
        });
    }, [orders, timeRange]);

    // --- STATS ---
    const stats = useMemo(() => {
        const revenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        const agencies = new Set(filteredOrders.map(o => o.agencyName)).size;
        const customers = new Set(filteredOrders.map(o => o.customerId)).size;
        const avgOrderValue = filteredOrders.length > 0 ? revenue / filteredOrders.length : 0;

        // Calculate Peak Day
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = {};
        filteredOrders.forEach(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            const dayName = days[d.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });
        const peakDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

        return {
            revenue: revenue.toFixed(2),
            orders: filteredOrders.length,
            agencies,
            customers,
            aov: avgOrderValue.toFixed(0),
            peakDay: peakDayEntry ? peakDayEntry[0] : 'N/A'
        };
    }, [filteredOrders]);

    // --- REVENUE TREND ---
    const revenueTrend = useMemo(() => {
        const map = {};
        const sortedOrders = [...filteredOrders].sort((a, b) => {
             const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
             const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
             return dateA - dateB; 
        });

        sortedOrders.forEach(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            const date = `${d.getDate()}/${d.getMonth() + 1}`; 
            map[date] = (map[date] || 0) + (Number(o.totalAmount) || 0);
        });

        const labels = Object.keys(map);
        const values = Object.values(map);

        if (labels.length > 7) {
            return { labels: labels.slice(-7), values: values.slice(-7) };
        }
        return values.length === 0 ? { labels: [t('noData')], values: [0] } : { labels, values };
    }, [filteredOrders, t]);

    // --- CHARTS ---
    const agencyChart = useMemo(() => {
        const map = {};
        filteredOrders.forEach(o => { map[o.agencyName] = (map[o.agencyName] || 0) + 1; });
        const colors = ['#648DDB', '#FF8A65', '#81C784', '#BA68C8', '#FFD54F'];
        
        return Object.keys(map).map((key, index) => ({
            name: key, population: map[key], color: colors[index % colors.length], legendFontColor: '#333', legendFontSize: 12,
        }));
    }, [filteredOrders]);

    const ordersByDate = useMemo(() => {
        const map = {};
        filteredOrders.forEach(o => {
            const date = getFormattedDate(o.createdAt);
            map[date] = (map[date] || 0) + 1;
        });
        const labels = Object.keys(map).slice(-7);
        const values = labels.map(l => map[l]);
        if (values.length === 0) return { labels: [t('noData')], values: [0] };
        return { labels, values };
    }, [filteredOrders, t]);

    // --- CUSTOMER SEGMENTS (New/Returning) ---
    const customerSegments = useMemo(() => {
        // Logic: If customer has >1 order in TOTAL history, they are Repeat. 
        // If they only have 1 order, they are One-time.
        // Note: Usually logic depends on business requirement.
        const counts = {};
        orders.forEach(o => { // Use 'orders' (all time) to determine true loyalty status
            if (o.customerId) counts[o.customerId] = (counts[o.customerId] || 0) + 1;
        });

        let singleBuyers = 0;
        let repeatBuyers = 0;

        // Only count customers present in current 'filteredOrders' view
        const currentCustomers = new Set(filteredOrders.map(o => o.customerId));
        
        currentCustomers.forEach(uid => {
            if (counts[uid] > 1) repeatBuyers++;
            else singleBuyers++;
        });

        if (singleBuyers === 0 && repeatBuyers === 0) return [];

        return [
            { name: t('oneTime'), population: singleBuyers, color: '#648DDB', legendFontColor: '#333', legendFontSize: 12 },
            { name: t('repeat'), population: repeatBuyers, color: '#FF8A65', legendFontColor: '#333', legendFontSize: 12 },
        ];
    }, [orders, filteredOrders, t]);

    const processedTopAgencies = useMemo(() => getTopAgencies(filteredOrders), [filteredOrders]);

    // --- LISTS ---
    const topAgenciesList = useMemo(() => {
        return processedTopAgencies.map(([name, data], index) => (
            <TouchableOpacity
                key={name}
                style={styles.rankRow}
                onPress={() => router.push({ pathname: '/admin-analysis-agency-profile', params: { agencyName: name } })}
                activeOpacity={0.7}
            >
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(index) }]}>
                    <Text style={styles.rankBadgeText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rankName}>{name}</Text>
                    <Text style={styles.rankSub}>{data.orders} {t('ordersLabel')}</Text>
                </View>
                <Text style={styles.rankValue}>RM {Number(data.revenue).toFixed(0)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CCC" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
        ));
    }, [processedTopAgencies, t]);

    const topItemsList = useMemo(() => {
        const map = {};
        filteredOrders.forEach(o => {
            o.items?.forEach(i => {
                const name = i.title || "Unknown Item";
                if (!map[name]) {
                    map[name] = {
                        title: name,
                        image: i.image || i.imageUrl,
                        count: 0,
                        revenue: 0
                    };
                }
                map[name].count += (Number(i.quantity) || 1);
                map[name].revenue += (Number(i.price) * (Number(i.quantity) || 1));
            });
        });

        const sorted = Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);

        return sorted.map((item, index) => (
            <View key={index} style={styles.rankRow}>
                <View style={[styles.rankBadge, { backgroundColor: getRankColor(index) }]}>
                    <Text style={styles.rankBadgeText}>{index + 1}</Text>
                </View>
                <Image 
                    source={{ uri: item.image || 'https://via.placeholder.com/50' }} 
                    style={styles.itemImage}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rankName} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.rankSub}>{item.count} {t('sold')}</Text>
                </View>
                <Text style={styles.rankValue}>RM {item.revenue.toFixed(0)}</Text>
            </View>
        ));
    }, [filteredOrders, t]);

    const handleDataPointClick = (data) => {
        const { value, index } = data;
        const label = revenueTrend.labels[index];
        setSelectedPoint({ label, value });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#648DDB" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('analyticsDashboard')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* TIME FILTER (Horizontal Scroll) */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
                    {['7', '30', '90', 'all'].map((range) => (
                        <TouchableOpacity 
                            key={range} 
                            style={[styles.tab, timeRange === range && styles.activeTab]}
                            onPress={() => setTimeRange(range)}
                        >
                            <Text style={[styles.tabText, timeRange === range && styles.activeTabText]}>
                                {range === 'all' ? t('allTime') : `${t('last')} ${range} ${t('days')}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView 
                contentContainerStyle={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#648DDB']} />}
            >
                {/* METRICS */}
                <View style={styles.gridContainer}>
                    <LinearGradient colors={['#648DDB', '#5A8AE4']} style={styles.mainCard}>
                        <View>
                            <Text style={styles.cardLabel}>{t('totalRevenue')}</Text>
                            <Text style={styles.cardValue}>RM {stats.revenue}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{stats.orders} {t('totalOrders')}</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.rightColumn}>
                        <View style={styles.smallCard}>
                            <Text style={styles.smallLabel}>{t('avgOrder')}</Text>
                            <Text style={styles.smallValue}>RM {stats.aov}</Text>
                        </View>
                        <View style={styles.smallCard}>
                            <Text style={styles.smallLabel}>{t('peakDay')}</Text>
                            <Text style={styles.smallValue}>{stats.peakDay}</Text>
                        </View>
                    </View>
                </View>

                {/* REVENUE TREND */}
                <Text style={styles.sectionTitle}>{t('revenueTrend')}</Text>
                <View style={styles.chartContainer}>
                    {selectedPoint && (
                        <View style={styles.tooltip}>
                            <Text style={styles.tooltipText}>{selectedPoint.label}: RM {selectedPoint.value.toFixed(2)}</Text>
                        </View>
                    )}
                    <LineChart
                        data={{ labels: revenueTrend.labels, datasets: [{ data: revenueTrend.values }] }}
                        width={screenWidth} height={220} chartConfig={chartConfig} bezier
                        onDataPointClick={handleDataPointClick}
                        style={styles.chart}
                        withInnerLines={false} withOuterLines={false}
                    />
                    <Text style={styles.hintText}>{t('tapForDetails')}</Text>
                </View>

                {/* TOP ITEMS */}
                <Text style={styles.sectionTitle}>{t('topSellingItems')}</Text>
                <View style={styles.rankingContainer}>
                    {topItemsList.length > 0 ? topItemsList : <Text style={styles.noDataText}>{t('noItemsSold')}</Text>}
                </View>

                {/* TOP AGENCIES */}
                <Text style={styles.sectionTitle}>{t('topAgencies')}</Text>
                <View style={styles.rankingContainer}>
                    {topAgenciesList.length > 0 ? topAgenciesList : <Text style={styles.noDataText}>{t('noData')}</Text>}
                </View>

                {/* PIE CHARTS */}
                <Text style={styles.sectionTitle}>{t('ordersByAgency')}</Text>
                <PieChart
                    data={agencyChart} width={screenWidth} height={220} chartConfig={chartConfig} 
                    accessor="population" backgroundColor="transparent" paddingLeft="0" absolute
                />

                <Text style={styles.sectionTitle}>{t('ordersPerDay')}</Text>
                <BarChart
                    data={{ labels: ordersByDate.labels, datasets: [{ data: ordersByDate.values }] }}
                    width={screenWidth} height={220} chartConfig={chartConfig} style={styles.chart}
                />

                <Text style={styles.sectionTitle}>{t('custLoyalty')}</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/admin-analysis-cust-list')}>
                    {customerSegments.length > 0 ? (
                        <PieChart
                            data={customerSegments} width={screenWidth} height={180} chartConfig={chartConfig} 
                            accessor="population" backgroundColor="transparent" paddingLeft="0" absolute
                        />
                    ) : <Text style={styles.noDataText}>{t('noCustData')}</Text>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const getRankColor = (index) => {
    switch(index) {
        case 0: return '#FFD700'; 
        case 1: return '#C0C0C0'; 
        case 2: return '#CD7F32'; 
        default: return '#E0E0E0'; 
    }
};

const chartConfig = {
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(100, 141, 219, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#648DDB" },
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    // Filters
    filterWrapper: { backgroundColor: '#F9FAFB', paddingVertical: 10 },
    tabContainer: { paddingHorizontal: 15 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#E0E0E0', borderRadius: 20, marginRight: 10, minWidth: 60, alignItems: 'center', justifyContent: 'center' },
    activeTab: { backgroundColor: '#648DDB' },
    tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
    activeTabText: { color: '#FFF' },

    content: { paddingHorizontal: 20, paddingBottom: 40 },
    
    // Grid
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 15, height: 160 },
    mainCard: { width: '58%', height: '100%', padding: 20, borderRadius: 16, justifyContent: 'space-between', shadowColor: "#648DDB", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },
    cardLabel: { color: '#FFF', fontSize: 14, fontWeight: '500' },
    cardValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start' },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

    rightColumn: { width: '38%', height: '100%', justifyContent: 'space-between' },
    smallCard: { height: '47%', width: '100%', padding: 12, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', justifyContent: 'center' },
    smallLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    smallValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
    
    // Charts
    chartContainer: { position: 'relative', backgroundColor: '#FFF', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
    chart: { borderRadius: 15, marginVertical: 5 },
    tooltip: { position: 'absolute', top: 10, right: 10, backgroundColor: '#333', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, zIndex: 10 },
    tooltipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    hintText: { fontSize: 10, color: '#AAA', fontStyle: 'italic', marginBottom: 5, textAlign: 'center' },

    // Rankings
    rankingContainer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE', padding: 5 },
    rankRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    rankBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    rankBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
    itemImage: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#EEE', marginRight: 8 },
    rankName: { fontSize: 14, fontWeight: '600', color: '#333' },
    rankSub: { fontSize: 12, color: '#777' },
    rankValue: { fontSize: 14, fontWeight: 'bold', color: '#648DDB' },
    noDataText: { padding: 20, textAlign: 'center', color: '#999', fontStyle: 'italic' }
});