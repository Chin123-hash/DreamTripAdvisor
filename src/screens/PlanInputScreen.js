import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
// Import Firebase functions (We will define these in AuthService next)
import { addPlan, fetchEntertainmentList, fetchFoodList } from '../services/AuthService';

export default function PlanInputScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // --- Data Lists for Dropdowns ---
    const [foodOptions, setFoodOptions] = useState([]);
    const [entOptions, setEntOptions] = useState([]);

    // --- State Variables ---
    const [planName, setPlanName] = useState('');
    const [tripPeriod, setTripPeriod] = useState(null);
    const [suggestedPax, setSuggestedPax] = useState('');
    const [selectedFood, setSelectedFood] = useState(null);
    const [selectedEnt, setSelectedEnt] = useState(null);
    const [estimatedCost, setEstimatedCost] = useState('');
    const [imageUri, setImageUri] = useState(null);

    // --- Load Dropdown Data on Mount ---
    useEffect(() => {
        loadDropdownData();
    }, []);

    const loadDropdownData = async () => {
        try {
            const foods = await fetchFoodList(); // Should return [{label: 'Nasi Lemak', value: 'id1'}]
            const ents = await fetchEntertainmentList();
            setFoodOptions(foods);
            setEntOptions(ents);
        } catch (error) {
            console.error("Error loading dropdowns:", error);
        } finally {
            setFetchingData(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!planName || !tripPeriod || !selectedFood || !selectedEnt) {
            Alert.alert("Missing Info", "Please fill in all required fields.");
            return;
        }

        setLoading(true);
        try {
            const planData = {
                planName,
                tripPeriod,
                suggestedPax,
                foodId: selectedFood,
                entertainmentId: selectedEnt,
                estimatedCost,
            };
            await addPlan(planData, imageUri);
            Alert.alert("Success", "Trip Plan Created!");
            router.back();
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text>Loading options...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Text style={styles.headerTitle}>Plan Your Trip</Text>

                    {/* Image Upload */}
                    <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                        ) : (
                            <View style={styles.placeholderContainer}>
                                <Ionicons name="camera-outline" size={40} color="#007AFF" />
                                <Text style={styles.uploadText}>Add Cover Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Plan Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Plan Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Weekend Getaway"
                            value={planName}
                            onChangeText={setPlanName}
                        />
                    </View>

                    {/* Trip Period Dropdown */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Trip Period</Text>
                        <RNPickerSelect
                            onValueChange={(value) => setTripPeriod(value)}
                            items={[
                                { label: '2 Days 1 Night', value: '2D1N' },
                                { label: '3 Days 2 Nights', value: '3D2N' },
                                { label: '4 Days 3 Nights', value: '4D3N' },
                            ]}
                            style={pickerSelectStyles}
                            placeholder={{ label: "Select duration...", value: null }}
                        />
                    </View>

                    {/* Suggested Pax */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Suggested Pax</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2-4 people"
                            value={suggestedPax}
                            onChangeText={setSuggestedPax}
                        />
                    </View>

                    {/* Entertainment Dropdown (From Firebase) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Suggested Entertainment</Text>
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedEnt(value)}
                            items={entOptions}
                            style={pickerSelectStyles}
                            placeholder={{ label: "Select entertainment...", value: null }}
                        />
                    </View>

                    {/* Food Dropdown (From Firebase) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Suggested Food</Text>
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedFood(value)}
                            items={foodOptions}
                            style={pickerSelectStyles}
                            placeholder={{ label: "Select a food spot...", value: null }}
                        />
                    </View>

                    {/* Estimated Cost */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estimated Cost (RM)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 500"
                            keyboardType="numeric"
                            value={estimatedCost}
                            onChangeText={setEstimatedCost}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Plan</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 24 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A1A1A' },
    imageUploadContainer: {
        width: '100%', height: 180, backgroundColor: '#F0F7FF', borderRadius: 12,
        borderWidth: 1, borderColor: '#CCE3FD', borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden'
    },
    uploadedImage: { width: '100%', height: '100%' },
    placeholderContainer: { alignItems: 'center' },
    uploadText: { marginTop: 8, color: '#007AFF', fontWeight: '500' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 5 },
    input: {
        backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E1E1E1',
        borderRadius: 8, padding: 12, fontSize: 16
    },
    button: {
        backgroundColor: '#007AFF', padding: 16, borderRadius: 12,
        alignItems: 'center', marginTop: 20
    },
    buttonDisabled: { backgroundColor: '#B0C4DE' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16, paddingVertical: 12, paddingHorizontal: 10,
        borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 8,
        color: 'black', paddingRight: 30, backgroundColor: '#F9F9F9',
    },
    inputAndroid: {
        fontSize: 16, paddingHorizontal: 10, paddingVertical: 8,
        borderWidth: 1, borderColor: '#E1E1E1', borderRadius: 8,
        color: 'black', paddingRight: 30, backgroundColor: '#F9F9F9',
    },
});