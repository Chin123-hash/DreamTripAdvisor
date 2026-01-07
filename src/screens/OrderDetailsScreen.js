import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal, // Import Modal
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import {
    getEntertainmentById,
    getFoodById,
    getOrderDetails,
    submitItemRating // Import the new service
} from '../services/AuthService';

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useLanguage();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrichedItems, setEnrichedItems] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    // --- RATING STATE ---
    const [ratingModalVisible, setRatingModalVisible] = useState(false);
    const [selectedItemForRating, setSelectedItemForRating] = useState(null);
    const [starCount, setStarCount] = useState(0);
    const [ratedItems, setRatedItems] = useState([]); // Track items rated in this session

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
                await fetchLocationsForItems(parsed.items);
            }
            else if (params.orderId) {
                const cleanId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
                const fetchedOrder = await getOrderDetails(cleanId.trim());

                if (fetchedOrder) {
                    setOrder(fetchedOrder);
                    await fetchLocationsForItems(fetchedOrder.items);
                } else {
                    Alert.alert(t('alertErrorTitle'), "Order ID not found.");
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
                let fullData = null;
                const itemId = item.itemId || item.id;
                try {
                    if (item.type === 'food') {
                        fullData = await getFoodById(itemId);
                    } else {
                        fullData = await getEntertainmentById(itemId);
                    }
                } catch (err) { console.log("Refresh error"); }

                return {
                    ...item,
                    locationURL: fullData?.locationURL || item.locationURL || item.title,
                    title: fullData?.title || item.title,
                    id: itemId // Ensure ID is consistent
                };
            });
            const results = await Promise.all(promises);
            setEnrichedItems(results);
        } catch (error) {
            setEnrichedItems(items);
        } finally {
            setLoadingLocations(false);
        }
    };

    const getLocationQuery = (item) => {
        const raw = item.locationURL;
        if (!raw || typeof raw !== 'string') return item.title;
        if (raw.includes('q=')) {
            const match = raw.match(/[?&]q=([^&]+)/);
            if (match && match[1]) return decodeURIComponent(match[1]);
        }
        const coordMatch = raw.match(/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
        if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`;
        if (raw.includes('googleusercontent') || !raw.startsWith('http')) return item.title;
        return item.title;
    };

    const handleOpenRoute = () => {
        const validItems = enrichedItems.filter(item => 
            (item.locationURL && item.locationURL.trim() !== "") || item.title
        );

        if (validItems.length === 0) {
            Alert.alert(t('noLocationsTitle'), t('noLocationsMsg'));
            return;
        }

        const locations = validItems.map(getLocationQuery);
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

        Linking.openURL(url).catch(err => Alert.alert(t('alertErrorTitle'), t('errorMap')));
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return '—';
        try {
            const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
            return date.toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch { return '—'; }
    };

    // --- RATING HANDLERS ---
    const openRatingModal = (item) => {
        setSelectedItemForRating(item);
        setStarCount(0);
        setRatingModalVisible(true);
    };

    const submitRating = async () => {
        if (starCount === 0) {
            Alert.alert(t('alertRequiredTitle'), "Please select a star rating.");
            return;
        }
        
        try {
            const itemId = selectedItemForRating.itemId || selectedItemForRating.id;
            const type = selectedItemForRating.type || 'entertainment'; // default fallback

            await submitItemRating(type, itemId, starCount);
            
            Alert.alert(t('alertSuccessTitle'), "Thank you for your feedback!");
            setRatedItems(prev => [...prev, itemId]); // Mark as rated locally
            setRatingModalVisible(false);
            setSelectedItemForRating(null);
        } catch (error) {
            Alert.alert(t('alertErrorTitle'), "Failed to submit rating. Please try again.");
        }
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

    const displayItems = enrichedItems.length > 0 ? enrichedItems : order.items;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('orderDetails')} #{order.id ? order.id.slice(0, 8).toUpperCase() : ''}
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Route Button */}
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

                {/* Items Purchased & Rating */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('itineraryItems')}</Text>
                    {displayItems?.map((item, index) => {
                         const itemId = item.itemId || item.id;
                         const isRated = ratedItems.includes(itemId);

                         return (
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
                                    
                                    {/* Rating Button */}
                                    <TouchableOpacity 
                                        style={[styles.rateButton, isRated && styles.ratedButton]}
                                        onPress={() => !isRated && openRatingModal(item)}
                                        disabled={isRated}
                                    >
                                        <Ionicons name={isRated ? "checkmark-circle" : "star-outline"} size={14} color={isRated ? "#FFF" : "#F5A623"} />
                                        <Text style={[styles.rateButtonText, isRated && {color: '#FFF'}]}>
                                            {isRated ? "Rated" : "Rate Item"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.itemPrice}>RM {(parseFloat(item.price) || 0).toFixed(2)}</Text>
                            </View>
                         );
                    })}
                </View>

                {/* Summary */}
                <View style={styles.summaryBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('totalPaid')}</Text>
                        <Text style={styles.totalValue}>RM {(parseFloat(order.totalAmount) || 0).toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* --- RATING MODAL --- */}
            <Modal
                transparent={true}
                visible={ratingModalVisible}
                animationType="fade"
                onRequestClose={() => setRatingModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rate {selectedItemForRating?.title}</Text>
                        <Text style={styles.modalSub}>How was your experience?</Text>
                        
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setStarCount(star)}>
                                    <Ionicons 
                                        name={star <= starCount ? "star" : "star-outline"} 
                                        size={40} 
                                        color="#F5A623" 
                                        style={{ marginHorizontal: 5 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, {backgroundColor: '#EEE'}]} 
                                onPress={() => setRatingModalVisible(false)}
                            >
                                <Text style={{color: '#333'}}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, {backgroundColor: '#648DDB'}]} 
                                onPress={submitRating}
                            >
                                <Text style={{color: '#FFF', fontWeight: 'bold'}}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    routeButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    
    // Rating Styles
    rateButton: {
        marginTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#F5A623',
        borderRadius: 15,
        alignSelf: 'flex-start'
    },
    ratedButton: {
        backgroundColor: '#28A745',
        borderColor: '#28A745'
    },
    rateButtonText: {
        fontSize: 10,
        color: '#F5A623',
        fontWeight: 'bold',
        marginLeft: 4
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 5
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5
    },
    modalSub: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 25
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5
    }
});