import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            // This now works because getAllOrders is imported!
            const [usersData, ordersData] = await Promise.all([
                getAllUsers(),
                getAllOrders()
            ]);

            const travellers = (usersData || []).filter(user => user.role === 'traveller');

            // Calculate orderCount by matching the user ID
            const travellersWithCounts = travellers.map(user => {
                const userOrders = (ordersData || []).filter(o =>
                    o.customerId === user.id || o.userId === user.id
                );
                return {
                    ...user,
                    orderCount: userOrders.length
                };
            });

            setAllUsers(travellersWithCounts);
        } catch (error) {
            console.error("Data Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        let list = allUsers;

        // Change 'new' logic to include people with 0 orders so the list isn't empty
        if (activeTab === 'new') {
            list = list.filter(u => (u.orderCount || 0) <= 1);
        } else if (activeTab === 'returning') {
            list = list.filter(u => (u.orderCount || 0) > 1);
        }

        // Always ensure we return the searched list
        return list.filter(customer =>
            customer.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allUsers, searchQuery, activeTab]);

    const renderCustomerItem = ({ item }) => (
        <TouchableOpacity
            style={styles.customerCard}
            onPress={() => router.push(`/admin/user-details?id=${item.id}`)}
        >
            <View style={styles.avatarContainer}>
                {item.profileImage ? (
                    <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {item.fullName?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.customerName}>{item.fullName || 'Unknown User'}</Text>
                <Text style={styles.customerEmail}>{item.email}</Text>
                <View style={styles.tagRow}>
                    <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{t('traveller')}</Text>
                    </View>
                    <Text style={styles.dateText}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
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

            {/* Search Bar
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('searchCustomers')}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View> */}

            <View style={styles.tabContainer}>
                {['all', 'new', 'returning'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {t(tab)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 45, fontSize: 16 },
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
    tagRow: { flexDirection: 'row', alignItems: 'center' },
    roleTag: {
        backgroundColor: '#E3F2FD', paddingHorizontal: 8,
        paddingVertical: 2, borderRadius: 6, marginRight: 10
    },
    roleTagText: { fontSize: 10, color: '#1976D2', fontWeight: 'bold', textTransform: 'uppercase' },
    dateText: { fontSize: 12, color: '#999' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', fontSize: 16 },
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
});