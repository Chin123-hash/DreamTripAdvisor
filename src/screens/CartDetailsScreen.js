// src/screens/PlanDetailsScreen.js

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCartPlanDetails } from '../services/AuthService'; // <--- UPDATED IMPORT

const { width } = Dimensions.get('window');

export default function PlanDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams(); 
    const { planId } = params; // Get the ID passed from previous screen
    
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [planName, setPlanName] = useState('');
    const [rawItems, setRawItems] = useState([]); 
    const [schedule, setSchedule] = useState([]); 
    
    const [pax, setPax] = useState('2');
    const [fromDate, setFromDate] = useState('01/01/2025');
    const [toDate, setToDate] = useState('03/01/2025');
    const [selectedAgency, setSelectedAgency] = useState('Best Travel Co.');
    const [totalExpense, setTotalExpense] = useState(0);

    // --- 1. FETCH & GENERATE ---
    useEffect(() => {
        if (planId) {
            loadPlanData(planId);
        } else {
            Alert.alert("Error", "No Plan ID found.");
            setLoading(false);
        }
    }, [planId]);

    // Recalculate totals if Pax changes
    useEffect(() => {
        if (rawItems.length > 0) {
            calculateTotal(rawItems);
        }
    }, [pax]);

    const loadPlanData = async (id) => {
        try {
            const planData = await getCartPlanDetails(id);
            
            if (planData && planData.items) {
                setPlanName(planData.planName || "My Trip");
                setRawItems(planData.items); // The array from your DB
                
                generateSchedule(planData.items);
                calculateTotal(planData.items);
            }
        } catch (error) {
            Alert.alert("Error", "Could not load plan details.");
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = (items) => {
        const paxNum = parseInt(pax) || 1;
        const sum = items.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
        setTotalExpense(sum * paxNum);
    };

    const generateSchedule = (items) => {
        // FILTER with Case Insensitivity (to handle "entertainment" vs "Entertainment")
        let entertainment = items.filter(i => i.type && i.type.toLowerCase() === 'entertainment');
        let food = items.filter(i => i.type && i.type.toLowerCase() === 'food');
        
        let generated = [];

        // Helper to format time
        const fmtTime = (hour) => {
            const period = hour >= 12 ? 'p.m.' : 'a.m.';
            const h = hour > 12 ? hour - 12 : hour;
            return `${h.toFixed(2)} ${period}`;
        };

        // SCHEDULE LOGIC: 9am - 6pm
        let entCount = 0; 

        for (let hour = 9; hour <= 18; hour++) {
            let item = null;

            // MANDATORY LUNCH AT 1 PM
            if (hour === 13) {
                if (food.length > 0) {
                    item = food.shift();
                } else {
                    item = { title: 'Lunch Break', type: 'Food', price: 0, isPlaceholder: true };
                }
                entCount = 0; 
            } 
            // NORMAL FLOW
            else {
                if (entCount < 2) {
                    if (entertainment.length > 0) {
                        item = entertainment.shift();
                        entCount++;
                    } else {
                        item = { title: 'Free & Easy', type: 'Entertainment', price: 0, isPlaceholder: true };
                    }
                } 
                else {
                    if (food.length > 0) {
                        item = food.shift();
                    } else {
                        if (entertainment.length > 0) {
                            item = entertainment.shift();
                        } else {
                            item = { title: 'Rest Time', type: 'Entertainment', price: 0, isPlaceholder: true };
                        }
                    }
                    entCount = 0; 
                }
            }

            generated.push({
                time: fmtTime(hour),
                ...item,
                price: item.price || 0,
                // Ensure title exists even if DB field is missing
                title: item.title || "Unknown Item"
            });
        }
        setSchedule(generated);
    };

    const renderPieChart = () => {
        const paxNum = parseInt(pax) || 1;

        // Calculate Category Totals (Case Insensitive)
        const getSum = (type) => rawItems
            .filter(i => i.type && i.type.toLowerCase() === type)
            .reduce((a, b) => a + (b.price || 0), 0) * paxNum;

        const hotelTotal = getSum('hotel');
        const foodTotal = getSum('food');
        const entTotal = getSum('entertainment');
        const souvenirTotal = 0; 

        const grandTotal = hotelTotal + foodTotal + entTotal + souvenirTotal || 1; 

        // Width Percentages
        const hotelPct = (hotelTotal / grandTotal) * 100;
        const foodPct = (foodTotal / grandTotal) * 100;
        const entPct = (entTotal / grandTotal) * 100;
        const souvPct = (souvenirTotal / grandTotal) * 100;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.pieCircle}>
                    {hotelPct > 0 && <View style={[styles.slice, { backgroundColor: '#64B5F6', width: `${hotelPct}%` }]} />}
                    {foodPct > 0 && <View style={[styles.slice, { backgroundColor: '#81C784', width: `${foodPct}%` }]} />}
                    {entPct > 0 && <View style={[styles.slice, { backgroundColor: '#FF8A65', width: `${entPct}%` }]} />}
                    {souvPct > 0 && <View style={[styles.slice, { backgroundColor: '#FFD54F', width: `${souvPct}%` }]} />}
                    
                    <View style={styles.chartOverlay}>
                        <Text style={styles.chartTotalText}>RM {grandTotal.toFixed(0)}</Text>
                        <Text style={styles.chartTotalLabel}>Est. Total</Text>
                    </View>
                </View>

                <View style={styles.legendContainer}>
                    {hotelPct > 0 && <LegendItem color="#64B5F6" label={`Hotel (${Math.round(hotelPct)}%)`} />}
                    {foodPct > 0 && <LegendItem color="#81C784" label={`Food (${Math.round(foodPct)}%)`} />}
                    {entPct > 0 && <LegendItem color="#FF8A65" label={`Entertainment (${Math.round(entPct)}%)`} />}
                    {souvPct > 0 && <LegendItem color="#FFD54F" label={`Souvenir (${Math.round(souvPct)}%)`} />}
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

    if (loading) {
        return (
            <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <ActivityIndicator size="large" color="#648DDB" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    {/* Use DB Plan Name if available */}
                    <Text style={styles.headerTitle}>{planName || "Order Form"}</Text>
                    <View style={{width: 30}} />
                </View>

                {/* TIMELINE */}
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
                                    {item.isPlaceholder ? item.type : `RM ${item.price}`}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* FORM */}
                <View style={styles.formSection}>
                    <View style={styles.bellHeader}>
                        <Ionicons name="notifications-outline" size={24} color="#A94442" />
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>From:</Text>
                        <TextInput style={styles.dateInput} value={fromDate} onChangeText={setFromDate} />
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>To:</Text>
                        <TextInput style={styles.dateInput} value={toDate} onChangeText={setToDate} />
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>No of Pax:</Text>
                        <TextInput 
                            style={styles.paxInput} 
                            value={pax} 
                            onChangeText={setPax} 
                            keyboardType="numeric"
                        />
                        <Text style={styles.hintText}>Suggested: 2</Text>
                    </View>

                    <Text style={[styles.label, {marginTop: 10, width:'100%'}]}>Choose your Travel Agency:</Text>
                    <View style={styles.dropdown}>
                        <Text style={styles.dropdownText}>{selectedAgency}</Text>
                        <Ionicons name="chevron-down" size={20} color="#333" />
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Expenses</Text>
                        <Text style={styles.totalValue}>RM {totalExpense.toFixed(2)}</Text>
                    </View>
                </View>

                {/* CHART */}
                <Text style={styles.handwrittenTitle}>Estimated Expenses</Text>
                {renderPieChart()}

                {/* BUTTON */}
                <TouchableOpacity style={styles.confirmBtn} onPress={() => Alert.alert("Confirmed", "Order placed!")}>
                    <Text style={styles.confirmText}>Confirm Order</Text>
                </TouchableOpacity>

                <View style={{height: 40}} />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 20 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },

    timelineCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#000' },
    timelineRow: { flexDirection: 'row', marginBottom: 20 },
    timeCol: { width: 70, alignItems: 'center' },
    timeText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
    dottedLine: { position: 'absolute', top: 15, bottom: -25, width: 1, backgroundColor: '#CCC', borderStyle: 'dotted', borderWidth: 1, borderColor: '#CCC' },
    contentCol: { flex: 1, marginLeft: 10 },
    contentTitle: { fontSize: 18, fontFamily: 'serif', fontStyle: 'italic', color: '#333' }, 
    contentDesc: { fontSize: 14, color: '#666', marginTop: 2, fontFamily: 'serif', fontStyle:'italic' },

    formSection: { backgroundColor: '#F2F2F2', borderRadius: 16, padding: 20, marginBottom: 20 },
    bellHeader: { marginBottom: 15 },
    formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', width: 80 },
    dateInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 8, flex: 1, borderWidth: 1, borderColor: '#E0E0E0', color: '#555', textAlign:'center' },
    paxInput: { backgroundColor: '#FFF', borderRadius: 8, padding: 8, width: 100, borderWidth: 1, borderColor: '#E0E0E0', textAlign: 'center' },
    hintText: { fontSize: 12, color: '#999', marginLeft: 10 },
    dropdown: { backgroundColor: '#EFEFEF', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#DDD', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5, marginBottom: 15 },
    dropdownText: { color: '#555' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    totalLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    handwrittenTitle: { fontSize: 20, fontFamily: 'serif', fontStyle: 'italic', marginBottom: 20, color: '#000' },
    chartContainer: { alignItems: 'center', marginBottom: 30 },
    pieCircle: { width: 200, height: 200, borderRadius: 100, overflow: 'hidden', flexDirection: 'row', position: 'relative', marginBottom: 20 },
    slice: { height: '100%' },
    chartOverlay: { position: 'absolute', top: 50, left: 50, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
    chartTotalText: { fontWeight: 'bold', fontSize: 16 },
    chartTotalLabel: { fontSize: 10, color: '#666' },
    
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 5 },
    legendText: { fontSize: 12, color: '#555' },

    confirmBtn: { backgroundColor: '#648DDB', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginHorizontal: 40 },
    confirmText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});