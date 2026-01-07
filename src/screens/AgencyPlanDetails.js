import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// Ensure you have this installed: npx expo install react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';

// Service imports
import {
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

export default function AgencyPlanDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    // 2. Destructure Hook
    const { t } = useLanguage();

    // Handle cases where param might be 'id' or 'planId'
    const planId = params.id || params.planId;

    // --- STATE ---
    const [loading, setLoading] = useState(true);

    const [planName, setPlanName] = useState('');
    const [rawItems, setRawItems] = useState([]);
    const [schedule, setSchedule] = useState([]);

    // Form State (For calculation visualization only)
    const [pax, setPax] = useState('2');
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [totalExpense, setTotalExpense] = useState(0);

    // Date Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('from');

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const init = async () => {
            if (planId) {
                await loadPlanData(planId);
            } else {
                Alert.alert(t('alertErrorTitle'), t('alertNoPlanSelected'));
            }
            setLoading(false);
        };
        init();
    }, [planId]);

    // Recalculate total when pax or items change
    useEffect(() => {
        if (rawItems.length > 0) calculateTotal(rawItems);
    }, [pax, rawItems]);

    // --- LOAD DATA ---
    const loadPlanData = async (id) => {
        try {
            const planData = await getPlanDetails(id);

            if (planData) {
                setPlanName(planData.title || planData.planName || t('tripPlan'));

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

                    if (ticket > 0) itemsToUse.push({ title: t('ticketEntry'), type: 'Entertainment', price: ticket });
                    if (transport > 0) itemsToUse.push({ title: t('transportFee'), type: 'Transport', price: transport });

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
        let entertainment = items.filter(i => i.type && i.type.toLowerCase() === 'entertainment').map(i => ({ ...i }));
        let food = items.filter(i => i.type && i.type.toLowerCase() === 'food').map(i => ({ ...i }));

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

    // --- CHART LOGIC ---
    const renderPieChart = () => {
        const paxNum = parseInt(pax) || 1;
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

    if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#F8F9FA' }} size="large" color="#648DDB" />;

    return (
        // OUTER VIEW: Ensures the background color covers the physical screen (behind notches/home bar)
        <View style={styles.container}>
            {/* INNER SAFEAREA: Ensures content is pushed away from edges */}
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* HEADER */}
                    <View style={styles.header}>
                        {/* <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity> */}
                        <Text style={styles.headerTitle}>{planName || t('tripPlan')}</Text>
                        <View style={{ width: 24 }} />
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
                        {schedule.length === 0 && <Text style={{ fontStyle: 'italic', color: '#999' }}>{t('noSchedule')}</Text>}
                    </View>

                    {/* INFO SECTION */}
                    <View style={styles.formSection}>
                        <View style={styles.bellHeader}>
                            <Ionicons name="information-circle-outline" size={24} color="#555" />
                            <Text style={{ marginLeft: 10, color: '#555', fontWeight: 'bold' }}>{t('planEstimation')}</Text>
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

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t('totalExpenses')}</Text>
                            <Text style={styles.totalValue}>RM {totalExpense.toFixed(2)}</Text>
                        </View>
                    </View>

                    <Text style={styles.handwrittenTitle}>{t('estExpensesBreakdown')}</Text>
                    {renderPieChart()}

                    <View style={{ height: 40 }} />
                </ScrollView>

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
        </View>
    );
}

const styles = StyleSheet.create({
    // Applied to the outer View to cover the whole screen (including unsafe areas)
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
    bellHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', width: 80 },
    dateInput: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, flex: 1, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center' },
    paxInput: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 10, width: 100, borderWidth: 1, borderColor: '#E0E0E0', textAlign: 'center', fontWeight: 'bold' },

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
});