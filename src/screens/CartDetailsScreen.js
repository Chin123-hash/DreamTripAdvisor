import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
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
import { useLanguage } from '../context/LanguageContext';
import { createOrder, deleteItemFromPlan, deletePlan, getAgencies, getCartPlanDetails } from '../services/AuthService';

const { width } = Dimensions.get('window');

export default function PlanDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams(); 
    const { planId } = params;
    const auth = getAuth(); 
    const { t } = useLanguage();
    
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false); 
    const [isEditing, setIsEditing] = useState(false);

    // Data State
    const [planName, setPlanName] = useState('');
    const [rawItems, setRawItems] = useState([]); 
    const [schedule, setSchedule] = useState([]); 
    
    // Agency Data State
    const [agencyList, setAgencyList] = useState([]);
    const [selectedAgency, setSelectedAgency] = useState(null); 
    const [showAgencyModal, setShowAgencyModal] = useState(false);

    // Form State (Trip)
    const [pax, setPax] = useState('2');
    const [fromDate, setFromDate] = useState(new Date()); 
    const [toDate, setToDate] = useState(new Date());     
    const [totalExpense, setTotalExpense] = useState(0);

    // Form State (Customer Details)
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [specialRequest, setSpecialRequest] = useState('');

    // Date Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('from'); 

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const init = async () => {
            const agencies = await fetchAgencies();
            
            if (planId) {
                await loadPlanData(planId, agencies); 
            }
            
            if (auth.currentUser) {
                setCustomerEmail(auth.currentUser.email);
                if (auth.currentUser.displayName) setCustomerName(auth.currentUser.displayName);
            }
            
            setLoading(false);
        };
        init();
    }, [planId]);

    useEffect(() => {
        if (rawItems.length > 0) calculateTotal(rawItems);
    }, [pax]);

    const fetchAgencies = async () => {
        try {
            const agencies = await getAgencies();
            const approvedAgencies = agencies.filter(agency => agency.status === 'approved');
            setAgencyList(approvedAgencies);
            return approvedAgencies; 
        } catch (err) {
            console.log("Error fetching agencies:", err);
            return [];
        }
    };

    const loadPlanData = async (id, currentAgencyList) => {
        try {
            const planData = await getCartPlanDetails(id);
            if (planData && planData.items) {
                setPlanName(planData.planName || t('myTrip'));
                setRawItems(planData.items);
                generateSchedule(planData.items);
                calculateTotal(planData.items);

                if (planData.agencyId) {
                    const foundAgency = currentAgencyList.find(a => a.id === planData.agencyId);
                    
                    if (foundAgency) {
                        setSelectedAgency(foundAgency);
                    } else {
                        setSelectedAgency({
                            id: planData.agencyId,
                            name: planData.agencyName || "Unknown Agency"
                        });
                    }
                } else if (currentAgencyList.length > 0) {
                    setSelectedAgency(currentAgencyList[0]);
                }
            }
        } catch (error) {
            console.log("Error loading plan", error);
            Alert.alert(t('alertErrorTitle'), t('alertLoadFail'));
        }
    };

    const calculateTotal = (items) => {
        const paxNum = parseInt(pax) || 1;
        const sum = items.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
        setTotalExpense(sum * paxNum);
    };

    // --- SUBMIT ORDER LOGIC ---
    const handleConfirmOrder = async () => {
        if (!selectedAgency) {
            Alert.alert(t('missingAgencyTitle'), t('alertSelectAgency'));
            return;
        }

        Alert.alert(
            t('confirmBookingTitle'),
            `${t('totalExpenses')}: RM ${totalExpense.toFixed(2)}\n${t('proceedOrder')}`,
            [
                { text: t('cancel'), style: "cancel" },
                { 
                    text: t('confirmOrder'), 
                    onPress: async () => {
                        try {
                            setSubmitting(true);
                            const orderPayload = {
                                customerId: auth.currentUser?.uid || 'anonymous',
                                specialRequest,
                                planId,
                                planName,
                                agencyId: selectedAgency.id,
                                agencyName: selectedAgency.name,
                                travelDate: fromDate.toISOString(),
                                returnDate: toDate.toISOString(),
                                pax: parseInt(pax),
                                totalAmount: totalExpense,
                                items: rawItems 
                            };

                            await createOrder(orderPayload);
                            await deletePlan(planId); 

                            Alert.alert(t('alertSuccessTitle'), t('orderPlacedSuccess'), [
                                { text: "OK", onPress: () => router.push('/customer-main') } 
                            ]);
                        } catch (error) {
                            Alert.alert(t('alertErrorTitle'), t('orderPlaceFail'));
                            console.error(error);
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    // --- DELETE ITEM LOGIC ---
    const handleDeleteItem = (cartId) => {
        Alert.alert(t('removeItemTitle'), t('removeItemMsg'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('remove'),
                style: "destructive",
                onPress: async () => {
                    try {
                        setLoading(true);
                        await deleteItemFromPlan(planId, cartId);
                        await loadPlanData(planId, agencyList); 
                    } catch (error) {
                        Alert.alert(t('alertErrorTitle'), t('itemRemoveFail'));
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    // --- SCHEDULE LOGIC ---
    const generateSchedule = (items) => {
        let entertainment = items.filter(i => i.type && i.type.toLowerCase() === 'entertainment');
        let food = items.filter(i => i.type && i.type.toLowerCase() === 'food');
        
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
                const itemsLeft = entertainment.length + food.length;
                if (itemsLeft > 5) {
                    if (food.length > 0) item = food.shift();
                    else if (entertainment.length > 0) item = entertainment.shift();
                } else {
                    item = { title: t('lunchBreak'), type: 'Food', price: 0, isPlaceholder: true };
                }
                entCount = 0; 
            } 
            else {
                const preferEnt = entCount < 2;

                if (preferEnt) {
                    if (entertainment.length > 0) {
                        item = entertainment.shift();
                        entCount++;
                    } else if (food.length > 0) {
                        item = food.shift();
                        entCount = 0; 
                    } else {
                        item = { title: t('freeEasy'), type: 'Entertainment', price: 0, isPlaceholder: true };
                        entCount++;
                    }
                } else {
                    if (food.length > 0) {
                        item = food.shift();
                    } else if (entertainment.length > 0) {
                        item = entertainment.shift();
                    } else {
                        item = { title: t('restTime'), type: 'Entertainment', price: 0, isPlaceholder: true };
                    }
                    entCount = 0; 
                }
            }

            generated.push({ 
                time: fmtTime(hour), 
                ...item, 
                price: item.price || 0, 
                title: item.title || t('activity'),
                itemId: item.itemId, 
                cartId: item.cartId
            });
        }
        setSchedule(generated);
    };

    const moveItem = (index, direction) => {
        const newSchedule = [...schedule];
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < newSchedule.length) {
            const tempTime = newSchedule[index].time;
            const targetTime = newSchedule[targetIndex].time;
            [newSchedule[index], newSchedule[targetIndex]] = [newSchedule[targetIndex], newSchedule[index]];
            newSchedule[index].time = tempTime;
            newSchedule[targetIndex].time = targetTime;
            setSchedule(newSchedule);
        }
    };

    const updateTime = (text, index) => {
        const newSchedule = [...schedule];
        newSchedule[index].time = text;
        setSchedule(newSchedule);
    };

    const renderPieChart = () => {
        const paxNum = parseInt(pax) || 1;
        const getSum = (type) => rawItems
            .filter(i => i.type?.toLowerCase() === type)
            .reduce((a, b) => a + (parseFloat(b.price) || 0), 0) * paxNum;
        
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

    const onDateChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            pickerMode === 'from' ? setFromDate(selectedDate) : setToDate(selectedDate);
        }
    };

    const openDatePicker = (mode) => {
        if (!isEditing) return; 
        setPickerMode(mode);
        setShowPicker(true);
    };

    if (loading) return <ActivityIndicator style={{flex:1}} size="large" color="#648DDB" />;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditing ? t('editItinerary') : (planName || t('orderForm'))}
                    </Text>
                    {isEditing ? (
                        <TouchableOpacity style={styles.saveHeaderBtn} onPress={() => { Alert.alert(t('savedLocally')); setIsEditing(false); }}>
                            <Text style={{color: '#FFF', fontWeight: 'bold'}}>{t('save')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.editHeaderIcon} onPress={() => setIsEditing(true)}>
                            <Ionicons name="pencil" size={20} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* TIMELINE */}
                <View style={[styles.timelineCard, isEditing && styles.editingCard]}>
                    {schedule.map((item, index) => (
                        <View key={index} style={styles.timelineRow}>
                            <View style={styles.timeCol}>
                                {isEditing ? (
                                    <TextInput 
                                        style={styles.timeInput}
                                        value={item.time}
                                        onChangeText={(text) => updateTime(text, index)}
                                    />
                                ) : (
                                    <Text style={styles.timeText}>{item.time}</Text>
                                )}
                                {index < schedule.length - 1 && <View style={styles.dottedLine} />}
                            </View>
                            <View style={styles.contentCol}>
                                <Text style={styles.contentTitle}>{item.title}</Text>
                                <Text style={styles.contentDesc}>{item.isPlaceholder ? item.type : `RM ${item.price}`}</Text>
                            </View>

                            {isEditing && (
                                <View style={styles.reorderCol}>
                                    {!item.isPlaceholder && (
                                        <TouchableOpacity 
                                            onPress={() => handleDeleteItem(item.cartId || item.itemId)} 
                                            style={{ marginBottom: 5 }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    )}

                                    {index > 0 && (
                                        <TouchableOpacity onPress={() => moveItem(index, -1)}>
                                            <Ionicons name="chevron-up" size={20} color="#648DDB" />
                                        </TouchableOpacity>
                                    )}
                                    {index < schedule.length - 1 && (
                                        <TouchableOpacity onPress={() => moveItem(index, 1)}>
                                            <Ionicons name="chevron-down" size={20} color="#648DDB" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* TRIP DETAILS FORM */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionHeader}>{t('tripDetails')}</Text>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>{t('from')}</Text>
                        <TouchableOpacity onPress={() => openDatePicker('from')} disabled={!isEditing} style={styles.dateInput}>
                            <Text>{fromDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>{t('to')}</Text>
                        <TouchableOpacity onPress={() => openDatePicker('to')} disabled={!isEditing} style={styles.dateInput}>
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
                            editable={isEditing}
                        />
                    </View>

                    <Text style={[styles.label, {marginTop: 10}]}>{t('travelAgencyLabel')}</Text>
                    <TouchableOpacity 
                        style={styles.dropdown}
                        onPress={() => isEditing && setShowAgencyModal(true)}
                        disabled={!isEditing}
                    >
                        <Text style={styles.dropdownText}>
                            {selectedAgency ? selectedAgency.name : t('selectAgencyPlaceholder')}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#333" />
                    </TouchableOpacity>

                    <Text style={styles.label}>{t('specialRequests')}</Text>
                    <TextInput 
                        style={[styles.textInput, {height: 80, textAlignVertical: 'top'}]} 
                        placeholder={t('specialReqPlaceholder')}
                        multiline
                        value={specialRequest} 
                        onChangeText={setSpecialRequest}
                    />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t('totalExpenses')}</Text>
                        <Text style={styles.totalValue}>RM {totalExpense.toFixed(2)}</Text>
                    </View>
                </View>

                <Text style={styles.handwrittenTitle}>{t('estimatedExpenses')}</Text>
                {renderPieChart()}

                {!isEditing && (
                    <TouchableOpacity 
                        style={[styles.confirmBtn, submitting && { opacity: 0.7 }]} 
                        onPress={handleConfirmOrder}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.confirmText}>{t('confirmOrder')}</Text>
                        )}
                    </TouchableOpacity>
                )}

                <View style={{height: 40}} />
            </ScrollView>
            </KeyboardAvoidingView>

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

            {showPicker && (
                <DateTimePicker
                    value={pickerMode === 'from' ? fromDate : toDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    // 🔥 3. RESTRICT DATE PICKER 🔥
                    minimumDate={pickerMode === 'from' ? new Date() : fromDate}
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
    editHeaderIcon: { backgroundColor: '#648DDB', padding: 8, borderRadius: 8 },
    saveHeaderBtn: { backgroundColor: '#28A745', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    
    timelineCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#000' },
    editingCard: { borderColor: '#648DDB', borderWidth: 2 },
    timelineRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
    timeCol: { width: 75, alignItems: 'center' },
    timeText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    timeInput: { fontSize: 12, fontWeight: 'bold', color: '#648DDB', borderBottomWidth: 1, borderBottomColor: '#648DDB', padding: 0, width: '100%', textAlign: 'center' },
    dottedLine: { position: 'absolute', top: 20, bottom: -25, width: 1, backgroundColor: '#CCC', borderStyle: 'dotted', borderWidth: 1, borderColor: '#CCC' },
    contentCol: { flex: 1, marginLeft: 10 },
    contentTitle: { fontSize: 16, fontFamily: 'serif', fontStyle: 'italic', color: '#333' }, 
    contentDesc: { fontSize: 12, color: '#666', marginTop: 2 },
    reorderCol: { marginLeft: 5, alignItems: 'center', width: 30 },

    formSection: { backgroundColor: '#F2F2F2', borderRadius: 16, padding: 20, marginBottom: 20 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#444' },
    
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
    textInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 15 },
    
    formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    dateInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 10, flex: 1, borderWidth: 1, borderColor: '#E0E0E0', justifyContent: 'center', marginLeft: 10 },
    paxInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 8, width: 100, borderWidth: 1, borderColor: '#E0E0E0', textAlign: 'center', marginLeft: 10 },
    
    dropdown: { backgroundColor: '#FFF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#DDD', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, marginBottom: 15 },
    dropdownText: { color: '#555' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 10 },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    handwrittenTitle: { fontSize: 20, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20, color: '#000' },
    chartContainer: { alignItems: 'center', marginBottom: 30 },
    pieCircle: { width: 150, height: 150, borderRadius: 75, overflow: 'hidden', flexDirection: 'row', position: 'relative', marginBottom: 20 },
    slice: { height: '100%' },
    chartOverlay: { position: 'absolute', top: 35, left: 35, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
    chartTotalText: { fontWeight: 'bold', fontSize: 14 },
    chartTotalLabel: { fontSize: 10, color: '#666' },
    
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
    legendText: { fontSize: 12, color: '#555' },

    confirmBtn: { backgroundColor: '#648DDB', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginHorizontal: 40 },
    confirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '80%', backgroundColor: '#FFF', borderRadius: 10, padding: 20, maxHeight: '60%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', flexDirection: 'row', justifyContent: 'space-between' },
    modalItemText: { fontSize: 16 },
    modalCloseBtn: { marginTop: 15, backgroundColor: '#648DDB', padding: 10, borderRadius: 5, alignItems: 'center' }
});