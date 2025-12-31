import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react'; // <--- Make sure useMemo is here
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const formatDate = (dateValue) => {
        if (!dateValue) return '—';

        try {
            const date =
                dateValue.toDate
                    ? dateValue.toDate()           // Firestore Timestamp
                    : new Date(dateValue);          // ISO / string

            return date.toLocaleDateString('en-MY', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return '—';
        }
    };

    const order = useMemo(() => {
        try {
            const raw = Array.isArray(params.orderData)
                ? params.orderData[0]
                : params.orderData;

            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, [params.orderData]);

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#999' }}>Loading order details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{order.status || 'Pending'}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Section: Customer Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Customer Information</Text>
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

                {/* Section: Trip Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Trip Details</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.planTitle}>{order.planName}</Text>
                        <View style={styles.row}>
                            <View style={styles.half}>
                                <Text style={styles.subLabel}>Travel Date</Text>
                                <Text style={styles.subValue}>{formatDate(order.travelDate)}</Text>
                            </View>
                            <View style={styles.half}>
                                <Text style={styles.subLabel}>Pax</Text>
                                <Text style={styles.subValue}>{order.pax} Person(s)</Text>
                            </View>
                        </View>
                        {order.specialRequest ? (
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.subLabel}>Special Request</Text>
                                <Text style={styles.requestText}>{order.specialRequest}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Section: Items Purchased */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Items Purchased</Text>
                    {order.items?.map((item, index) => (
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

                {/* Section: Summary */}
                <View style={styles.summaryBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Paid</Text>
                        <Text style={styles.totalValue}>RM {(parseFloat(order.totalAmount) || 0).toFixed(2)}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderColor: '#EEE'
    },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1 },
    statusBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: '#856404', fontSize: 12, fontWeight: 'bold' },

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

    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10
    },
    itemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#EEE' },
    placeholderImg: { justifyContent: 'center', alignItems: 'center' },
    itemDetails: { flex: 1, marginLeft: 12 },
    itemTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    itemType: { fontSize: 12, color: '#AAA', textTransform: 'capitalize' },
    itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#333' },

    summaryBox: {
        marginTop: 10,
        paddingTop: 20,
        borderTopWidth: 1,
        borderColor: '#DDD'
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 22, fontWeight: 'bold', color: '#28A745' }
});