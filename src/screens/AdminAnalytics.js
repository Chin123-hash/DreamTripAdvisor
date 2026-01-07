import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
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
import { getAllOrders, getCategoryRevenue, getTopAgencies, getTopSellingItems } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

const screenWidth = Dimensions.get('window').width - 40;

export default function AdminAnalyticsScreen() {
    const router = useRouter();
    // 2. Destructure Hook
    const { t } = useLanguage();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
        }
    };

    const getFormattedDate = (createdAt) => {
        if (!createdAt) return "Unknown";
        if (createdAt.toDate) return createdAt.toDate().toLocaleDateString(); // Firebase Timestamp
        return new Date(createdAt).toLocaleDateString(); // ISO String
    };
    /* =======================
        AGGREGATED STATS
    ======================== */
    const stats = useMemo(() => {
        const revenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        const agencies = new Set(orders.map(o => o.agencyName)).size;
        const customers = new Set(orders.map(o => o.customerId)).size;

        return {
            revenue: revenue.toFixed(2),
            orders: orders.length,
            agencies,
            customers,
        };
    }, [orders]);

    /* =======================
        REVENUE TREND (LINE)
    ======================== */
    const revenueTrend = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            const date = getFormattedDate(o.createdAt);
            map[date] = (map[date] || 0) + (Number(o.totalAmount) || 0);
        });

        const labels = Object.keys(map).slice(-7);
        const values = labels.map(l => map[l]);
        return values.length === 0 ? { labels: ["No Data"], values: [0] } : { labels, values };
    }, [orders]);

    /* =======================
        ORDERS BY AGENCY (PIE)
    ======================== */
    const agencyChart = useMemo(() => {
        const map = {};

        orders.forEach(o => {
            map[o.agencyName] = (map[o.agencyName] || 0) + 1;
        });

        const colors = ['#648DDB', '#FF8A65', '#81C784', '#BA68C8', '#FFD54F'];

        return Object.keys(map).map((key, index) => ({
            name: key,
            population: map[key],
            color: colors[index % colors.length],
            legendFontColor: '#333',
            legendFontSize: 12,
        }));
    }, [orders]);

    /* =======================
        ORDERS PER DAY (BAR)
    ======================== */
    const ordersByDate = useMemo(() => {
        const map = {};

        orders.forEach(o => {
            const date = o.createdAt?.toDate
                ? o.createdAt.toDate().toLocaleDateString()
                : new Date(o.createdAt).toLocaleDateString();

            map[date] = (map[date] || 0) + 1;
        });

        const labels = Object.keys(map).slice(-7);
        const values = labels.map(l => map[l]);

        // Fix for empty data
        if (values.length === 0) return { labels: ["No Data"], values: [0] };

        return { labels, values };
    }, [orders]);

    const processedTopAgencies = useMemo(() => {
        return getTopAgencies(orders);
    }, [orders]);

    // --- NEW: The missing Top Agencies List UI ---
    const topAgenciesList = useMemo(() => {
        return processedTopAgencies.map(([name, data], index) => (
            <TouchableOpacity
                key={name}
                style={styles.rankRow}
                onPress={() => {
                    // Navigate to agency details and pass the agency name
                    router.push({
                        pathname: '/admin-analysis-agency-profile',
                        params: { agencyName: name }
                    });
                }}
                activeOpacity={0.7}
            >
                <Text style={styles.rankIndex}>#{index + 1}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.rankName}>{name}</Text>
                    <Text style={styles.rankSub}>{data.orders} {t('ordersLabel')}</Text>
                </View>
                <Text style={styles.rankName}>RM {Number(data.revenue).toFixed(2)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#CCC" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
        ));
    }, [processedTopAgencies, t]);

    const processedCategoryData = useMemo(() => {
        const dataMap = getCategoryRevenue(orders);
        const colors = ['#4DB6AC', '#FF8A65', '#BA68C8', '#648DDB'];

        return Object.keys(dataMap).map((key, index) => ({
            name: key.toUpperCase(),
            population: dataMap[key],
            color: colors[index % colors.length],
            legendFontColor: '#333',
            legendFontSize: 12,
        }));
    }, [orders]);

    const processedTopItems = useMemo(() => {
        return getTopSellingItems(orders);
    }, [orders]);

    const customerSegments = useMemo(() => {
        const seen = new Set();
        let newUsers = 0;
        let returningUsers = 0;

        orders.forEach(o => {
            if (seen.has(o.customerId)) {
                returningUsers++;
            } else {
                newUsers++;
                seen.add(o.customerId);
            }
        });

        return [
            {
                name: "New Customers",
                population: newUsers,
                color: '#81C784',
                legendFontColor: '#333',
                legendFontSize: 12,
            },
            {
                name: "Returning Customers",
                population: returningUsers,
                color: '#FFB74D',
                legendFontColor: '#333',
                legendFontSize: 12,
            },
        ];
    }, [orders]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('analyticsDashboard')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#648DDB" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Overview */}
                    <View style={styles.row}>
                        <LinearGradient colors={['#333', '#555']} style={styles.card}>
                            <Text style={styles.cardLabel}>{t('totalRevenue')}</Text>
                            <Text style={styles.cardValue}>RM {stats.revenue}</Text>
                        </LinearGradient>

                            <TouchableOpacity
                                style={styles.lightCard}
                                onPress={() => {
                                    // Option A: Navigate to a list of orders
                                    router.push('/admin-order-dashboard');
                                }}
                                activeOpacity={0.7} // Adds a nice dimming effect when pressed
                            >
                                <Text style={styles.lightLabel}>{t('ordersLabel')}</Text>
                                <Text style={styles.lightValue}>{stats.orders}</Text>
                            </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                            <TouchableOpacity
                                style={styles.lightCard}
                                onPress={() => {
                                    // Option A: Navigate to a list of orders
                                    router.push('/manage-agency');
                                }}
                                activeOpacity={0.7} // Adds a nice dimming effect when pressed
                            >
                                <Text style={styles.lightLabel}>{t('agenciesCount')}</Text>
                                <Text style={styles.lightValue}>{stats.agencies}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.lightCard}
                                onPress={() => {
                                    // Option A: Navigate to a list of orders
                                    router.push('/admin-user-list');
                                }}
                                activeOpacity={0.7} // Adds a nice dimming effect when pressed
                            >
                                <Text style={styles.lightLabel}>{t('customers')}</Text>
                                <Text style={styles.lightValue}>{stats.customers}</Text>
                            </TouchableOpacity>
                    </View>

                    {/* Charts */}
                    <Text style={styles.sectionTitle}>{t('revenueTrend')}</Text>
                    <LineChart
                        data={{
                            labels: revenueTrend.labels,
                            datasets: [{ data: revenueTrend.values }],
                        }}
                        width={screenWidth}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                    />

                    <Text style={styles.sectionTitle}>{t('ordersByAgency')}</Text>
                    <PieChart
                        data={agencyChart}
                        width={screenWidth}
                        height={220}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />

                    <Text style={styles.sectionTitle}>{t('ordersPerDay')}</Text>
                    <BarChart
                        data={{
                            labels: ordersByDate.labels,
                            datasets: [{ data: ordersByDate.values }],
                        }}
                        width={screenWidth}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                    />
                        <Text style={styles.sectionTitle}>Top Agencies</Text>
                        {topAgenciesList}
                        <Text style={styles.sectionTitle}>Customer Segments</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => router.push('/admin-analysis-cust-list')} // Navigate to your customer list route
                        >
                            <PieChart
                                data={customerSegments}
                                width={screenWidth}
                                height={180}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                            // absolute // Remove absolute if you want to show percentages like in your image
                            />
                        </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

/* =======================
    STYLES
======================= */

const chartConfig = {
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(100, 141, 219, ${opacity})`,
    labelColor: () => '#666',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },

    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    content: { paddingHorizontal: 20, paddingBottom: 40 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },

    card: {
        width: '48%',
        padding: 15,
        borderRadius: 15,
    },

    cardLabel: { color: '#FFF', fontSize: 13 },
    cardValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },

    lightCard: {
        width: '48%',
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#EEE',
    },

    lightLabel: { fontSize: 13, color: '#777' },
    lightValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 15,
    },

    chart: {
        borderRadius: 15,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        marginBottom: 10,
    },

    rankIndex: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 30,
        color: '#648DDB',
    },

    rankName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },

    rankSub: {
        fontSize: 12,
        color: '#777',
    },

});