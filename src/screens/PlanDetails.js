import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Service imports
import {
    addPlanToCart,
    getAgencies,
    getCurrentUserData,
    getPlanDetails
} from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

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
    // 2. Destructure Hook
    const { t } = useLanguage();
    
    // Handle cases where param might be 'id' or 'planId'
    const planId = params.id || params.planId; 
    
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    const [planName, setPlanName] = useState('');
    const [rawItems, setRawItems] = useState([]); 
    const [schedule, setSchedule] = useState([]); 
    
    const [agencyList, setAgencyList] = useState([]);
    const [selectedAgency, setSelectedAgency] = useState(null); 
    const [showAgencyModal, setShowAgencyModal] = useState(false);

    const [pax, setPax] = useState('2');
    const [fromDate, setFromDate] = useState(new Date()); 
    const [toDate, setToDate] = useState(new Date());     
    const [totalExpense, setTotalExpense] = useState(0);

    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('from'); 

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const init = async () => {
            const user = await getCurrentUserData();
            setUserData(user);
            
            if (planId) {
                await loadPlanData(planId);
            } else {
                Alert.alert(t('alertErrorTitle'), t('alertNoPlanSelected'));
            }

            await fetchAgencies();
            setLoading(false);
        };
        init();
    }, [planId]);

    // Recalculate total when pax or items change
    useEffect(() => {
        if (rawItems.length > 0) calculateTotal(rawItems);
    }, [pax, rawItems]);

    const fetchAgencies = async () => {
        try {
            const agencies = await getAgencies();
            setAgencyList(agencies);
            if (agencies.length > 0) setSelectedAgency(agencies[0]);
        } catch (err) {
            console.log("Error fetching agencies:", err);
        }
    };

    // --- LOAD DATA ---
    const loadPlanData = async (id) => {
        try {
            const planData = await getPlanDetails(id);
            
            if (planData) {
                setPlanName(planData.title || planData.planName || t('tripDetails'));

                let itemsToUse = [];

                // 1. If DB has specific items list, use it
                if (planData.items && planData.items.length > 0) {
                    itemsToUse = planData.items.map(item => ({
                        ...item,
                        price: parsePrice(item.price) 
                    }));
                } 
                // 2. If no items, try to find Ticket & Transport fees specifically
                else if (planData.ticketPrice || planData.transportFee || planData.price) {
                    const ticket = parsePrice(planData.ticketPrice);
                    const transport = parsePrice(planData.transportFee);
                    const basePrice = parsePrice(planData.price);

                    if (ticket > 0) {
                        itemsToUse.push({ title: t('ticketEntry'), type: 'Entertainment', price: ticket });
                    }
                    if (transport > 0) {
                        itemsToUse.push({ title: t('transportFee'), type: 'Transport', price: transport });
                    }
                    
                    // If neither ticket nor transport found, but there is a base price, use that
                    if (itemsToUse.length === 0 && basePrice > 0) {
                        itemsToUse.push({ title: t('packageFee'), type: 'Entertainment', price: basePrice });
                    }
                }
                // 3. Last Resort
                else {
                    itemsToUse = [{ title: t('estimatedCost'), type: 'Entertainment', price: 300 }];
                }

                setRawItems(itemsToUse);
                generateSchedule(itemsToUse);
            } else {
                Alert.alert(t('alertErrorTitle'), t('alertPlanNotFound'));
            }
        } catch (error) {
            console.log("Error loading plan:", error);
            Alert.alert(t('alertErrorTitle'), t('alertLoadFail'));
        }
    };

    const calculateTotal = (items) => {
        const paxNum = parseInt(pax) || 1;
        const sum = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
        setTotalExpense(sum * paxNum);
    };

    // --- SCHEDULE LOGIC ---
    const generateSchedule = (items) => {
        // Create copies to avoid mutation
        let entertainment = items.filter(i => i.type && i.type.toLowerCase() === 'entertainment').map(i => ({...i}));
        let food = items.filter(i => i.type && i.type.toLowerCase() === 'food').map(i => ({...i}));
        
        let generated = [];
        const fmtTime = (hour) => {
            const period = hour >= 12 ? 'p.m.' : 'a.m.';
            const h = hour > 12 ? hour - 12 : hour;
            return `${h.toFixed(2)} ${period}`;
        };

        let entCount = 0; 
        for (let hour = 9; hour <= 18; hour++) {
            let item = null;
            if (hour === 13) {
                item = food.length > 0 ? food.shift() : { title: t('lunchBreak'), type: 'Food', price: 0, isPlaceholder: true };
                entCount = 0; 
            } else {
                if (entCount < 2) {
                    if (entertainment.length > 0) { item = entertainment.shift(); entCount++; } 
                    else { item = { title: t('freeEasy'), type: 'Entertainment', price: 0, isPlaceholder: true }; }
                } else {
                    if (food.length > 0) { item = food.shift(); } 
                    else if (entertainment.length > 0) { item = entertainment.shift(); } 
                    else { item = { title: t('restTime'), type: 'Entertainment', price: 0, isPlaceholder: true }; }
                    entCount = 0; 
                }
            }
            generated.push({ 
                time: fmtTime(hour), 
                ...item, 
                price: item.price || 0, 
                title: item.title || t('activity') 
            });
        }
        setSchedule(generated);
    };

    // --- ADD TO CART LOGIC ---
    const handleAddToCart = async () => {
        if (!userData || !userData.uid) {
            Alert.alert(t('alertErrorTitle'), t('alertLoginCart'));
            return;
        }

        if (!selectedAgency) {
            Alert.alert(t('alertRequiredTitle'), t('alertSelectAgency'));
            return;
        }

        setLoading(true);
        try {
            // Prepare the data packet
            const finalPlanData = {
                originalPlanId: planId,
                planName: planName,
                pax: parseInt(pax) || 1,
                startDate: fromDate, 
                endDate: toDate,
                agencyId: selectedAgency.id,
                agencyName: selectedAgency.name,
                totalPrice: totalExpense,
                items: rawItems, 
                schedule: schedule
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

    // --- CHART LOGIC ---
    const renderPieChart = () => {
        const paxNum = parseInt(pax) || 1;
        // Helper to sum by type
        const getSum = (type) => rawItems
            .filter(i => i.type?.toLowerCase() === type)
            .reduce((a, b) => a + (b.price || 0), 0) * paxNum;
        
        const foodTotal = getSum('food');
        const entTotal = getSum('entertainment');
        const hotelTotal = getSum('hotel');
        const transTotal = getSum('transport'); 
        
        const grandTotal = foodTotal + entTotal + hotelTotal + transTotal || 1; 

        const foodPct = (foodTotal / grandTotal) * 100;
        const entPct = (entTotal / grandTotal) * 100;
        const hotelPct = (hotelTotal / grandTotal) * 100;
        const transPct = (transTotal / grandTotal) * 100;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.pieCircle}>
                    {foodPct > 0 && <View style={[styles.slice, { backgroundColor: '#81C784', width: `${foodPct}%` }]} />}
                    {entPct > 0 && <View style={[styles.slice, { backgroundColor: '#FF8A65', width: `${entPct}%` }]} />}
                    {hotelPct > 0 && <View style={[styles.slice, { backgroundColor: '#64B5F6', width: `${hotelPct}%` }]} />}
                    {transPct > 0 && <View style={[styles.slice, { backgroundColor: '#FFD54F', width: `${transPct}%` }]} />}
                    {grandTotal === 1 && <View style={[styles.slice, { backgroundColor: '#EEE', width: '100%' }]} />}

                    <View style={styles.chartOverlay}>
                        <Text style={styles.chartTotalText}>RM {(grandTotal === 1 ? 0 : grandTotal).toFixed(0)}</Text>
                        <Text style={styles.chartTotalLabel}>{t('total')}</Text>
                    </View>
                </View>

                <View style={styles.legendContainer}>
                    {foodPct > 0 && <LegendItem color="#81C784" label={t('legendFood')} />}
                    {entPct > 0 && <LegendItem color="#FF8A65" label={t('legendEnt')} />}
                    {hotelPct > 0 && <LegendItem color="#64B5F6" label={t('legendHotel')} />}
                    {transPct > 0 && <LegendItem color="#FFD54F" label={t('legendTransport')} />}
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

    // --- UTILS ---
    const onDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            pickerMode === 'from' ? setFromDate(selectedDate) : setToDate(selectedDate);
        }
    };

    const openDatePicker = (mode) => {
        setPickerMode(mode);
        setShowPicker(true);
    };

    if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#648DDB" />;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{planName || t('tripDetails')}</Text>
                    <View style={{width: 24}} /> 
                </View>

                {/* TIMELINE (VIEW ONLY) */}
                <View style={styles.timelineCard}>
                    {schedule.map((item, index) => (
                        <View key={index} style={styles.timelineRow}>
                            <View style={styles.timeCol}>
                                <Text style={styles.timeText}>{item.time}</Text>
                                {index < schedule.length - 1 && <View style={styles.dottedLine} />}
                            </View>
                            <View style={styles.contentCol}>
                                <Text style={styles.contentTitle}>{item.title}</Text>
                                <Text style={styles.contentDesc}>
                                    {item.isPlaceholder ? item.type : `RM ${item.price.toFixed(2)}`}
                                </Text>
                            </View>
                        </View>
                    ))}
                    {schedule.length === 0 && <Text style={{fontStyle:'italic', color:'#999'}}>{t('noSchedule')}</Text>}
                </View>

                {/* CONFIGURATION FORM */}
                <View style={styles.formSection}>
                    <View style={styles.bellHeader}>
                        <Ionicons name="settings-outline" size={24} color="#555" />
                        <Text style={{marginLeft: 10, color: '#555', fontWeight:'bold'}}>{t('customizeTrip')}</Text>
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>{t('from')}</Text>
                        <TouchableOpacity onPress={() => openDatePicker('from')} style={styles.dateInput}>
                            <Text>{fromDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>{t('to')}</Text>
                        <TouchableOpacity onPress={() => openDatePicker('to')} style={styles.dateInput}>
                            <Text>{toDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>{t('noOfPax')}</Text>
                        <TextInput 
                            style={styles.paxInput} 
                            value={pax} 
                            onChangeText={setPax} 
                            keyboardType="numeric"
                        />
                    </View>

                    <Text style={[styles.label, {marginTop: 10, width:'100%'}]}>{t('travelAgencyLabel')}</Text>
                    <TouchableOpacity 
                        style={styles.dropdown}
                        onPress={() => setShowAgencyModal(true)}
                    >
                        <Text style={styles.dropdownText}>
                            {selectedAgency ? selectedAgency.name : t('selectAgencyPlaceholder')}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('totalExpenses')}</Text>
                        <Text style={styles.totalValue}>RM {totalExpense.toFixed(2)}</Text>
                    </View>
                </View>

                <Text style={styles.handwrittenTitle}>{t('estimatedExpenses')}</Text>
                {renderPieChart()}

                {/* ADD TO CART BUTTON */}
                <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
                    <Ionicons name="cart" size={24} color="#FFF" style={{marginRight: 10}} />
                    <Text style={styles.addToCartText}>{t('addToCart')}</Text>
                </TouchableOpacity>

                <View style={{height: 40}} />
            </ScrollView>

            {/* AGENCY MODAL */}
            <Modal visible={showAgencyModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{t('selectAgencyTitle')}</Text>
                        <ScrollView>
                            {agencyList.map((agency) => (
                                <TouchableOpacity 
                                    key={agency.id} 
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedAgency(agency);
                                        setShowAgencyModal(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{agency.name}</Text>
                                    {selectedAgency?.id === agency.id && <Ionicons name="checkmark" size={20} color="green" />}
                                </TouchableOpacity>
                            ))}
                            {agencyList.length === 0 && <Text style={{padding:20, textAlign:'center'}}>{t('noAgencies')}</Text>}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAgencyModal(false)}>
                            <Text style={{color:'#FFF'}}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* DATE PICKER */}
            {showPicker && (
                <DateTimePicker
                    value={pickerMode === 'from' ? fromDate : toDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    
    // Timeline Styles
    timelineCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#DDD', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    timelineRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
    timeCol: { width: 75, alignItems: 'center' },
    timeText: { fontSize: 13, fontWeight: 'bold', color: '#648DDB' },
    dottedLine: { position: 'absolute', top: 20, bottom: -30, width: 1, backgroundColor: '#CCC', borderStyle: 'dotted', borderWidth: 1, borderColor: '#CCC' },
    
    contentCol: { flex: 1, marginLeft: 15, paddingBottom: 5 },
    contentTitle: { fontSize: 16, fontWeight: '600', color: '#333' }, 
    contentDesc: { fontSize: 13, color: '#666', marginTop: 2 },

    // Form Styles
    formSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#DDD' },
    bellHeader: { flexDirection:'row', alignItems:'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', width: 80 },
    dateInput: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, flex: 1, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center' },
    paxInput: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 10, width: 100, borderWidth: 1, borderColor: '#E0E0E0', textAlign: 'center', fontWeight: 'bold' },
    
    dropdown: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E0E0E0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, marginBottom: 15 },
    dropdownText: { color: '#333' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#EEE' },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: '#648DDB' },

    // Chart Styles
    handwrittenTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#000', marginTop: 10 },
    chartContainer: { alignItems: 'center', marginBottom: 30 },
    pieCircle: { width: 150, height: 150, borderRadius: 75, overflow: 'hidden', flexDirection: 'row', position: 'relative', marginBottom: 20 },
    slice: { height: '100%' },
    chartOverlay: { position: 'absolute', top: 35, left: 35, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    chartTotalText: { fontWeight: 'bold', fontSize: 14, color: '#333' },
    chartTotalLabel: { fontSize: 10, color: '#666' },
    
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
    legendText: { fontSize: 12, color: '#555' },

    // Add to Cart Button
    addToCartBtn: { flexDirection: 'row', backgroundColor: '#648DDB', paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, shadowColor: "#648DDB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    addToCartText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '85%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between' },
    modalItemText: { fontSize: 16, color: '#333' },
    modalCloseBtn: { marginTop: 15, backgroundColor: '#648DDB', padding: 12, borderRadius: 8, alignItems: 'center' }
});