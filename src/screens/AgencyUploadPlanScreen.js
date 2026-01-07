import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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

import { useRouter } from 'expo-router';
import { addPlan, fetchEntertainmentList, fetchFoodList } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

const generateDaysOptions = () => {
    const options = [];
    for (let i = 2; i <= 15; i++) {
        options.push(`${i}D${i - 1}N`);
    }
    return options;
};

const generatePlanId = () => {
    const timestamp = new Date().getTime().toString().slice(-10);
    return `P${timestamp}`;
};

// --- FIX: Added 'default' keyword here ---
export default function AgencyUploadPlanScreen() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const router = useRouter();
    // 2. Destructure Hook
    const { t } = useLanguage();

    // --- State Variables ---
    const [planId] = useState(generatePlanId());
    
    // Form Inputs
    const [planName, setPlanName] = useState('');
    const [days, setDays] = useState(''); 
    const [pax, setPax] = useState('');
    const [cost, setCost] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

    // Dropdown Data
    const [entList, setEntList] = useState([]);
    const [foodList, setFoodList] = useState([]);
    
    // Selections
    const [selectedEnt, setSelectedEnt] = useState(null); 
    const [selectedFood, setSelectedFood] = useState(null); 

    // Modals Visibility
    const [showDaysModal, setShowDaysModal] = useState(false);
    const [showEntModal, setShowEntModal] = useState(false);
    const [showFoodModal, setShowFoodModal] = useState(false);

    // --- 1. Load Data from AuthService ---
    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                const entData = await fetchEntertainmentList();
                const formattedEnts = entData.map(item => ({
                    id: item.value,
                    title: item.label
                }));
                setEntList(formattedEnts);

                const foodData = await fetchFoodList();
                const formattedFoods = foodData.map(item => ({
                    id: item.value,
                    title: item.label
                }));
                setFoodList(formattedFoods);

            } catch (error) {
                console.error("Error loading dropdowns:", error);
                Alert.alert(t('alertErrorTitle'), t('alertLoadFail'));
            }
        };

        loadDropdownData();
    }, []);

    // --- 2. Image Picker ---
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true, aspect: [4, 3], quality: 1,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    // --- 3. Reset Form ---
    const handleReset = () => {
        setPlanName('');
        setDays('');
        setPax('');
        setCost('');
        setSelectedEnt(null);
        setSelectedFood(null);
        setImageUri(null);
    };

    // --- 4. Save Logic (Uses addPlan from AuthService) ---
    const handleSave = async () => {
        if (!currentUser) return Alert.alert(t('alertErrorTitle'), t('alertLoginUpload'));

        if (!planName || !days || !pax || !cost || !imageUri) {
            return Alert.alert(t('alertErrorTitle'), t('alertFillAllPlan'));
        }

        if (!selectedEnt && !selectedFood) {
            return Alert.alert(t('alertRequiredTitle'), t('alertSelectOne'));
        }

        setLoading(true);
        try {
            const finalPrice = `RM ${cost}`;
            const planData = {
                title: planName,
                days: days,
                pax: pax,
                price: finalPrice,
                agencyId: currentUser.uid,
                referenceId: planId,
                
                entertainmentId: selectedEnt ? selectedEnt.id : null,
                entertainmentName: selectedEnt ? selectedEnt.title : 'None',
                
                foodId: selectedFood ? selectedFood.id : null,
                foodName: selectedFood ? selectedFood.title : 'None',
                
                rating: 5 // Default rating
            };

            await addPlan(planData, imageUri);
            
            Alert.alert(t('alertSuccessTitle'), t('alertPlanUploaded'));
            handleReset();
        } catch (error) {
            Alert.alert(t('alertUploadFailed'), error.message || t('alertUnknownError'));
        } finally {
            setLoading(false);
        }
    };

    // --- 5. Selection Modal (No Icons) ---
    const SelectionModal = ({ visible, onClose, data, onSelect, title }) => (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    {data.length === 0 ? (
                        <Text style={styles.emptyText}>{t('noItemsFound')}</Text>
                    ) : (
                        <FlatList
                            data={data}
                            keyExtractor={(item, index) => item.id || index.toString()}
                            renderItem={({ item }) => {
                                let displayText = "";
                                if (typeof item === 'string') {
                                    displayText = item;
                                } else if (item && item.title) {
                                    displayText = item.title;
                                } else {
                                    displayText = t('unnamedItem');
                                }

                                return (
                                    <TouchableOpacity 
                                        style={styles.optionItem}
                                        onPress={() => { onSelect(item); onClose(); }}
                                    >
                                        <Text style={styles.optionText}>{displayText}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>{t('close')}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const isBasicFilled = planName && days && pax && cost && imageUri;
    const isSelectionValid = selectedEnt || selectedFood;
    const canSave = isBasicFilled && isSelectionValid;

    return (
        
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#333" /> 
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('uploadPlanTitle')}</Text>
                <View style={{ width: 33 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    
                    <Text style={styles.idText}>
                        {t('planId')} <Text style={{ fontWeight: '600' }}>{planId}</Text>
                    </Text>

                    {/* Image Upload Area */}
                    <View style={styles.imageContainer}>
                        <View style={styles.imageBox}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="image-outline" size={50} color="#CCCCCC" />
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.changePictureButtonContainer} onPress={pickImage} disabled={loading}>
                            <LinearGradient colors={['#4CD964', '#28A745']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                                <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                                <Text style={styles.changePictureText}>{imageUri ? t('changePic') : t('uploadPic')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        
                        <Text style={styles.label}>{t('planName')}</Text>
                        <TextInput 
                            style={styles.inputField} 
                            placeholder={t('placeholderPlanNameTrip')}
                            placeholderTextColor="#888"
                            value={planName} 
                            onChangeText={setPlanName} 
                        />
                        
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>{t('suggestedDays')}</Text>
                                <TouchableOpacity 
                                    style={styles.dropdownField} 
                                    onPress={() => setShowDaysModal(true)}
                                >
                                    <Text style={[styles.dropdownText, !days && {color:'#888'}]}>
                                        {days || t('selectDuration')}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#888" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>{t('suggestedPax')}</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder={t('placeholderPax')}
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={pax} 
                                    onChangeText={setPax} 
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>{t('legendEnt')}</Text>
                        <TouchableOpacity 
                            style={styles.dropdownField} 
                            onPress={() => setShowEntModal(true)}
                        >
                            <Text style={[styles.dropdownText, !selectedEnt && {color:'#888'}]}>
                                {selectedEnt ? selectedEnt.title : t('selectEnt')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#888" />
                        </TouchableOpacity>

                        <Text style={styles.label}>{t('legendFood')}</Text>
                        <TouchableOpacity 
                            style={[styles.dropdownField, {marginBottom: 20}]} 
                            onPress={() => setShowFoodModal(true)}
                        >
                            <Text style={[styles.dropdownText, !selectedFood && {color:'#888'}]}>
                                {selectedFood ? selectedFood.title : t('selectFood')}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#888" />
                        </TouchableOpacity>

                        <Text style={styles.label}>{t('estimatedCostPlan')}</Text>
                        <View style={styles.currencyContainer}></View>
                            <Text style={styles.currencyPrefix}>RM</Text>
                            <TextInput 
                                style={styles.inputField} 
                                placeholder="299.00" 
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                value={cost} 
                                onChangeText={(text) => {
                                    const cleanText = text.replace(/[^0-9.]/g, '');
                                    setCost(cleanText);
                                }} 
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={loading}>
                            <Text style={styles.resetButtonText}>{t('reset')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, (!canSave) && {opacity: 0.5, backgroundColor: '#999'}]}
                            onPress={handleSave}
                            disabled={loading || !canSave}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('save')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals */}
            <SelectionModal 
                visible={showDaysModal} title={t('selectDuration')}
                data={generateDaysOptions()} onClose={() => setShowDaysModal(false)}
                onSelect={(item) => setDays(item)}
            />

            <SelectionModal 
                visible={showEntModal} title={t('selectEnt')}
                data={entList} onClose={() => setShowEntModal(false)}
                onSelect={(item) => setSelectedEnt(item)}
            />

            <SelectionModal 
                visible={showFoodModal} title={t('selectFood')}
                data={foodList} onClose={() => setShowFoodModal(false)}
                onSelect={(item) => setSelectedFood(item)}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFFFFF' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
    
    idText: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 20 },

    imageContainer: { alignItems: 'center', marginBottom: 25 },
    imageBox: { width: 150, height: 150, borderRadius: 15, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E1E1', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 10 },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    changePictureButtonContainer: { borderRadius: 25, overflow: 'hidden', marginTop: 10, shadowColor: "#28A745", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
    gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 25 },
    changePictureText: { marginLeft: 8, fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },

    // Form
    formContainer: { backgroundColor: '#F4FFF2', borderRadius: 15, padding: 20, marginBottom: 30, elevation: 2 },
    label: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '600' },
    inputField: { width: '100%', height: 45, borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', fontSize: 15, marginBottom: 15, color: '#333' },
    
    // Dropdown Style
    dropdownField: { width: '100%', height: 45, borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF', marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    dropdownText: { fontSize: 15, color: '#333' },

    row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    col: { width: '48%' },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10 },
    resetButton: { flex: 1, backgroundColor: '#EBEBEB', paddingVertical: 12, borderRadius: 8, marginRight: 10, alignItems: 'center' },
    resetButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
    saveButton: { flex: 1, backgroundColor: '#648DDB', paddingVertical: 12, borderRadius: 8, marginLeft: 10, alignItems: 'center' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    optionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE', flexDirection: 'row', alignItems: 'center' },
    optionText: { fontSize: 16, color: '#333' },
    emptyText: { textAlign: 'center', color: '#999', marginVertical: 20 },
    closeBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
    closeBtnText: { color: '#648DDB', fontWeight: 'bold', fontSize: 16 }
});