import { Ionicons } from '@expo/vector-icons'; // For the upload arrow
import * as ImagePicker from 'expo-image-picker'; // The library we just installed
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Image // Needed to show the selected photo
  ,






  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerAgency } from '../services/AuthService';
export default function AgencyDetailsScreen() {
  const { email, password } = useLocalSearchParams();
  const [agencyName, setAgencyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState(''); // Changed from address to URL
  const [licenseNo, setLicenseNo] = useState('');
  const [logo, setLogo] = useState(null); // Stores the uploaded image URI

  const isFormValid =
    agencyName.trim() &&
    companyUrl.trim() &&
    licenseNo.trim() &&
    logo;

  // --- FUNCTION: Pick Image from Gallery ---
  // --- FUNCTION: Pick Image (JPG/PNG Only) ---
  const pickImage = async () => {
    // 1. Request Permission & Open Gallery
    let result = await ImagePicker.launchImageLibraryAsync({
      // Use MediaTypeOptions for current Expo version; MediaType not available here
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    // 2. Check if user canceled
    if (result.canceled) {
      return;
    }

    // 3. VALIDATION: Check file extension
    const asset = result.assets[0];
    const uri = asset.uri.toLowerCase();

    // Check if the file ends with .jpg, .jpeg, or .png
    if (uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png')) {
      setLogo(asset.uri); // Success! Save it.
    } else {
      // Failure! Show error.
      alert('Invalid File Type.\nPlease upload a JPG or PNG image only.');
      setLogo(null);
    }
  };

  const handleRegister = async () => {
    // --- STEP 1: Basic Empty Check ---
    if (!agencyName.trim() || !companyUrl.trim() || !licenseNo.trim() || !logo) {
      alert("Please fill in all fields and upload a logo.");
      return; // Stop the function here
    }

    // --- STEP 2: SSM License Validation (12 Digits) ---
    // The Regex /^\d{12}$/ means:
    // ^ = Start of line
    // \d = Digit (0-9)
    // {12} = Exactly 12 times
    // $ = End of line
    const ssmRegex = /^\d{12}$/;
    if (!ssmRegex.test(licenseNo)) {
      alert("Invalid SSM License Number.\nPlease enter the 12-digit format (e.g., 202301000001) without dashes.");
      return; // Stop! Do not send to database.
    }
    // --- STEP 3: URL Validation (Optional but good) ---
    if (!companyUrl.includes('.') || companyUrl.length < 5) {
      alert("Please enter a valid Company URL.");
      return;
    }
    // --- STEP 4: Success! ---
    console.log("Validation Passed!", { agencyName, companyUrl, licenseNo });
    // TODO: Here is where you call the Firebase Function later
    alert("Registration Successful!");
    try {
      await registerAgency(
        email, 
        password, 
        { agencyName, licenseNo, companyUrl }, 
        logo // The image URI
      );
      alert("Agency Registration Complete!");
      router.replace('/');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* TOP TABS (Visual only to match design consistency) */}
          <View style={styles.tabContainer}>
            <Text style={styles.headerTitle}>Sign up</Text>
            <View style={styles.blueUnderline} />
          </View>

          <View style={styles.formContainer}>
            
            <Text style={styles.label}>Agency Name</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder="XXXX" 
              value={agencyName} 
              onChangeText={setAgencyName} 
            />

            <Text style={styles.label}>Company URL</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder="e.g. www.dreamtravel.com" 
              value={companyUrl} 
              onChangeText={setCompanyUrl} 
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.label}>SSM License Number</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder="202301000001" 
              value={licenseNo} 
              onChangeText={setLicenseNo}
              keyboardType="numeric"    // <--- Added this to show number pad
              maxLength={12}            // <--- Added this to stop them at 12 digits 
            />

            {/* --- UPLOAD SECTION --- */}
            <Text style={styles.label}>Company Logo</Text>
            
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {logo ? (
                // If image selected, show it
                <Image source={{ uri: logo }} style={styles.uploadedImage} />
              ) : (
                // If no image, show the Upload Icon (Arrow Up)
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#648DDB" />
                </View>
              )}
            </TouchableOpacity>

          </View>

          {/* SIGN UP BUTTON */}
          <TouchableOpacity
            style={[styles.mainButton, !isFormValid && styles.mainButtonDisabled]}
            onPress={handleRegister}
            disabled={!isFormValid}
          >
            <Text style={styles.mainButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 27,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // === HEADER ===
  tabContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#648DDB',
    marginBottom: 5,
  },
  blueUnderline: {
    width: 60,
    height: 3,
    backgroundColor: '#648DDB',
  },

  // === FORM ===
  formContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  inputField: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E1E1E1', // Gray border like Figma
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    marginBottom: 20,
  },

  // === UPLOAD BOX ===
  uploadBox: {
    width: '100%',
    height: 120, // Tall box like in the screenshot
    borderWidth: 1.5,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover', // Fills the box
  },

  // === BUTTON ===
  mainButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#648DDB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: "#648DDB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  mainButtonDisabled: {
    opacity: 0.5,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // === FOOTER ===
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#888',
  },
  linkText: {
    color: '#648DDB',
    fontWeight: 'bold',
  },
});