import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react'; // 🔥 1. Added useEffect
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    LogBox,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '../context/LanguageContext';
import { addFood } from '../services/AuthService';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const generateFoodId = () => {
    const timestamp = new Date().getTime().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `F${timestamp}${random}`;
};

// 🔴 REPLACE WITH YOUR ACTUAL API KEY
const GOOGLE_PLACES_API_KEY = 'AIzaSyDIAZukJLwu4-KsDsZASQ8byWKAEPTos7g'; 

export default function AgencyUploadFoodScreen() {
    const router = useRouter();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const locationRef = useRef(); 
    const { t } = useLanguage();

    const [foodId] = useState(generateFoodId());
    
    // --- States ---
    const [foodName, setFoodName] = useState('');
    const [priceRange, setPriceRange] = useState(''); // This acts as "Price" for calculation
    const [cuisineType, setCuisineType] = useState('');
    
    // New Fields
    const [transportType, setTransportType] = useState('');
    const [transportCost, setTransportCost] = useState('');
    const [estimatedTotal, setEstimatedTotal] = useState('');
    const [description, setDescription] = useState('');

    const [location, setLocation] = useState(''); 
    const [locationUrl, setLocationUrl] = useState(''); 
    
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

    // 🔥 2. AUTO-CALCULATION LOGIC 🔥
    // Whenever priceRange or transportCost changes, this runs automatically.
    useEffect(() => {
        const price = parseFloat(priceRange) || 0;
        const transport = parseFloat(transportCost) || 0;
        const total = price + transport;

        // Only update if we have a valid total > 0
        if (total > 0) {
            setEstimatedTotal(total.toString());
        } else {
            setEstimatedTotal('');
        }
    }, [priceRange, transportCost]);

    const handleReset = () => {
        setFoodName('');
        setPriceRange('');
        setCuisineType('');
        setTransportType('');
        setTransportCost('');
        setEstimatedTotal('');
        setDescription('');
        setLocation('');
        setLocationUrl(''); 
        setImageUri(null);
        if (locationRef.current) {
            locationRef.current.setAddressText('');
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true,
            aspect: [4, 3], 
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!currentUser) {
            Alert.alert(t('alertErrorTitle'), t('alertLoginUpload'));
            return;
        }

        // Basic Validation
        if (!foodName || !priceRange || !cuisineType || !locationUrl || !imageUri) {
            Alert.alert(t('alertErrorTitle'), t('alertFillAllFood'));
            return;
        }

        const foodData = {
            title: foodName,              
            priceRange: priceRange,       
            cuisineType: cuisineType,
            description: description || `Cuisine: ${cuisineType}`, 
            locationURL: locationUrl, 
            
            suggestedTransport: transportType || 'N/A',
            transportCost: parseFloat(transportCost) || 0,
            estimatedTotalExpenses: parseFloat(estimatedTotal) || 0, // Uses the auto-calculated value
            
            rating: 5, 
            agencyId: currentUser.uid
        };

        setLoading(true);
        try {
            await addFood(foodData, imageUri);
            Alert.alert(t('alertSuccessTitle'), t('alertFoodUploaded'));
            handleReset(); 
        } catch (error) {
            console.error("Upload Error:", error);
            Alert.alert(t('alertUploadFailed'), error.message || t('alertUnknownError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="#333" /> 
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('uploadFoodTitle')}</Text>
                <View style={{ width: 33 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true}
                >
                    
                    <Text style={styles.idText}>
                        {t('foodId')} <Text style={{ fontWeight: '600' }}>{foodId}</Text>
                    </Text>

                    {/* Image Section */}
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
                        <TouchableOpacity 
                            style={styles.changePictureButtonContainer}
                            onPress={pickImage}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#4CD964', '#28A745']} 
                                start={{ x: 0, y: 0 }} 
                                end={{ x: 1, y: 0 }}   
                                style={styles.gradientButton} 
                            >
                                <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                                <Text style={styles.changePictureText}>
                                    {imageUri ? t('changePic') : t('uploadPic')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        
                        <Text style={styles.label}>{t('foodName')}</Text>
                        <TextInput 
                            style={styles.inputField} 
                            placeholder={t('placeholderFoodName')}
                            placeholderTextColor="#888"
                            value={foodName} 
                            onChangeText={setFoodName} 
                        />
                        
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>{t('approxPrice') || "Approximate Price"}</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder={t('placeholderApproxPrice')}
                                    placeholderTextColor="#888"
                                    keyboardType="numeric" // Added numeric keyboard for better calc
                                    value={priceRange} 
                                    onChangeText={setPriceRange} 
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>{t('cuisineType')}</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder={t('placeholderCuisine')}
                                    placeholderTextColor="#888"
                                    value={cuisineType} 
                                    onChangeText={setCuisineType} 
                                />
                            </View>
                        </View>

                        {/* --- NEW FIELDS: Transport & Cost --- */}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>{t('transportType') || "Transport"}</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. Grab"
                                    placeholderTextColor="#888"
                                    value={transportType} 
                                    onChangeText={setTransportType} 
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>{t('transportCost') || "Trans. Cost"}</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. 10"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={transportCost} 
                                    onChangeText={setTransportCost} 
                                />
                            </View>
                        </View>

                        {/* --- Estimated Total (Auto-Calculated) --- */}
                        <Text style={styles.label}>{t('estTotalRM') || "Estimated Total (RM)"}</Text>
                        <TextInput 
                            style={styles.inputField} // Optional: Grey out slightly
                            placeholder="e.g. 25"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={estimatedTotal} 
                            onChangeText={setEstimatedTotal} 
                            editable={true} // Users can still edit if they really want to
                        />

                        {/* --- LOCATION SEARCH (Fixed URL Logic) --- */}
                        <Text style={styles.label}>{t('locationSearch')}</Text>
                        <View style={{ zIndex: 9999, marginBottom: 15 }}>
                            <GooglePlacesAutocomplete
                                ref={locationRef}
                                debounce={300} 
                                textInputProps={{
                                    onChangeText: (text) => { console.log(text); },
                                    autoCorrect: false,
                                }}
                                placeholder={t('placeholderRestSearch')}
                                fetchDetails={true}
                                onPress={(data, details = null) => {
                                    setLocation(data.description);
                                    
                                    if (details?.geometry?.location) {
                                        const { lat, lng } = details.geometry.location;
                                        // Standard Google Maps URL
                                        const cleanUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                                        
                                        setLocationUrl(cleanUrl);
                                        console.log("Saved Clean URL:", cleanUrl);
                                    } 
                                    else if (details?.url) {
                                        setLocationUrl(details.url);
                                    }
                                }}
                                query={{
                                    key: GOOGLE_PLACES_API_KEY,
                                    language: 'en',
                                }}
                                styles={{
                                    textInput: styles.searchInput,
                                    listView: styles.searchListView,
                                    container: { flex: 0 },
                                }}
                                enablePoweredByContainer={false}
                            />
                        </View>

                        {/* --- NEW FIELD: Description --- */}
                        <Text style={styles.label}>{t('labelDescription') || "Description"}</Text>
                        <TextInput 
                            style={[styles.inputField, styles.multilineInput]} 
                            placeholder="Enter food details..."
                            placeholderTextColor="#888"
                            multiline
                            numberOfLines={4}
                            value={description} 
                            onChangeText={setDescription} 
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.resetButton, loading && {opacity: 0.5}]}
                                onPress={handleReset}
                                disabled={loading}
                            >
                                <Text style={styles.resetButtonText}>{t('reset')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, !imageUri && {opacity: 0.5}]}
                                onPress={handleSave}
                                disabled={loading || !imageUri}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    headerBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FFFFFF',
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
    
    idText: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 10, marginRight: 5 },

    imageContainer: { alignItems: 'center', marginBottom: 25 },
    imageBox: {
        width: 150, height: 150, borderRadius: 15,
        backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E1E1',
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 10,
    },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    changePictureButtonContainer: {
        borderRadius: 25, overflow: 'hidden', marginTop: 10,
        shadowColor: "#28A745", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, paddingHorizontal: 25,
    },
    changePictureText: { marginLeft: 8, fontSize: 14, color: '#FFFFFF', fontWeight: 'bold' },

    formContainer: {
        backgroundColor: '#F4FFF2', 
        borderRadius: 15, padding: 20, marginBottom: 30,
        elevation: 2,
        zIndex: 1, 
    },
    label: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '600' },
    
    inputField: {
        width: '100%', height: 45, borderWidth: 1, borderColor: '#E1E1E1',
        borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
        fontSize: 15, marginBottom: 15, color: '#333',
    },

    multilineInput: {
        height: 100, textAlignVertical: 'top', paddingTop: 10,
    },

    searchInput: {
        height: 45,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        fontSize: 15,
        color: '#333',
    },
    searchListView: {
        backgroundColor: 'white',
        borderRadius: 5,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 3, 
        zIndex: 9999, 
    },
    
    row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    col: { width: '48%' },

    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 10, zIndex: -1 },
    resetButton: {
        flex: 1, backgroundColor: '#EBEBEB', paddingVertical: 12,
        borderRadius: 8, marginRight: 10, alignItems: 'center',
    },
    resetButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
    
    saveButton: {
        flex: 1, backgroundColor: '#648DDB', paddingVertical: 12,
        borderRadius: 8, marginLeft: 10, alignItems: 'center',
    },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});