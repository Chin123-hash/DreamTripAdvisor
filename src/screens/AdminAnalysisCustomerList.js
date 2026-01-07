import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { getAllOrders, getAllUsers } from '../services/AuthService';

export default function CustomerListScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); 

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const [usersData, ordersData] = await Promise.all([
                getAllUsers(),
                getAllOrders()
            ]);

            // 1. Get all travellers
            const travellers = (usersData || []).filter(user => user.role === 'traveller');

            // 2. Map orders to travellers
            const travellersWithCounts = travellers.map(user => {
                const userOrders = (ordersData || []).filter(o =>
                    o.customerId === user.id || o.userId === user.id
                );
                return {
                    ...user,
                    orderCount: userOrders.length,
                    // Calculate Total Spent based on orders
                    totalSpent: userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0) 
                };
            });

            // Sort by order count desc (most valuable customers first)
            travellersWithCounts.sort((a, b) => b.orderCount - a.orderCount);

            setAllUsers(travellersWithCounts);
        } catch (error) {
            console.error("Data Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        let list = allUsers;

        // --- FILTER LOGIC ---
        if (activeTab === 'new') {
            // New/One-time: Exactly 1 order
            list = list.filter(u => u.orderCount === 1);
        } else if (activeTab === 'returning') {
            // Returning/Repeat: More than 1 order
            list = list.filter(u => u.orderCount > 1);
        }
        
        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            list = list.filter(customer =>
                customer.fullName?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query)
            );
        }
        
        return list;
    }, [allUsers, searchQuery, activeTab]);

    // Map internal tab keys to localized UI labels
    const getTabLabel = (tabKey) => {
        switch(tabKey) {
            case 'all': return t('all');
            case 'new': return t('oneTime'); 
            case 'returning': return t('repeat'); 
            default: return tabKey;
        }
    };

    const renderCustomerItem = ({ item }) => (
        <TouchableOpacity style={styles.customerCard}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
                {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {item.fullName?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.customerName}>{item.fullName || 'Unknown User'}</Text>
                <Text style={styles.customerEmail}>{item.email}</Text>
                
                <View style={styles.statsRow}>
                    {/* Order Count Badge */}
                    <View style={[styles.badge, { backgroundColor: item.orderCount > 1 ? '#E8F5E9' : '#E3F2FD' }]}>
                        <Text style={[styles.badgeText, { color: item.orderCount > 1 ? '#2E7D32' : '#1565C0' }]}>
                            {item.orderCount} {t('ordersLabel')}
                        </Text>
                    </View>
                    
                    {/* Total Spent Text */}
                    <Text style={styles.spentText}>
                        {t('totalSpent')}: RM {item.totalSpent?.toFixed(2) || '0.00'}
                    </Text>
                </View>

                {/* Joined Date */}
                <Text style={styles.dateText}>
                    {t('joined')}: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('customers')}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.tabContainer}>
                {['all', 'new', 'returning'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {getTabLabel(tab)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#648DDB" />
                </View>
            ) : (
                <FlatList
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCustomerItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="people-outline" size={50} color="#DDD" />
                            <Text style={styles.emptyText}>{t('noCustomersFound')}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        height: 50
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: '100%', fontSize: 16 },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#EEE',
        marginHorizontal: 15,
        marginBottom: 10,
        borderRadius: 10,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        textTransform: 'capitalize',
    },
    activeTabText: {
        color: '#648DDB',
    },

    // List
    listContent: { padding: 15 },
    customerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    avatarContainer: { marginRight: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#648DDB', justifyContent: 'center', alignItems: 'center'
    },
    avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    
    infoContainer: { flex: 1 },
    customerName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    customerEmail: { fontSize: 14, color: '#666', marginBottom: 5 },
    
    // Stats Row
    statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3, 
        borderRadius: 6, 
        marginRight: 10
    },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    spentText: { fontSize: 12, color: '#444', fontWeight: '500' },
    
    dateText: { fontSize: 11, color: '#999', marginTop: 2 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', fontSize: 16, marginTop: 10 },
});