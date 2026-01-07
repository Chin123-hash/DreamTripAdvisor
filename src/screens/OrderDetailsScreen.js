import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    getEntertainmentById,
    getFoodById,
    getOrderDetails
} from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    // 2. Destructure Hook
    const { t } = useLanguage();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrichedItems, setEnrichedItems] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [params.orderId, params.orderData]);

    const loadOrder = async () => {
        if (!params.orderId && !params.orderData) return;

        setLoading(true);
        try {
            if (params.orderData) {
                const raw = Array.isArray(params.orderData) ? params.orderData[0] : params.orderData;
                const parsed = JSON.parse(raw);
                setOrder(parsed);
                // Immediately fetch fresh data for these items
                await fetchLocationsForItems(parsed.items);
            }
            else if (params.orderId) {
                const cleanId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
                const fetchedOrder = await getOrderDetails(cleanId.trim());

                if (fetchedOrder) {
                    setOrder(fetchedOrder);
                    await fetchLocationsForItems(fetchedOrder.items);
                } else {
                    Alert.alert(t('alertErrorTitle'), "Order ID not found in database.");
                }
            }
        } catch (error) {
            console.error("Error loading order:", error);
            Alert.alert(t('alertErrorTitle'), "Failed to load order details.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLocationsForItems = async (items) => {
        if (!items) return;

        setLoadingLocations(true);
        try {
            const promises = items.map(async (item) => {
                // --- FIX: ALWAYS FETCH FRESH DATA ---
                let fullData = null;
                const itemId = item.itemId || item.id;

                try {
                    if (item.type === 'food') {
                        fullData = await getFoodById(itemId);
                    } else {
                        fullData = await getEntertainmentById(itemId);
                    }
                } catch (err) {
                    console.log("Could not refresh item details, keeping old data.");
                }

                return {
                    ...item,
                    // Priority: 1. Fresh DB Location, 2. Saved Snapshot Location, 3. Title
                    locationURL: fullData?.locationURL || item.locationURL || item.title,
                    // Optional: You can also refresh the title/price if you want:
                    title: fullData?.title || item.title
                };
            });

            const results = await Promise.all(promises);
            setEnrichedItems(results);
        } catch (error) {
            console.error("Error fetching locations:", error);
            setEnrichedItems(items);
        } finally {
            setLoadingLocations(false);
        }
    };

    // --- ROBUST LOCATION PARSER ---
    const getLocationQuery = (item) => {
        const raw = item.locationURL;

        if (!raw || typeof raw !== 'string') {
            return item.title;
        }

        // 1. Try to extract coordinates "lat,lng" from URL
        if (raw.includes('q=')) {
            const match = raw.match(/[?&]q=([^&]+)/);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }
        }

        const coordMatch = raw.match(/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
        if (coordMatch) {
            return `${coordMatch[1]},${coordMatch[2]}`;
        }

        // 2. If valid normal link, might work, but fallback to title usually safer for routes
        if (raw.includes('googleusercontent') || !raw.startsWith('http')) {
            return item.title;
        }

        return item.title;
    };

    const handleOpenRoute = () => {
        // Use enrichedItems (Fresh Data) instead of order.items
        const validItems = enrichedItems.filter(item =>
            (item.locationURL && item.locationURL.trim() !== "") || item.title
        );

        if (validItems.length === 0) {
            Alert.alert(t('noLocationsTitle'), t('noLocationsMsg'));
            return;
        }

        const locations = validItems.map(getLocationQuery);
        console.log("Routing Waypoints:", locations);

        const safeEncode = (str) => encodeURIComponent(str);
        const origin = safeEncode(locations[0]);
        const destination = safeEncode(locations[locations.length - 1]);

        let url = '';

        if (locations.length === 1) {
            url = `https://www.google.com/maps/search/?api=1&query=${origin}`;
        } else {
            let waypoints = '';
            if (locations.length > 2) {
                const intermediate = locations.slice(1, -1);
                waypoints = `&waypoints=${intermediate.map(loc => safeEncode(loc)).join('%7C')}`;
            }

            url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
        }

        Linking.openURL(url).catch(err => {
            console.error("Error opening map:", err);
            Alert.alert(t('alertErrorTitle'), t('errorMap'));
        });
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return '—';
        try {
            const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
            return date.toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch { return '—'; }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#648DDB" />
                    <Text style={{ color: '#999', marginTop: 10 }}>{t('loadingOrder')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
                    <Text style={{ color: '#999', marginTop: 10 }}>{t('orderNotFound')}</Text>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                        <Text style={{ color: '#648DDB' }}>{t('goBack')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Determine which list to render:
    const displayItems = enrichedItems.length > 0 ? enrichedItems : order.items;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('orderDetails')} #{order.id ? order.id.slice(0, 8).toUpperCase() : ''}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Map Route Button */}
                <TouchableOpacity
                    style={[styles.routeButton, loadingLocations && styles.disabledBtn]}
                    onPress={handleOpenRoute}
                    disabled={loadingLocations}
                >
                    {loadingLocations ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Ionicons name="map" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.routeButtonText}>{t('viewRoute')}</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Customer Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('customerInfo')}</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={18} color="#666" />
                            <Text style={styles.infoValue}>{order.customerName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={18} color="#666" />
                            <Text style={styles.infoValue}>{order.customerEmail}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={18} color="#666" />
                            <Text style={styles.infoValue}>{order.customerPhone}</Text>
                        </View>
                    </View>
                </View>

                {/* Trip Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('tripInfo')}</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.planTitle}>{order.planName}</Text>
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.subLabel}>{t('travelDate')}</Text>
                                <Text style={styles.subValue}>{formatDate(order.travelDate)}</Text>
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.subLabel}>{t('pax')}</Text>
                                <Text style={styles.subValue}>{order.pax} {t('pax')}</Text>
                            </View>
                        </View>
                        {order.specialRequest ? (
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.subLabel}>{t('specialRequests')}</Text>
                                <Text style={styles.requestText}>{order.specialRequest}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Items Purchased */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('itineraryItems')}</Text>
                    {displayItems?.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.itemImage} />
                            ) : (
                                <View style={[styles.itemImage, styles.placeholderImg]}>
                                    <Ionicons name="pricetag-outline" size={20} color="#648DDB" />
                                </View>
                            )}
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemType}>{item.type}</Text>
                            </View>
                            <Text style={styles.itemPrice}>RM {(parseFloat(item.price) || 0).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summaryBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('totalPaid')}</Text>
                        <Text style={styles.totalValue}>RM {(parseFloat(order.totalAmount) || 0).toFixed(2)}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 20,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#EEE'
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    scrollContent: { padding: 20 },
    section: { marginBottom: 25 },
    sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
    infoCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, elevation: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoValue: { marginLeft: 10, fontSize: 15, color: '#333' },
    planTitle: { fontSize: 17, fontWeight: 'bold', color: '#648DDB', marginBottom: 12 },
    row: { flexDirection: 'row' },
    half: { flex: 1 },
    subLabel: { fontSize: 12, color: '#999' },
    subValue: { fontSize: 15, color: '#333', marginTop: 2, fontWeight: '500' },
    requestText: { fontSize: 14, color: '#555', fontStyle: 'italic', marginTop: 4 },
    itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 10 },
    itemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#EEE' },
    placeholderImg: { justifyContent: 'center', alignItems: 'center' },
    itemDetails: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    itemType: { fontSize: 12, color: '#AAA', textTransform: 'capitalize' },
    itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    summaryBox: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderColor: '#DDD' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 22, fontWeight: 'bold', color: '#28A745' },
    routeButton: {
        flexDirection: 'row', backgroundColor: '#4285F4', paddingVertical: 14,
        borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 3,
    },
    disabledBtn: { backgroundColor: '#A0C0F0' },
    routeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});