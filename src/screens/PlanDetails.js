import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image, // <--- Added Image Import
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '../context/LanguageContext';
import {
    addPlanToCart,
    checkFavoriteStatus,
    getCurrentUserData,
    getPlanDetails,
    getUserProfile,
    toggleFavorite
} from '../services/AuthService';

const { width } = Dimensions.get('window');

// --- HELPER: Clean Price String ---
const parsePrice = (priceVal) => {
    if (!priceVal) return 0;
    const cleanString = String(priceVal).replace(/[^0-9.]/g, ''); 
    return parseFloat(cleanString) || 0;
};

export default function PlanDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams(); 
    const { t } = useLanguage();
    
    const planId = params.id || params.planId; 
    
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    // Plan Data
    const [planName, setPlanName] = useState('');
    const [planDescription, setPlanDescription] = useState('');
    const [duration, setDuration] = useState(''); 
    const [pax, setPax] = useState('1'); 
    
    // Updated Agency Info State
    const [agencyInfo, setAgencyInfo] = useState({ 
        id: null, 
        name: 'Loading...', 
        email: '', 
        phone: '', 
        image: null 
    });
    
    // Schedule Data
    const [groupedSchedule, setGroupedSchedule] = useState({}); 
    const [dayKeys, setDayKeys] = useState([]); 
    const [currentDay, setCurrentDay] = useState(""); 
    
    const [rawItems, setRawItems] = useState([]);
    const [isFavorite, setIsFavorite] = useState(false);

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const init = async () => {
            const user = await getCurrentUserData();
            setUserData(user);
            
            if (planId) {
                await loadPlanData(planId);
                const status = await checkFavoriteStatus(planId);
                setIsFavorite(status);
            } else {
                Alert.alert(t('alertErrorTitle'), t('alertNoPlanSelected'));
                setLoading(false);
            }
        };
        init();
    }, [planId]);

    const handleToggleFavorite = async () => {
        const itemToSave = {
            id: planId,
            title: planName,
            image: 'https://via.placeholder.com/300', 
            price: 0, 
            type: 'plan',
            rating: 5, 
            locationURL: "" 
        };

        try {
            const newStatus = await toggleFavorite(itemToSave);
            setIsFavorite(newStatus);
        } catch (error) {
            console.error("Error toggling favorite:", error);
            Alert.alert(t('alertErrorTitle'), "Please login to save favorites.");
        }
    };

    // --- LOAD DATA ---
    const loadPlanData = async (id) => {
        try {
            const planData = await getPlanDetails(id);
            
            if (planData) {
                setPlanName(planData.title || planData.planName || t('tripDetails'));
                setPlanDescription(planData.description || "No description provided.");
                setDuration(planData.days || "N/A");
                setPax(String(planData.pax || '1')); 
                
                // --- FETCH FULL AGENCY DETAILS ---
                if (planData.agencyId) {
                    const agencyUser = await getUserProfile(planData.agencyId);
                    setAgencyInfo({
                        id: planData.agencyId,
                        name: agencyUser?.agencyName || agencyUser?.fullName || planData.agencyName || "Unknown Agency",
                        email: agencyUser?.email || "N/A",
                        phone: agencyUser?.phone || agencyUser?.contactNumber || "N/A",
                        image: agencyUser?.profileImage || agencyUser?.logoUrl || null
                    });
                } else {
                    setAgencyInfo({ id: null, name: "Unknown Agency", email: "", phone: "", image: null });
                }
                
                // Process Items & Group by Day
                let itemsToUse = [];
                if (planData.items && planData.items.length > 0) {
                    itemsToUse = planData.items.map(item => ({
                        ...item,
                        price: parsePrice(item.price) 
                    }));
                } 
                setRawItems(itemsToUse);
                processSchedule(itemsToUse); 

            } else {
                Alert.alert(t('alertErrorTitle'), t('alertPlanNotFound'));
            }
        } catch (error) {
            console.log("Error loading plan:", error);
            Alert.alert(t('alertErrorTitle'), t('alertLoadFail'));
        } finally {
            setLoading(false);
        }
    };

    // --- 2. PROCESS SCHEDULE ---
    const processSchedule = (items) => {
        const groups = {};
        const hasDayProp = items.some(i => i.day);

        if (hasDayProp) {
            items.forEach(item => {
                const day = item.day || "Day 1";
                if (!groups[day]) groups[day] = [];
                groups[day].push(item);
            });
        } else {
            groups["Day 1"] = items;
        }

        const keys = Object.keys(groups).sort(); 
        setGroupedSchedule(groups);
        setDayKeys(keys);
        if (keys.length > 0) setCurrentDay(keys[0]);
    };

    const handleAddToCart = async () => {
        if (!userData || !userData.uid) {
            Alert.alert(t('alertErrorTitle'), t('alertLoginCart'));
            return;
        }

        setLoading(true);
        try {
            const defaultDate = new Date();
            const totalPrice = rawItems.reduce((acc, curr) => acc + (curr.price || 0), 0);

            const flatSchedule = Object.values(groupedSchedule).flat();

            const finalPlanData = {
                originalPlanId: planId,
                planName: planName,
                pax: parseInt(pax) || 1, 
                startDate: defaultDate, 
                endDate: defaultDate,
                agencyId: agencyInfo.id,     
                agencyName: agencyInfo.name, 
                totalPrice: totalPrice,
                items: rawItems, 
                schedule: flatSchedule
            };

            await addPlanToCart(userData.uid, finalPlanData);
            
            Alert.alert(t('alertSuccessTitle'), t('alertCartSuccess'), [
                { text: "OK", onPress: () => router.back() } 
            ]);
        } catch (error) {
            console.error("Add to cart failed:", error);
            Alert.alert(t('alertErrorTitle'), t('alertCartFail'));
        } finally {
            setLoading(false);
        }
    };

    const renderPieChart = () => {
        const getSum = (type) => rawItems
            .filter(i => i.type?.toLowerCase() === type)
            .reduce((a, b) => a + (b.price || 0), 0);
        
        const foodTotal = getSum('food');
        const entTotal = getSum('entertainment');
        const hotelTotal = getSum('hotel');
        const transTotal = getSum('transport'); 
        
        const costPerPax = foodTotal + entTotal + hotelTotal + transTotal || 1; 
        const paxCount = parseInt(pax) || 1;
        const grandTotal = costPerPax * paxCount;

        const foodPct = (foodTotal / costPerPax) * 100;
        const entPct = (entTotal / costPerPax) * 100;
        const hotelPct = (hotelTotal / costPerPax) * 100;
        const transPct = (transTotal / costPerPax) * 100;

        return (
            <View>
                <View style={styles.totalPriceContainer}>
                    <Text style={styles.totalPriceLabel}>{t('totalTripPrice') || "Total Trip Price"}</Text>
                    <Text style={styles.totalPriceValue}>RM {grandTotal.toFixed(2)}</Text>
                    {paxCount > 1 && <Text style={styles.paxSubtitle}>({paxCount} Pax)</Text>}
                </View>

                <View style={styles.chartContainer}>
                    <View style={styles.pieCircle}>
                        {foodPct > 0 && <View style={[styles.slice, { backgroundColor: '#81C784', width: `${foodPct}%` }]} />}
                        {entPct > 0 && <View style={[styles.slice, { backgroundColor: '#FF8A65', width: `${entPct}%` }]} />}
                        {hotelPct > 0 && <View style={[styles.slice, { backgroundColor: '#64B5F6', width: `${hotelPct}%` }]} />}
                        {transPct > 0 && <View style={[styles.slice, { backgroundColor: '#FFD54F', width: `${transPct}%` }]} />}
                        {costPerPax === 1 && <View style={[styles.slice, { backgroundColor: '#EEE', width: '100%' }]} />}

                        <View style={styles.chartOverlay}>
                            <Text style={styles.chartTotalText}>RM {(costPerPax === 1 ? 0 : costPerPax).toFixed(0)}</Text>
                            <Text style={styles.chartTotalLabel}>/ pax</Text>
                        </View>
                    </View>

                    <View style={styles.legendContainer}>
                        {foodPct > 0 && <LegendItem color="#81C784" label={t('legendFood')} />}
                        {entPct > 0 && <LegendItem color="#FF8A65" label={t('legendEnt')} />}
                        {hotelPct > 0 && <LegendItem color="#64B5F6" label={t('legendHotel')} />}
                        {transPct > 0 && <LegendItem color="#FFD54F" label={t('legendTransport')} />}
                    </View>
                </View>
            </View>
        );
    };

    const LegendItem = ({ color, label }) => (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );

    if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#648DDB" />;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={{ width: 28 }} />
                    <Text style={styles.headerTitle}>{planName}</Text>
                    <TouchableOpacity style={styles.headerRightBtn} onPress={handleToggleFavorite}>
                        <Ionicons 
                            name={isFavorite ? "heart" : "heart-outline"} 
                            size={28} 
                            color={isFavorite ? "#FF3B30" : "#333"} 
                        />
                    </TouchableOpacity>
                </View>

                {/* INFO BADGES */}
                <View style={styles.infoRow}>
                    <View style={styles.infoBadge}>
                        <Ionicons name="briefcase-outline" size={16} color="#648DDB" />
                        <Text style={styles.infoText}>{agencyInfo.name}</Text>
                    </View>
                    <View style={styles.infoBadge}>
                        <Ionicons name="time-outline" size={16} color="#648DDB" />
                        <Text style={styles.infoText}>{duration || "Flexible"}</Text>
                    </View>
                    <View style={styles.infoBadge}>
                        <Ionicons name="people-outline" size={16} color="#648DDB" />
                        <Text style={styles.infoText}>{pax} Pax</Text>
                    </View>
                </View>

                {/* DESCRIPTION */}
                {planDescription ? (
                    <View style={styles.descSection}>
                        <Text style={styles.descLabel}>About this Trip:</Text>
                        <Text style={styles.descText}>{planDescription}</Text>
                    </View>
                ) : null}

                {/* NEW: AGENCY DETAILS SECTION */}
                <View style={styles.agencySection}>
                    <Text style={styles.sectionHeader}>{t('travelAgencyLabel') || "Agency Info"}</Text>
                    <View style={styles.agencyCard}>
                        <Image 
                            source={{ uri: agencyInfo.image || 'https://via.placeholder.com/100' }} 
                            style={styles.agencyAvatar} 
                        />
                        <View style={styles.agencyDetails}>
                            <Text style={styles.agencyName}>{agencyInfo.name}</Text>
                            
                            {agencyInfo.email ? (
                                <View style={styles.contactRow}>
                                    <Ionicons name="mail-outline" size={14} color="#666" />
                                    <Text style={styles.contactText}>{agencyInfo.email}</Text>
                                </View>
                            ) : null}
                            
                            {agencyInfo.phone ? (
                                <View style={styles.contactRow}>
                                    <Ionicons name="call-outline" size={14} color="#666" />
                                    <Text style={styles.contactText}>{agencyInfo.phone}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>

                {/* TIMELINE SECTION */}
                <Text style={styles.sectionHeader}>Itinerary</Text>
                
                {dayKeys.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabsContainer}>
                        {dayKeys.map((day) => (
                            <TouchableOpacity 
                                key={day} 
                                style={[styles.dayTab, currentDay === day && styles.activeDayTab]}
                                onPress={() => setCurrentDay(day)}
                            >
                                <Text style={[styles.dayTabText, currentDay === day && styles.activeDayTabText]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.timelineCard}>
                    {groupedSchedule[currentDay] ? (
                        groupedSchedule[currentDay].map((item, index) => (
                            <View key={index} style={styles.timelineRow}>
                                <View style={styles.timeCol}>
                                    <Text style={styles.timeText}>{item.time || "—"}</Text>
                                    {index < groupedSchedule[currentDay].length - 1 && <View style={styles.dottedLine} />}
                                </View>
                                <View style={styles.contentCol}>
                                    <Text style={[styles.contentTitle, item.isPlaceholder && styles.placeholderTitle]}>
                                        {item.title}
                                    </Text>
                                    <Text style={styles.contentDesc}>
                                        {item.isPlaceholder ? item.type : `${item.type} • RM ${item.price.toFixed(2)}`}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={{fontStyle:'italic', color:'#999'}}>{t('noSchedule')}</Text>
                    )}
                </View>

                <Text style={styles.handwrittenTitle}>{t('estimatedExpenses')}</Text>
                {renderPieChart()}

                <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                    <Ionicons name="cart" size={24} color="#FFF" style={{marginRight: 10}} />
                    <Text style={styles.addToCartText}>{t('addToCart')}</Text>
                </TouchableOpacity>

                <View style={{height: 40}} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 20 },
    
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 15,
        minHeight: 40
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#000', 
        textAlign: 'center',
        flex: 1
    },
    headerRightBtn: {
        justifyContent: 'center'
    },
    
    infoRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 8, flexWrap: 'wrap' },
    infoBadge: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', 
        paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 
    },
    infoText: { marginLeft: 5, color: '#333', fontWeight: '600', fontSize: 12 },

    descSection: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 20 },
    descLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 5, color: '#333' },
    descText: { fontSize: 14, color: '#666', lineHeight: 20 },

    // --- AGENCY SECTION STYLES ---
    agencySection: { marginBottom: 25 },
    agencyCard: { 
        flexDirection: 'row', alignItems: 'center', 
        backgroundColor: '#FFF', padding: 15, borderRadius: 12, 
        borderWidth: 1, borderColor: '#EEE' 
    },
    agencyAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#DDD' },
    agencyDetails: { marginLeft: 15, flex: 1 },
    agencyName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    contactText: { fontSize: 12, color: '#666', marginLeft: 6 },

    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },

    dayTabsContainer: { flexDirection: 'row', marginBottom: 10 },
    dayTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EEE', marginRight: 10 },
    activeDayTab: { backgroundColor: '#648DDB' },
    dayTabText: { color: '#666', fontWeight: '600' },
    activeDayTabText: { color: '#FFF' },

    timelineCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#DDD', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    timelineRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
    timeCol: { width: 75, alignItems: 'center' },
    timeText: { fontSize: 13, fontWeight: 'bold', color: '#648DDB' },
    dottedLine: { position: 'absolute', top: 20, bottom: -30, width: 1, backgroundColor: '#CCC', borderStyle: 'dotted', borderWidth: 1, borderColor: '#CCC' },
    contentCol: { flex: 1, marginLeft: 15, paddingBottom: 5 },
    contentTitle: { fontSize: 16, fontWeight: '600', color: '#333' }, 
    placeholderTitle: { fontStyle: 'italic', color: '#888' },
    contentDesc: { fontSize: 13, color: '#666', marginTop: 2 },

    handwrittenTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#000', marginTop: 10 },
    
    totalPriceContainer: { alignItems: 'center', marginBottom: 20 },
    totalPriceLabel: { fontSize: 14, color: '#666', textTransform: 'uppercase', marginBottom: 5 },
    totalPriceValue: { fontSize: 28, fontWeight: '800', color: '#28A745' },
    paxSubtitle: { fontSize: 14, color: '#999', marginTop: 2 },

    chartContainer: { alignItems: 'center', marginBottom: 30 },
    pieCircle: { width: 150, height: 150, borderRadius: 75, overflow: 'hidden', flexDirection: 'row', position: 'relative', marginBottom: 20 },
    slice: { height: '100%' },
    chartOverlay: { position: 'absolute', top: 35, left: 35, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    chartTotalText: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    chartTotalLabel: { fontSize: 10, color: '#666' },
    
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
    legendText: { fontSize: 12, color: '#555' },

    addToCartBtn: { flexDirection: 'row', backgroundColor: '#648DDB', paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, shadowColor: "#648DDB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    addToCartText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});