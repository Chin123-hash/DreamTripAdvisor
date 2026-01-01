// src/screens/AgencyUploadFoodScreen.js

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import React, { useRef, useState } from 'react';
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

import { addFood } from '../services/AuthService';

// Ignore nested list warnings
LogBox.ignoreLogs(['VirtualizedLists should not be nested']);

const generateFoodId = () => {
    const timestamp = new Date().getTime().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `F${timestamp}${random}`;
};

// 🔴 REPLACE WITH YOUR ACTUAL API KEY
const GOOGLE_PLACES_API_KEY = 'AIzaSyDIAZukJLwu4-KsDsZASQ8byWKAEPTos7g'; 

export function AgencyUploadFoodScreen() {
    const router = useRouter();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const locationRef = useRef(); 

    // State Variables
    const [foodId] = useState(generateFoodId());
    const [foodName, setFoodName] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [cuisineType, setCuisineType] = useState('');
    
    // [FIX 1] Added separate state for the URL
    const [location, setLocation] = useState(''); // Text address (Visual)
    const [locationUrl, setLocationUrl] = useState(''); // Map Link (Logic)
    
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleReset = () => {
        setFoodName('');
        setPriceRange('');
        setCuisineType('');
        setLocation('');
        setLocationUrl(''); // Clear URL on reset
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
            Alert.alert("Error", "You must be logged in.");
            return;
        }

        // Check if locationUrl is present now
        if (!foodName || !priceRange || !cuisineType || !location || !imageUri) {
            Alert.alert("Missing Info", "Please fill in all fields and upload a picture.");
            return;
        }

        const finalDescription = `Cuisine: ${cuisineType}\nLocation: ${location}`;

        const foodData = {
            title: foodName,              
            priceRange: priceRange,       
            description: finalDescription,
            
            // [FIX 2] Explicitly saving the locationURL
            locationURL: locationUrl, 
            
            suggestedTransport: 'N/A',
            transportCost: 0,
            estimatedTotalExpenses: parseFloat(priceRange) || 0,
            rating: 5,
        };

        setLoading(true);
        try {
            await addFood(foodData, imageUri);
            
            Alert.alert("Success", "Food Item Uploaded!");
            handleReset(); 
        } catch (error) {
            console.error("Upload Error:", error);
            Alert.alert("Upload Failed", error.message || "Error occurred.");
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
                <Text style={styles.headerTitle}>Upload Food</Text>
                <View style={{ width: 33 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="always" 
                >
                    
                    <Text style={styles.idText}>
                        Food ID: <Text style={{ fontWeight: '600' }}>{foodId}</Text>
                    </Text>

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
                                    {imageUri ? "Change Picture" : "Upload Picture"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        
                        <Text style={styles.label}>Food Name</Text>
                        <TextInput 
                            style={styles.inputField} 
                            placeholder="e.g. Taiyaki"
                            placeholderTextColor="#888"
                            value={foodName} 
                            onChangeText={setFoodName} 
                        />
                        
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Price Range (RM)</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="10.00" 
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={priceRange} 
                                    onChangeText={setPriceRange} 
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Cuisine Type</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Japanese cuisine" 
                                    placeholderTextColor="#888"
                                    value={cuisineType} 
                                    onChangeText={setCuisineType} 
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Location Search</Text>
                        <View style={{ zIndex: 9999, marginBottom: 15 }}>
                            <GooglePlacesAutocomplete
                                ref={locationRef}
                                placeholder="Search Restaurant Location..."
                                fetchDetails={true}
                                onPress={(data, details = null) => {
                                    // 1. Save Text Address
                                    setLocation(data.description);
                                    
                                    // [FIX 3] Generate and Save URL
                                    if (details?.url) {
                                        setLocationUrl(details.url);
                                    } else if (details?.geometry?.location) {
                                        const { lat, lng } = details.geometry.location;
                                        const generatedUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                                        setLocationUrl(generatedUrl);
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

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.resetButton, loading && {opacity: 0.5}]}
                                onPress={handleReset}
                                disabled={loading}
                            >
                                <Text style={styles.resetButtonText}>Reset</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveButton, !imageUri && {opacity: 0.5}]}
                                onPress={handleSave}
                                disabled={loading || !imageUri}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save</Text>
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