import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getAllOrders, getAllUsers } from '../services/AuthService';

export default function AgencyDetailsScreen() {
    const { agencyName } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [agencyInfo, setAgencyInfo] = useState(null);
    const [agencyOrders, setAgencyOrders] = useState([]);

    useEffect(() => {
        loadData();
    }, [agencyName]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [orders, users] = await Promise.all([
                getAllOrders(),
                getAllUsers()
            ]);

            // 1. Find Agency Profile Info
            const profile = users.find(u => u.agencyName === agencyName || u.fullName === agencyName);
            setAgencyInfo(profile);

            // 2. Filter Orders for this Agency
            const filteredOrders = orders.filter(o => o.agencyName === agencyName);
            setAgencyOrders(filteredOrders);
        } catch (error) {
            console.error("Error loading agency details:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Totals
    const totalRevenue = useMemo(() =>
        agencyOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
        [agencyOrders]);

    const renderOrderCard = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{new Date(item.createdAt?.seconds * 1000).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.customerName}>{t('customer')}: {item.customerName || 'Guest'}</Text>
            <View style={styles.divider} />
            <View style={styles.orderFooter}>
                <Text style={styles.itemCount}>{item.items?.length || 0} {t('items')}</Text>
                <Text style={styles.orderAmount}>RM {Number(item.totalAmount).toFixed(2)}</Text>
            </View>
        </View>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#648DDB" /></View>;

    return (
        <View style={styles.container}>
            {/* Header Navigation */}
            <View style={styles.headerNav}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('agencyProfile')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Agency Info Header */}
            <View style={styles.profileHeader}>
                <Image
                    source={{
                        uri: agencyInfo?.logoUrl || 'https://via.placeholder.com/150/648DDB/FFFFFF?text=Agency'
                    }}
                    style={styles.logo}
                />
                <Text style={styles.nameText}>{agencyName}</Text>
                <Text style={styles.licenseText}>{t('license')}: {agencyInfo?.licenseNo || 'N/A'}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{agencyOrders.length}</Text>
                        <Text style={styles.statLabel}>{t('totalOrders')}</Text>
                    </View>
                    <View style={[styles.statBox, styles.borderLeft]}>
                        <Text style={styles.statValue}>RM {totalRevenue.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>{t('totalRevenue')}</Text>
                    </View>
                </View>
            </View>

            {/* Orders List */}
            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>{t('recentOrders')}</Text>
                <FlatList
                    data={agencyOrders}
                    renderItem={renderOrderCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>{t('noOrdersFound')}</Text>}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    headerNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#648DDB',
        paddingTop: 50
    },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    profileHeader: {
        backgroundColor: '#648DDB',
        alignItems: 'center',
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30
    },
    logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', marginBottom: 10 },
    nameText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    licenseText: { color: '#E0E0E0', fontSize: 14, marginBottom: 20 },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: 'white',
        width: '85%',
        borderRadius: 15,
        padding: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    statBox: { flex: 1, alignItems: 'center' },
    borderLeft: { borderLeftWidth: 1, borderLeftColor: '#EEE' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    statLabel: { fontSize: 12, color: '#888' },
    listSection: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    orderCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 12 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderId: { fontWeight: 'bold', color: '#648DDB' },
    orderDate: { color: '#999', fontSize: 12 },
    customerName: { fontSize: 14, color: '#444' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemCount: { color: '#888', fontSize: 13 },
    orderAmount: { fontWeight: 'bold', fontSize: 16, color: '#2E7D32' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { textAlign: 'center', marginTop: 20, color: '#999' }
});