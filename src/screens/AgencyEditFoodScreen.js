import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient'; // 🎨 引入渐变库
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
// 1. Google Places
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// Services
import { useLanguage } from '../context/LanguageContext';
import { getFoodById, updateFood } from '../services/AuthService';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

// 🔴 API KEY
const GOOGLE_PLACES_API_KEY = 'AIzaSyDIAZukJLwu4-KsDsZASQ8byWKAEPTos7g'; 

const AgencyEditFoodScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { t } = useLanguage();
    const locationRef = useRef();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [imageUri, setImageUri] = useState(null); 
    const [currentImageUrl, setCurrentImageUrl] = useState(null); 
    const [location, setLocation] = useState(''); 

    // Food Form Data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        locationURL: '',
        priceRange: '', // Acts as Approximate Price
        // cuisineType removed
        suggestedTransport: '',
        transportCost: '',
        rating: '', 
    });

    // 1. Fetch Existing Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (id) {
                    const data = await getFoodById(id);
                    if (data) {
                        setFormData({
                            title: data.title || '',
                            description: data.description || '',
                            locationURL: data.locationURL || '',
                            priceRange: data.priceRange || '',
                            // cuisineType removed
                            suggestedTransport: data.suggestedTransport || '',
                            transportCost: data.transportCost ? data.transportCost.toString() : '0',
                            rating: data.rating ? data.rating.toString() : '0',
                        });
                        setCurrentImageUrl(data.imageUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching food data:", error);
                Alert.alert("Error", "Failed to load details.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // 2. Pick Image
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. Handle Save
    const handleSave = async () => {
        // Removed check for cuisineType
        if (!formData.title || !formData.description || !formData.priceRange) {
            Alert.alert("Missing Info", "Title, Description, and Price are required.");
            return;
        }

        if (!formData.locationURL) {
            Alert.alert("Missing Location", "Please select a location.");
            return;
        }

        setSubmitting(true);
        try {
            // Auto-Calculate Total (Price + Transport)
            const price = parseFloat(formData.priceRange) || 0;
            const transport = parseFloat(formData.transportCost) || 0;
            const total = price + transport;

            const updatedData = {
                ...formData,
                transportCost: transport,
                estimatedTotalExpenses: total, // Automatic calculation
                rating: parseFloat(formData.rating) || 0, 
            };

            await updateFood(id, updatedData, imageUri);

            Alert.alert("Success", "Food updated successfully!", [
                { 
                    text: "OK", 
                    onPress: () => router.back()
                } 
            ]);
        } catch (error) {
            console.error("Update error:", error);
            Alert.alert("Error", "Failed to update food.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, backgroundColor: '#F9FAFB' }} // 🎨 Soft Background
        >
            <ScrollView 
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
            >
                {/* --- Image Section --- */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.image} />
                        ) : currentImageUrl ? (
                            <Image source={{ uri: currentImageUrl }} style={styles.image} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Ionicons name="fast-food-outline" size={50} color="#B0B0B0" />
                                <Text style={styles.placeholderText}>Tap to add image</Text>
                            </View>
                        )}
                        <View style={styles.editIconBadge}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* --- Form Card --- */}
                <View style={styles.formCard}>

                    {/* Title */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            {/* [DELETED] Ionicons icon here */}
                            <Text style={styles.label}>{t('entName') || "Food Name"}</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={formData.title}
                            onChangeText={(text) => handleChange('title', text)}
                            placeholder="Enter food name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* --- LOCATION SEARCH --- */}
                    <View style={[styles.formGroup, { zIndex: 9999, marginBottom: 15 }]}>
                        <View style={styles.labelRow}>
                            <Ionicons name="location-outline" size={16} color="#666" style={{marginRight:5}}/>
                            <Text style={styles.label}>{t('locationSearch') || "Location Search"}</Text>
                        </View>
                        
                        {/* [DELETED] Current Location Set Text Block */}

                        <GooglePlacesAutocomplete
                            ref={locationRef}
                            debounce={300}
                            textInputProps={{
                                onChangeText: (text) => { console.log(text); }, 
                                autoCorrect: false, 
                            }}
                            placeholder={t('placeholderLocSearch') || "Search Location"}
                            fetchDetails={true}
                            onPress={(data, details = null) => {
                                setLocation(data.description);
                                if (details?.geometry?.location) {
                                    const { lat, lng } = details.geometry.location;
                                    const cleanUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                                    handleChange('locationURL', cleanUrl);
                                } 
                                else if (details?.url) {
                                    handleChange('locationURL', details.url);
                                }
                            }}
                            query={{
                                key: GOOGLE_PLACES_API_KEY,
                                language: 'en',
                            }}
                            styles={{
                                textInput: styles.googleInput,
                                listView: styles.searchListView,
                                container: { flex: 0 },
                            }}
                            enablePoweredByContainer={false}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <Ionicons name="document-text-outline" size={16} color="#666" style={{marginRight:5}}/>
                            <Text style={styles.label}>Description</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => handleChange('description', text)}
                            placeholder="Describe the food..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* --- Approximate Price (Cuisine Type Removed) --- */}
                    {/* Changed from row/flex to standard full width formGroup since it's alone now */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <Ionicons name="pricetag-outline" size={16} color="#666" style={{marginRight:5}}/>
                            <Text style={styles.label}>{t('approxPrice') || "Approx. Price"}</Text>
                        </View>
                        <View style={styles.inputWithIcon}>
                            <Text style={styles.prefixText}>RM</Text>
                            <TextInput
                                style={[styles.input, styles.inputNoBorder]}
                                value={formData.priceRange}
                                onChangeText={(text) => handleChange('priceRange', text)}
                                placeholder="0.00"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* --- ROW: Transport & Cost --- */}
                    <View style={styles.row}>
                        {/* Suggested Transport */}
                        <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                            <View style={styles.labelRow}>
                                <Ionicons name="bus-outline" size={16} color="#666" style={{marginRight:5}}/>
                                <Text style={styles.label}>{t('transportLabel') || "Transport"}</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                value={formData.suggestedTransport}
                                onChangeText={(text) => handleChange('suggestedTransport', text)}
                                placeholder="e.g. Grab"
                                placeholderTextColor="#999"
                            />
                        </View>

                        {/* Transport Cost */}
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <View style={styles.labelRow}>
                                <Ionicons name="cash-outline" size={16} color="#666" style={{marginRight:5}}/>
                                <Text style={styles.label}>{t('transportCost') || "Trans. Cost"}</Text>
                            </View>
                            <View style={styles.inputWithIcon}>
                                <Text style={styles.prefixText}>RM</Text>
                                <TextInput
                                    style={[styles.input, styles.inputNoBorder]}
                                    value={formData.transportCost}
                                    onChangeText={(text) => handleChange('transportCost', text)}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity 
                        onPress={handleSave}
                        disabled={submitting}
                        activeOpacity={0.8}
                        style={{ marginTop: 20 }}
                    >
                        <LinearGradient
                            colors={submitting ? ['#A0A0A0', '#A0A0A0'] : ['#4A90E2', '#357ABD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButton}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>{t('save') || "Save Changes"}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                </View>

                <View style={{ height: 100 }} /> 
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: 15, paddingBottom: 100 },
    
    // --- Image Section ---
    imageSection: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
    imageContainer: { 
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    image: { width: 160, height: 160, borderRadius: 20, backgroundColor: '#EEE' },
    placeholderImage: { 
        width: 160, height: 160, borderRadius: 20, 
        backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed'
    },
    placeholderText: { color: '#888', marginTop: 8, fontSize: 12, fontWeight: '500' },
    editIconBadge: {
        position: 'absolute', bottom: -5, right: -5,
        backgroundColor: '#4A90E2', padding: 10, borderRadius: 30,
        borderWidth: 3, borderColor: '#FFF',
    },

    // --- Form Card ---
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    formGroup: { marginBottom: 18 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    label: { fontSize: 14, fontWeight: '600', color: '#444' },
    
    // --- Inputs ---
    input: {
        backgroundColor: '#F5F7FA', // Soft gray
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    prefixText: {
        paddingLeft: 15,
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },
    inputNoBorder: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    
    // --- Google Places Override ---
    googleInput: {
        backgroundColor: '#F5F7FA',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        height: 50,
    },
    searchListView: {
        backgroundColor: 'white',
        borderRadius: 10,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#EEE',
        elevation: 5, 
        zIndex: 9999, 
    },

    textArea: { height: 100, textAlignVertical: 'top' },
    row: { flexDirection: 'row' },

    // --- Buttons ---
    saveButton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default AgencyEditFoodScreen;