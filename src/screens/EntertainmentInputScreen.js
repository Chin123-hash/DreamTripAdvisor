import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

// Import the function we just added to AuthService
import { addEntertainment } from '../services/AuthService';

export default function EntertainmentInputScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- State Variables (Matching Sprint 4 Requirements) ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState(''); // New Field
  const [suggestedTransport, setSuggestedTransport] = useState('');
  const [transportCost, setTransportCost] = useState('');
  const [estimatedTotalExpenses, setEstimatedTotalExpenses] = useState('');
  const [rating, setRating] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // --- Image Picker ---
  const pickImage = async () => {
    // No permissions request needed for Expo Go (usually), but good practice handling
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Compress for faster upload
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // --- Save Handler ---
  const handleSave = async () => {
    // 1. Basic Validation
    if (!title || !description || !ticketPrice || !suggestedTransport) {
      Alert.alert("Missing Info", "Please fill in all text fields.");
      return;
    }
    if (!imageUri) {
      Alert.alert("Missing Image", "Please upload a photo.");
      return;
    }

    setLoading(true);
    try {
      // 2. Prepare Data Object
      const entertainmentData = {
        title: title,
        description: description,
        ticketPrice: ticketPrice,
        suggestedTransport: suggestedTransport,
        transportCost: transportCost,
        estimatedTotalExpenses: estimatedTotalExpenses,
        rating: rating,
      };

      // 3. Send to Backend
      await addEntertainment(entertainmentData, imageUri);
      
      Alert.alert("Success", "Entertainment added successfully!");
      router.back(); 

    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to save data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.headerTitle}>Add Entertainment</Text>
          <Text style={styles.subHeader}>Sprint 4: Database Population</Text>

          {/* --- Image Upload Section --- */}
          <TouchableOpacity style={styles.imageUploadContainer} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera-outline" size={40} color="#666" />
                <Text style={styles.uploadText}>Tap to upload photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* --- Form Fields --- */}
          
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Entertainment Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. KL Tower"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Details about the attraction..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Ticket Price (New Field) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ticket Price</Text>
            <TextInput
              style={styles.input}
              placeholder="RM 0.00"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={ticketPrice}
              onChangeText={setTicketPrice}
            />
          </View>

          {/* Transport */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Suggested Transport</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bus / Grab / MRT"
              placeholderTextColor="#999"
              value={suggestedTransport}
              onChangeText={setSuggestedTransport}
            />
          </View>

          {/* Row: Transport Cost & Total Expenses */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Transport Cost</Text>
              <TextInput
                style={styles.input}
                placeholder="RM 0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={transportCost}
                onChangeText={setTransportCost}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Total Expenses</Text>
              <TextInput
                style={styles.input}
                placeholder="RM 0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={estimatedTotalExpenses}
                onChangeText={setEstimatedTotalExpenses}
              />
            </View>
          </View>

          {/* Rating */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rating (1.0 - 5.0)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4.5"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={rating}
              onChangeText={setRating}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Data</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles match your LoginScreen design system
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  imageUploadContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadText: {
    marginTop: 8,
    color: '#888',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    backgroundColor: '#648DDB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#648DDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});