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
    LineChart,
    PieChart,
} from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { getAgencyOrders } from '../services/AuthService';

const screenWidth = Dimensions.get('window').width - 40;

export default function AgencyAnalyticsScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    // --- STATE ---
    const [allOrders, setAllOrders] = useState([]); 
    const [filteredOrders, setFilteredOrders] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('30'); 
    const [selectedPoint, setSelectedPoint] = useState(null); 

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getAgencyOrders();
            const sorted = data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateA - dateB; 
            });
            setAllOrders(sorted);
        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, []);

    useEffect(() => {
        if (timeRange === 'all') {
            setFilteredOrders(allOrders);
            return;
        }
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - parseInt(timeRange));

        const filtered = allOrders.filter(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            return d >= cutoff;
        });
        setFilteredOrders(filtered);
        setSelectedPoint(null); 
    }, [timeRange, allOrders]);

    /* =======================
        STATS & GROWTH
    ======================== */
    const stats = useMemo(() => {
        const revenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        const uniqueCustomers = new Set(filteredOrders.map(o => o.customerId)).size;
        const avgOrderValue = filteredOrders.length > 0 ? revenue / filteredOrders.length : 0;

        const days = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
        const dayCounts = {};
        
        filteredOrders.forEach(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            const dayName = days[d.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });
        const peakDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

        let revenueGrowth = 0;
        if (timeRange !== 'all') {
            const daysCount = parseInt(timeRange);
            const now = new Date();
            const currentPeriodStart = new Date();
            currentPeriodStart.setDate(now.getDate() - daysCount);
            const prevPeriodStart = new Date(currentPeriodStart);
            prevPeriodStart.setDate(prevPeriodStart.getDate() - daysCount);

            const prevRevenue = allOrders
                .filter(o => {
                    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                    return d >= prevPeriodStart && d < currentPeriodStart;
                })
                .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
            
            if (prevRevenue > 0) {
                revenueGrowth = ((revenue - prevRevenue) / prevRevenue) * 100;
            } else if (revenue > 0) {
                revenueGrowth = 100;
            }
        }

        return {
            revenue: revenue.toFixed(2),
            orders: filteredOrders.length,
            customers: uniqueCustomers,
            aov: avgOrderValue.toFixed(0),
            peakDay: peakDayEntry ? peakDayEntry[0] : 'N/A',
            revenueGrowth: revenueGrowth.toFixed(1)
        };
    }, [filteredOrders, timeRange, allOrders, t]);

    /* =======================
        CHART DATA LOGIC
    ======================== */
    const revenueTrend = useMemo(() => {
        if (filteredOrders.length === 0) return { labels: [t('noData')], values: [0] };
        const map = {};
        filteredOrders.forEach(o => {
            const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
            const key = `${d.getDate()}/${d.getMonth() + 1}`;
            map[key] = (map[key] || 0) + Number(o.totalAmount || 0);
        });
        const labels = Object.keys(map);
        const values = Object.values(map);
        if (labels.length > 7) return { labels: labels.slice(-6), values: values.slice(-6) };
        return { labels, values };
    }, [filteredOrders, t]);

    const customerRetention = useMemo(() => {
        const activeCustomerIds = [...new Set(filteredOrders.map(o => o.customerId))];
        if (activeCustomerIds.length === 0) return [];
        let typeA_Count = 0; 
        let typeB_Count = 0; 

        if (timeRange === 'all') {
             activeCustomerIds.forEach(uid => {
                 const orderCount = allOrders.filter(o => o.customerId === uid).length;
                 if (orderCount > 1) typeB_Count++; else typeA_Count++; 
             });
             return [
                { name: t('oneTime'), population: typeA_Count, color: "#648DDB", legendFontColor: "#7F7F7F", legendFontSize: 12 },
                { name: t('repeat'), population: typeB_Count, color: "#FF8A65", legendFontColor: "#7F7F7F", legendFontSize: 12 }
            ];
        } else {
            const now = new Date();
            const cutoff = new Date();
            cutoff.setDate(now.getDate() - parseInt(timeRange));
            activeCustomerIds.forEach(uid => {
                const customerOrders = allOrders.filter(o => o.customerId === uid);
                customerOrders.sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
                const firstOrder = customerOrders[0];
                const firstDate = firstOrder.createdAt?.toDate ? firstOrder.createdAt.toDate() : new Date(firstOrder.createdAt);
                if (firstDate >= cutoff) typeA_Count++; else typeB_Count++; 
            });
            return [
                { name: t('newCust'), population: typeA_Count, color: "#4CAF50", legendFontColor: "#7F7F7F", legendFontSize: 12 },
                { name: t('returning'), population: typeB_Count, color: "#FF9800", legendFontColor: "#7F7F7F", legendFontSize: 12 }
            ];
        }
    }, [allOrders, filteredOrders, timeRange, t]);

    const topItems = useMemo(() => {
        const map = {};
        filteredOrders.forEach(o => {
            o.items?.forEach(i => {
                const name = i.title || "Unknown Item";
                if (!map[name]) {
                    map[name] = { title: name, image: i.image || i.imageUrl || 'https://via.placeholder.com/50', count: 0 };
                }
                map[name].count += (Number(i.quantity) || 1);
            });
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [filteredOrders]);

    // --- HANDLERS ---
    const handleDataPointClick = (data) => {
        const { value, index } = data;
        const label = revenueTrend.labels[index];
        setSelectedPoint({ label, value });
    };

    const GrowthBadge = ({ value }) => {
        const num = parseFloat(value);
        if (isNaN(num) || num === 0) return null;
        const isPositive = num > 0;
        return (
            <View style={[styles.growthBadge, { backgroundColor: isPositive ? 'rgba(255,255,255,0.2)' : 'rgba(255,200,200,0.3)' }]}>
                <Ionicons name={isPositive ? "arrow-up" : "arrow-down"} size={10} color={isPositive ? "#FFF" : "#FFCDD2"} />
                <Text style={[styles.growthText, !isPositive && {color: '#FFCDD2'}]}>{Math.abs(num)}%</Text>
            </View>
        );
    };

    const getRankColor = (index) => {
        switch(index) {
            case 0: return '#FFD700'; 
            case 1: return '#C0C0C0'; 
            case 2: return '#CD7F32'; 
            default: return '#E0E0E0'; 
        }
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

            {/* --- UPDATED: Horizontal Scroll Filter Tabs --- */}
            <View style={styles.filterWrapper}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.tabContainer}
                >
                    {['7', '30', '90', '180', 'all'].map((range) => (
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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#648DDB']} />
                }
            >
                
                {/* KEY METRICS GRID */}
                <View style={styles.gridContainer}>
                    <LinearGradient colors={['#648DDB', '#5A8AE4']} style={styles.mainCard}>
                        <View>
                            <Text style={styles.cardLabel}>{t('totalRevenue')}</Text>
                            <Text style={styles.cardValue}>RM {stats.revenue}</Text>
                        </View>
                        <View style={styles.rowBetween}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{filteredOrders.length} {t('ordersLabel')}</Text>
                            </View>
                            {timeRange !== 'all' && <GrowthBadge value={stats.revenueGrowth} />}
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

                {/* TOP ITEMS (RANKING TABLE) */}
                <Text style={styles.sectionTitle}>{t('topSelling')}</Text>
                <View style={styles.rankingContainer}>
                    {topItems.length > 0 ? (
                        topItems.map((item, index) => (
                            <View key={index} style={styles.rankRow}>
                                <View style={[styles.rankBadge, { backgroundColor: getRankColor(index) }]}>
                                    <Text style={[styles.rankText, index > 2 && { color: '#555' }]}>{index + 1}</Text>
                                </View>
                                
                                <Image 
                                    source={{ uri: item.image }} 
                                    style={styles.rankImage} 
                                    resizeMode="cover"
                                />
                                
                                <View style={styles.rankInfo}>
                                    <Text style={styles.rankTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.rankSales}>{item.count} {t('salesCount')}</Text>
                                </View>

                                {index === 0 && <Ionicons name="trophy" size={20} color="#FFD700" />}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noData}>{t('noItemSales')}</Text>
                    )}
                </View>

                {/* CUSTOMER RETENTION */}
                <Text style={styles.sectionTitle}>
                    {timeRange === 'all' ? t('customerLoyalty') : t('customerAcquisition')}
                </Text>
                <View style={styles.chartContainer}>
                    {customerRetention.length > 0 ? (
                        <PieChart
                            data={customerRetention}
                            width={screenWidth} height={200}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    ) : <Text style={styles.noData}>{t('noCustomerData')}</Text>}
                </View>

                <View style={{height: 40}} />
            </ScrollView>
        </SafeAreaView>
    );
}

const chartConfig = {
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(100, 141, 219, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    propsForDots: { r: "5", strokeWidth: "2", stroke: "#648DDB" },
    propsForBackgroundLines: { strokeDasharray: "" }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerBar: { 
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: '#EEE'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    // --- Updated Filter Styles ---
    filterWrapper: {
        backgroundColor: '#F9FAFB',
        paddingVertical: 10,
    },
    tabContainer: {
        paddingHorizontal: 15, // Space at start/end of scroll
    },
    tab: { 
        paddingVertical: 8, 
        paddingHorizontal: 16, 
        backgroundColor: '#E0E0E0', 
        borderRadius: 20, 
        marginRight: 10, // Space between tabs
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    activeTab: { backgroundColor: '#648DDB' },
    tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
    activeTabText: { color: '#FFF' },

    content: { paddingHorizontal: 20, paddingBottom: 40 },
    
    // Grid
    gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, height: 160 },
    mainCard: { width: '58%', height: '100%', borderRadius: 16, padding: 20, justifyContent: 'space-between', shadowColor: "#648DDB", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 },
    cardLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
    cardValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    
    growthBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginLeft: 5 },
    growthText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', marginLeft: 2 },

    rightColumn: { width: '38%', height: '100%', justifyContent: 'space-between' },
    smallCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, height: '47%', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
    smallLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    smallValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 10 },
    chartContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEE', alignItems: 'center' },
    chart: { marginVertical: 8, borderRadius: 16 },
    tooltip: { position: 'absolute', top: 10, right: 10, backgroundColor: '#333', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, zIndex: 10 },
    tooltipText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    hintText: { fontSize: 10, color: '#AAA', fontStyle: 'italic', marginBottom: 5 },
    noData: { color: '#999', fontStyle: 'italic', marginVertical: 10, textAlign: 'center' },

    // RANKING TABLE STYLES
    rankingContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#EEE' },
    rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
    rankImage: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EEE', marginRight: 12 },
    rankInfo: { flex: 1 },
    rankTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2 },
    rankSales: { fontSize: 12, color: '#888' }
});