// src/screens/AgencyUploadEntertainmentScreen.js

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
    LogBox, // <--- Ensure LogBox is imported
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

import { addEntertainment } from '../services/AuthService';

// [FIXED] Updated the text to match the actual React Native warning exactly
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const generateEntertainmentId = () => {
    const timestamp = new Date().getTime().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `E${timestamp}${random}`;
};

// 🔴 REPLACE WITH YOUR ACTUAL API KEY
const GOOGLE_PLACES_API_KEY = 'AIzaSyDIAZukJLwu4-KsDsZASQ8byWKAEPTos7g'; 

export default function AgencyUploadEntertainmentScreen() { // [FIXED] Added export default
    const router = useRouter();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const locationRef = useRef();

    const [entertainmentId] = useState(generateEntertainmentId());
    
    // --- States ---
    const [title, setTitle] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [transportType, setTransportType] = useState(''); 
    const [transportPrice, setTransportPrice] = useState(''); 
    const [description, setDescription] = useState('');
    const [totalExpenses, setTotalExpenses] = useState('');
    
    // Location States
    const [location, setLocation] = useState(''); 
    const [locationUrl, setLocationUrl] = useState(''); 

    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

    // Calculations
    const tPrice = parseFloat(ticketPrice) || 0;
    const trPrice = parseFloat(transportPrice) || 0;
    const currentSum = tPrice + trPrice;
    
    const totalPlaceholder = currentSum > 0 ? currentSum.toString() : "0.00";

    const handleReset = () => {
        setTitle('');
        setTicketPrice('');
        setTransportType('');
        setTransportPrice('');
        setDescription('');
        setTotalExpenses('');
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
            Alert.alert("Error", "You must be logged in to upload content.");
            return;
        }

        // Basic Validation
        if (!title || !ticketPrice || !description || !imageUri || !locationUrl) {
            Alert.alert("Error", "Please fill in Name, Ticket Price, Description, Location, and upload a Picture.");
            return;
        }

        if (isNaN(parseFloat(ticketPrice)) || (transportPrice && isNaN(parseFloat(transportPrice)))) {
            Alert.alert("Error", "Ticket Price and Transport Price must be valid numbers.");
            return;
        }
        
        // Use user input for total, or auto-calculated sum if empty
        const finalTotal = totalExpenses ? totalExpenses : (currentSum > 0 ? currentSum.toString() : '0');

        const finalDescription = `${description}\n\nLocation: ${location}`;

        const entertainmentData = {
            title: title,
            description: finalDescription, 
            suggestedTransport: transportType || 'N/A', 
            transportCost: transportPrice || '0', 
            estimatedTotalExpenses: finalTotal, 
            ticketPrice: ticketPrice, 
            locationURL: locationUrl, 
            rating: 5, 
            referenceId: entertainmentId,
            agencyId: currentUser.uid 
        };

        setLoading(true);
        try {
            await addEntertainment(entertainmentData, imageUri);
            Alert.alert("Success", "Entertainment Package Uploaded!");
            handleReset(); 
        } catch (error) {
            console.error("Upload Error:", error);
            Alert.alert("Upload Failed", error.message || "An unknown error occurred during upload.");
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
                <Text style={styles.headerTitle}>Upload Entertainment</Text>
                <View style={{ width: 33 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true} // [FIXED] Allow nested scrolling
                >
                    
                    <Text style={styles.idText}>
                        Entertainment ID: <Text style={{ fontWeight: '600' }}>{entertainmentId}</Text>
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
                        <Text style={styles.label}>Entertainment Name</Text>
                        <TextInput 
                            style={styles.inputField} 
                            placeholder="e.g. Sunway Lagoon Ticket"
                            placeholderTextColor="#888"
                            value={title} 
                            onChangeText={setTitle} 
                        />
                        
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Ticket Price (RM)</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. 120" 
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={ticketPrice} 
                                    onChangeText={setTicketPrice} 
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Transport Type</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. Bus/Taxi" 
                                    placeholderTextColor="#888"
                                    value={transportType} 
                                    onChangeText={setTransportType} 
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Transport Cost</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. 50" 
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={transportPrice} 
                                    onChangeText={setTransportPrice} 
                                />
                            </View>
                             <View style={styles.col}>
                                <Text style={styles.label}>Est. Total (RM)</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder={totalPlaceholder}
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={totalExpenses} 
                                    onChangeText={setTotalExpenses} 
                                    onFocus={() => {
                                        if (!totalExpenses && currentSum > 0) {
                                            setTotalExpenses(currentSum.toString());
                                        }
                                    }}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Location Search</Text>
                        <View style={{ zIndex: 9999, marginBottom: 15 }}>
                            <GooglePlacesAutocomplete
                                ref={locationRef}
                                // 1. ADD THIS: Delays the API call slightly (300ms) so it doesn't freeze while typing
                                debounce={300} 
                                
                                // 2. ADD THIS: Improves text input responsiveness
                                textInputProps={{
                                    onChangeText: (text) => { console.log(text); }, // Optional: for debugging
                                    autoCorrect: false, // Disabling auto-correct speeds up typing
                                }}
                                placeholder="Search Entertainment Location..."
                                fetchDetails={true}
                                onPress={(data, details = null) => {
                                    setLocation(data.description);
                                    
                                    if (details?.url) {
                                        setLocationUrl(details.url);
                                    } else if (details?.geometry?.location) {
                                        const { lat, lng } = details.geometry.location;
                                        // [FIXED] Correct URL string interpolation with ${}
                                        const generatedUrl = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;
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

                        <Text style={styles.label}>Description</Text>
                        <TextInput 
                            style={[styles.inputField, styles.multilineInput]} 
                            placeholder="Detailed description of the package..."
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
    
    multilineInput: {
        height: 100, textAlignVertical: 'top', paddingTop: 10,
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