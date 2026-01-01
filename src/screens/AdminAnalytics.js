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
import { getAllOrders } from '../services/AuthService';

const screenWidth = Dimensions.get('window').width - 40;

export default function AdminAnalyticsScreen() {
    const router = useRouter();
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
            const date = o.createdAt?.toDate
                ? o.createdAt.toDate().toLocaleDateString()
                : new Date(o.createdAt).toLocaleDateString();

            map[date] = (map[date] || 0) + Number(o.totalAmount || 0);
        });

        const labels = Object.keys(map).slice(-7);
        const values = labels.map(l => map[l]);

        return { labels, values };
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

        return { labels, values };
    }, [orders]);

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Overview */}
                <View style={styles.row}>
                    <LinearGradient colors={['#333', '#555']} style={styles.card}>
                        <Text style={styles.cardLabel}>Total Revenue</Text>
                        <Text style={styles.cardValue}>RM {stats.revenue}</Text>
                    </LinearGradient>

                    <View style={styles.lightCard}>
                        <Text style={styles.lightLabel}>Orders</Text>
                        <Text style={styles.lightValue}>{stats.orders}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.lightCard}>
                        <Text style={styles.lightLabel}>Agencies</Text>
                        <Text style={styles.lightValue}>{stats.agencies}</Text>
                    </View>
                    <View style={styles.lightCard}>
                        <Text style={styles.lightLabel}>Customers</Text>
                        <Text style={styles.lightValue}>{stats.customers}</Text>
                    </View>
                </View>

                {/* Revenue Trend */}
                <Text style={styles.sectionTitle}>Revenue Trend</Text>
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

                {/* Orders by Agency */}
                <Text style={styles.sectionTitle}>Orders by Agency</Text>
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

                {/* Orders per Day */}
                <Text style={styles.sectionTitle}>Orders per Day</Text>
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
            </ScrollView>
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

    headerTitle: { fontSize: 18, fontWeight: 'bold' },

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
    lightValue: { fontSize: 24, fontWeight: 'bold' },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 15,
    },

    chart: {
        borderRadius: 15,
    },
});
