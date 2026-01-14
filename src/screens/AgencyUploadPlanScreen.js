import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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

// Services & Context
import { useLanguage } from '../context/LanguageContext';
import { addPlan, fetchEntertainmentList, fetchFoodList } from '../services/AuthService';

const generatePlanId = () => {
    const timestamp = new Date().getTime().toString().slice(-10);
    return `P${timestamp}`;
};

// Helper to generate options
const generateDaysOptions = () => {
    const options = [];
    for (let i = 2; i <= 15; i++) {
        options.push(`${i} Days ${i - 1} Nights`);
    }
    return options;
};

// Helper to get number of days from string "3 Days 2 Nights"
const parseDays = (dayString) => {
    if (!dayString) return 1;
    const match = dayString.match(/(\d+)\s*Days?/);
    return match ? parseInt(match[1]) : 1;
};

export default function AgencyUploadPlanScreen() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const router = useRouter();
    const { t } = useLanguage();

    // --- STATE ---
    const [planId] = useState(generatePlanId());
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Basic Info
    const [planName, setPlanName] = useState('');
    const [planDescription, setPlanDescription] = useState('');
    const [pax, setPax] = useState('2');
    const [days, setDays] = useState('1 Day'); // Default
    const [imageUri, setImageUri] = useState(null);
    
    // Data Lists
    const [entList, setEntList] = useState([]);
    const [foodList, setFoodList] = useState([]);

    // --- MULTI-DAY SCHEDULE STATE ---
    // schedule is now an Array of Arrays: [ [Day1Slots], [Day2Slots], ... ]
    const [schedule, setSchedule] = useState([[]]); 
    const [currentDayIndex, setCurrentDayIndex] = useState(0); // 0 = Day 1
    const [totalExpense, setTotalExpense] = useState(0);

    // Modals
    const [activeSlotIndex, setActiveSlotIndex] = useState(null);
    const [showDurationModal, setShowDurationModal] = useState(false); 
    const [showTypeModal, setShowTypeModal] = useState(false); 
    const [showItemModal, setShowItemModal] = useState(false);
    const [currentList, setCurrentList] = useState([]); 
    const [selectedType, setSelectedType] = useState(''); 

    // --- INITIALIZATION ---
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadDropdowns();
            // Initialize Day 1
            const initialDay = generateDailySlots();
            setSchedule([initialDay]);
            setLoading(false);
        };
        init();
    }, []);

    // --- LOGIC 1: Handle Duration Change ---
    // Automatically add/remove pages when "days" string changes
    useEffect(() => {
        if (!days) return;
        const numDays = parseDays(days);
        
        setSchedule(prevSchedule => {
            const newSchedule = [...prevSchedule];
            const currentCount = newSchedule.length;

            if (numDays > currentCount) {
                // Add new days (pages)
                for (let i = currentCount; i < numDays; i++) {
                    newSchedule.push(generateDailySlots());
                }
            } else if (numDays < currentCount) {
                // Remove extra days
                newSchedule.splice(numDays);
                // If we were viewing a deleted day, go back to last available day
                if (currentDayIndex >= numDays) {
                    setCurrentDayIndex(numDays - 1);
                }
            }
            return newSchedule;
        });
    }, [days]);

    // Recalculate total whenever schedule or pax changes
    useEffect(() => {
        calculateTotal();
    }, [schedule, pax]);

    // Helper: Generate one day's empty slots
    const generateDailySlots = () => {
        let generated = [];
        const fmtTime = (hour) => {
            const period = hour >= 12 ? 'p.m.' : 'a.m.';
            const h = hour > 12 ? hour - 12 : hour;
            return `${h.toFixed(2)} ${period}`;
        };

        for (let hour = 9; hour <= 18; hour++) {
            generated.push({
                time: fmtTime(hour),
                title: t('freeEasy'), 
                type: 'placeholder',
                price: 0,
                itemId: null,
                isPlaceholder: true
            });
        }
        return generated;
    };

    // 2. Load Data for Dropdowns
    const loadDropdowns = async () => {
        try {
            const entData = await fetchEntertainmentList();
            const formattedEnts = entData.map(item => ({
                id: item.value,
                title: item.label,
                price: item.price ? parseFloat(item.price) : 50,
                type: 'Entertainment'
            }));
            setEntList(formattedEnts);

            const foodData = await fetchFoodList();
            const formattedFoods = foodData.map(item => ({
                id: item.value,
                title: item.label,
                price: item.price ? parseFloat(item.price) : 25,
                type: 'Food'
            }));
            setFoodList(formattedFoods);
        } catch (error) {
            console.error("Error loading lists", error);
        }
    };

    // 3. Logic: Calculate Total (Iterate ALL days)
    const calculateTotal = () => {
        const paxNum = parseInt(pax) || 1;
        let sum = 0;
        
        // Loop through every day array
        schedule.forEach(daySlots => {
            daySlots.forEach(item => {
                sum += (item.price || 0);
            });
        });

        setTotalExpense(sum * paxNum);
    };

    // --- INTERACTION HANDLERS ---

    const handleSlotClick = (index) => {
        setActiveSlotIndex(index);
        setShowTypeModal(true); 
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setShowTypeModal(false);
        
        if (type === 'Food') setCurrentList(foodList);
        else if (type === 'Entertainment') setCurrentList(entList);
        else if (type === 'Clear') {
            updateScheduleSlot(activeSlotIndex, { 
                title: t('freeEasy'), 
                type: 'placeholder', 
                price: 0, 
                itemId: null, 
                isPlaceholder: true 
            });
            return;
        }

        setTimeout(() => setShowItemModal(true), 200); 
    };

    const handleItemSelect = (item) => {
        updateScheduleSlot(activeSlotIndex, {
            title: item.title,
            type: selectedType,
            price: item.price,
            itemId: item.id,
            isPlaceholder: false
        });
        setShowItemModal(false);
    };

    // Update specific slot in CURRENT day
    const updateScheduleSlot = (slotIndex, newData) => {
        setSchedule(prevSchedule => {
            const newSchedule = [...prevSchedule]; // Copy outer array
            const currentDaySlots = [...newSchedule[currentDayIndex]]; // Copy inner array (current day)
            
            currentDaySlots[slotIndex] = { ...currentDaySlots[slotIndex], ...newData }; // Update slot
            
            newSchedule[currentDayIndex] = currentDaySlots; // Put back
            return newSchedule;
        });
    };

    // --- IMAGE & SAVE ---

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [4, 3], quality: 1,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSavePlan = async () => {
        if (!currentUser) return Alert.alert("Error", t('alertLoginUpload'));
        if (!planName || !days || !imageUri) return Alert.alert("Missing Info", t('alertFillAllPlan'));

        setUploading(true);
        try {
            // Flatten the 2D schedule into a 1D list for Firebase
            // Add a "day" property to each item: "Day 1", "Day 2"
            let flatItems = [];
            
            schedule.forEach((daySlots, index) => {
                const dayNumber = index + 1;
                // Filter out placeholders
                const actualDayItems = daySlots.filter(item => !item.isPlaceholder).map(item => ({
                    title: item.title,
                    type: item.type,
                    price: item.price,
                    itemId: item.itemId,
                    time: item.time,
                    day: `Day ${dayNumber}` // Important for reading back later
                }));
                flatItems = [...flatItems, ...actualDayItems];
            });

            const planData = {
                title: planName,
                description: planDescription,
                days: days, 
                pax: pax,
                price: `RM ${totalExpense.toFixed(2)}`,
                agencyId: currentUser.uid,
                referenceId: planId,
                items: flatItems, // Save the flattened list
                rating: 5,
                createdAt: new Date().toISOString()
            };

            await addPlan(planData, imageUri);
            Alert.alert("Success", t('alertPlanUploaded'));
            router.back();
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setUploading(false);
        }
    };

    // --- COMPONENTS ---

    const SelectionModal = ({ visible, title, data, onClose, onSelect }) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '60%' }]}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.modalOption} 
                                onPress={() => { onSelect(item); onClose(); }}
                            >
                                <Text style={styles.modalOptionText}>{item}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#CCC" />
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>{t('close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderPieChart = () => {
        const paxNum = parseInt(pax) || 1;
        
        // Flatten schedule for calculation
        const allItems = schedule.flat();

        const getSum = (type) => allItems
            .filter(i => i.type?.toLowerCase() === type.toLowerCase())
            .reduce((a, b) => a + (b.price || 0), 0) * paxNum;

        const foodTotal = getSum('food');
        const entTotal = getSum('entertainment');
        const grandTotal = foodTotal + entTotal || 1;

        const foodPct = (foodTotal / grandTotal) * 100;
        const entPct = (entTotal / grandTotal) * 100;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.pieCircle}>
                    {foodPct > 0 && <View style={[styles.slice, { backgroundColor: '#81C784', width: `${foodPct}%` }]} />}
                    {entPct > 0 && <View style={[styles.slice, { backgroundColor: '#FF8A65', width: `${entPct}%` }]} />}
                    {grandTotal === 1 && <View style={[styles.slice, { backgroundColor: '#EEE', width: '100%' }]} />}
                    <View style={styles.chartOverlay}>
                        <Text style={styles.chartTotalText}>RM {(grandTotal === 1 ? 0 : grandTotal).toFixed(0)}</Text>
                        <Text style={styles.chartTotalLabel}>{t('total')}</Text>
                    </View>
                </View>
                <View style={styles.legendContainer}>
                    <LegendItem color="#81C784" label={t('legendFood')} />
                    <LegendItem color="#FF8A65" label={t('legendEnt')} />
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

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#648DDB" />;

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('uploadPlanTitle')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        
                        {/* 1. IMAGE UPLOAD */}
                        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="camera-outline" size={40} color="#648DDB" />
                                    <Text style={styles.uploadText}>{t('uploadPic')}</Text>
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="pencil" size={12} color="#FFF" />
                            </View>
                        </TouchableOpacity>

                        {/* 2. BASIC INFO FORM */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionHeader}>{t('tripInfo')}</Text>
                            
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('planName')}</Text>
                                <TextInput 
                                    style={styles.input} 
                                    placeholder={t('placeholderPlanNameTrip')} 
                                    value={planName} 
                                    onChangeText={setPlanName} 
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput 
                                    style={[styles.input, styles.textArea]} 
                                    placeholder="Enter a short description..." 
                                    value={planDescription} 
                                    onChangeText={setPlanDescription} 
                                    multiline={true}
                                    numberOfLines={3}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.halfInput, { flex: 1, marginRight: 10 }]}>
                                    <Text style={styles.label}>{t('selectDuration')}</Text>
                                    <TouchableOpacity 
                                        onPress={() => setShowDurationModal(true)} 
                                        style={styles.dropdownBtn}
                                    >
                                        <Text style={{color: days ? '#333' : '#999'}}>
                                            {days || "Select Days"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={18} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={[styles.halfInput, { width: 100 }]}>
                                    <Text style={styles.label}>{t('noOfPax')}</Text>
                                    <TextInput 
                                        style={[styles.input, {textAlign: 'center'}]} 
                                        value={pax} 
                                        onChangeText={setPax} 
                                        keyboardType="numeric" 
                                    />
                                </View>
                            </View>
                        </View>

                        {/* 3. MULTI-DAY INTERACTIVE TIMELINE */}
                        <Text style={styles.handwrittenTitle}>Build Your Schedule</Text>
                        
                        {/* Day Switcher Bar */}
                        <View style={styles.daySwitcher}>
                            <TouchableOpacity 
                                onPress={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentDayIndex === 0}
                                style={{ opacity: currentDayIndex === 0 ? 0.3 : 1 }}
                            >
                                <Ionicons name="chevron-back-circle" size={30} color="#648DDB" />
                            </TouchableOpacity>
                            
                            <Text style={styles.dayTitle}>Day {currentDayIndex + 1} / {schedule.length}</Text>
                            
                            <TouchableOpacity 
                                onPress={() => setCurrentDayIndex(prev => Math.min(schedule.length - 1, prev + 1))}
                                disabled={currentDayIndex === schedule.length - 1}
                                style={{ opacity: currentDayIndex === schedule.length - 1 ? 0.3 : 1 }}
                            >
                                <Ionicons name="chevron-forward-circle" size={30} color="#648DDB" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.hintText}>Tap a slot to add activity for Day {currentDayIndex + 1}</Text>
                        
                        <View style={styles.timelineCard}>
                            {/* Render ONLY slots for the CURRENT day */}
                            {schedule[currentDayIndex]?.map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.timelineRow} 
                                    onPress={() => handleSlotClick(index)}
                                >
                                    <View style={styles.timeCol}>
                                        <Text style={styles.timeText}>{item.time}</Text>
                                        {index < schedule[currentDayIndex].length - 1 && <View style={styles.dottedLine} />}
                                    </View>
                                    <View style={styles.contentCol}>
                                        <Text style={[styles.contentTitle, item.isPlaceholder && styles.placeholderTitle]}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.contentDesc}>
                                            {item.isPlaceholder ? "Tap to add activity" : `${item.type} • RM ${item.price.toFixed(2)}`}
                                        </Text>
                                    </View>
                                    <Ionicons name="add-circle-outline" size={24} color="#648DDB" />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* 4. TOTAL & CHART */}
                        <View style={styles.summaryCard}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>{t('totalExpenses')}</Text>
                                <Text style={styles.totalValue}>RM {totalExpense.toFixed(2)}</Text>
                            </View>
                            {renderPieChart()}
                        </View>

                        {/* 5. SAVE BUTTON */}
                        <TouchableOpacity 
                            style={[styles.saveBtn, uploading && styles.disabledBtn]} 
                            onPress={handleSavePlan} 
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
                        </TouchableOpacity>

                        <View style={{height: 40}} />
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* MODAL 1: SELECT DURATION */}
                <SelectionModal 
                    visible={showDurationModal}
                    title={t('selectDuration')}
                    data={generateDaysOptions()}
                    onClose={() => setShowDurationModal(false)}
                    onSelect={setDays}
                />

                {/* MODAL 2: SELECT TYPE */}
                <Modal visible={showTypeModal} transparent animationType="fade">
                    <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Activity Type</Text>
                            <TouchableOpacity style={styles.modalOption} onPress={() => handleTypeSelect('Food')}>
                                <Ionicons name="restaurant" size={24} color="#81C784" />
                                <Text style={styles.modalOptionText}>Add Food</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalOption} onPress={() => handleTypeSelect('Entertainment')}>
                                <Ionicons name="ticket" size={24} color="#FF8A65" />
                                <Text style={styles.modalOptionText}>Add Entertainment</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalOption, {borderBottomWidth:0}]} onPress={() => handleTypeSelect('Clear')}>
                                <Ionicons name="trash-outline" size={24} color="#CCC" />
                                <Text style={styles.modalOptionText}>Clear Slot</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* MODAL 3: SELECT ITEM */}
                <Modal visible={showItemModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { height: '60%' }]}>
                            <Text style={styles.modalTitle}>Select {selectedType}</Text>
                            <FlatList 
                                data={currentList}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemOption} onPress={() => handleItemSelect(item)}>
                                        <View>
                                            <Text style={styles.itemOptionTitle}>{item.title}</Text>
                                            <Text style={styles.itemOptionPrice}>RM {item.price.toFixed(2)}</Text>
                                        </View>
                                        <Ionicons name="add" size={20} color="#648DDB" />
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowItemModal(false)}>
                                <Text style={styles.closeBtnText}>{t('close')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: 20 },
    
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFF' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

    // Image Upload
    imageContainer: { width: '100%', height: 180, borderRadius: 16, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed' },
    uploadedImage: { width: '100%', height: '100%', borderRadius: 16 },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { color: '#648DDB', marginTop: 5, fontWeight: '600' },
    editBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 12 },

    // Form
    formSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 20, elevation: 1 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#444' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 5 },
    input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, color: '#333' },
    
    textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    halfInput: { },
    dropdownBtn: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // Timeline & Day Switcher
    handwrittenTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    
    daySwitcher: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, backgroundColor: '#FFF', borderRadius: 12, padding: 10, elevation: 1 },
    dayTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    hintText: { fontSize: 12, color: '#888', marginBottom: 15, fontStyle: 'italic' },
    timelineCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 25, elevation: 2 },
    timelineRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
    timeCol: { width: 75, alignItems: 'center' },
    timeText: { fontSize: 13, fontWeight: 'bold', color: '#648DDB' },
    dottedLine: { position: 'absolute', top: 20, bottom: -30, width: 1, backgroundColor: '#CCC', borderStyle: 'dotted', borderWidth: 1, borderColor: '#CCC' },
    contentCol: { flex: 1, marginLeft: 15, paddingBottom: 5 },
    contentTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
    placeholderTitle: { color: '#999', fontStyle: 'italic' },
    contentDesc: { fontSize: 12, color: '#666', marginTop: 2 },

    // Summary & Chart
    summaryCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 10 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: '#648DDB' },
    
    chartContainer: { alignItems: 'center', marginBottom: 10 },
    pieCircle: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', flexDirection: 'row', position: 'relative', marginBottom: 15 },
    slice: { height: '100%' },
    chartOverlay: { position: 'absolute', top: 30, left: 30, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    chartTotalText: { fontWeight: 'bold', fontSize: 12, color: '#333' },
    chartTotalLabel: { fontSize: 10, color: '#666' },
    legendContainer: { flexDirection: 'row', gap: 15 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
    legendText: { fontSize: 12, color: '#555' },

    // Save Button
    saveBtn: { backgroundColor: '#648DDB', paddingVertical: 15, borderRadius: 12, alignItems: 'center', elevation: 3 },
    disabledBtn: { backgroundColor: '#A0C0F0' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    modalOptionText: { fontSize: 16, marginLeft: 15, color: '#333' },
    
    itemOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    itemOptionTitle: { fontSize: 16, color: '#333', fontWeight: '500' },
    itemOptionPrice: { fontSize: 14, color: '#666' },
    
    closeBtn: { marginTop: 15, alignItems: 'center', padding: 10 },
    closeBtnText: { color: '#648DDB', fontWeight: 'bold' }
});