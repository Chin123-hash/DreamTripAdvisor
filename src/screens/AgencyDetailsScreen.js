import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
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
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

export default function AgencyDetailsScreen() {
  // 🔥 1. Retrieve all the passed data here
  const { 
    email, 
    password, 
    fullName, 
    username, 
    phone, 
    dob 
  } = useLocalSearchParams();
  // 2. Destructure Hook
  const { t } = useLanguage();

  const [agencyName, setAgencyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState(''); 
  const [licenseNo, setLicenseNo] = useState('');
  const [logo, setLogo] = useState(null); 

  const isFormValid =
    agencyName.trim() &&
    companyUrl.trim() &&
    licenseNo.trim() &&
    logo;

  // --- FUNCTION: Pick Image (JPG/PNG Only) ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const uri = asset.uri.toLowerCase();

    if (uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png')) {
      setLogo(asset.uri); 
    } else {
      alert(t('alertInvalidFileType'));
      setLogo(null);
    }
  };

  const handleRegister = async () => {
    // --- STEP 1: Basic Empty Check ---
    if (!agencyName.trim() || !companyUrl.trim() || !licenseNo.trim() || !logo) {
      alert(t('alertFillFieldsLogo'));
      return; 
    }

    // --- STEP 2: SSM License Validation (12 Digits) ---
    const ssmRegex = /^\d{12}$/;
    if (!ssmRegex.test(licenseNo)) {
      alert(t('alertInvalidSSM'));
      return; 
    }
    // --- STEP 3: URL Validation ---
    if (!companyUrl.includes('.') || companyUrl.length < 5) {
      alert(t('alertInvalidURL'));
      return;
    }
    
    // --- STEP 4: Success! ---
    try {
      await registerAgency(
        email, 
        password, 
        { 
            // Agency specific data
            agencyName, 
            licenseNo, 
            companyUrl,
            // 🔥 2. Pass the data from the previous screen
            fullName,
            username,
            phone,
            dob
        }, 
        logo 
      );
      alert(t('alertAgencyRegComplete'));
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
          
          {/* TOP TABS */}
          <View style={styles.tabContainer}>
            <Text style={styles.headerTitle}>{t('signup')}</Text>
            <View style={styles.blueUnderline} />
          </View>

          <View style={styles.formContainer}>
            
            <Text style={styles.label}>{t('agencyNameLabel')}</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder={t('placeholderAgencyName')}
              value={agencyName} 
              onChangeText={setAgencyName} 
            />

            <Text style={styles.label}>{t('companyUrlLabel')}</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder={t('placeholderUrl')}
              value={companyUrl} 
              onChangeText={setCompanyUrl} 
              autoCapitalize="none"
              keyboardType="url"
            />

            <Text style={styles.label}>{t('ssmLicenseLabel')}</Text>
            <TextInput 
              style={styles.inputField} 
              placeholder="202301000001" 
              value={licenseNo} 
              onChangeText={setLicenseNo}
              keyboardType="numeric"    
              maxLength={12}            
            />

            {/* --- UPLOAD SECTION --- */}
            <Text style={styles.label}>{t('companyLogoLabel')}</Text>
            
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.uploadedImage} />
              ) : (
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
            <Text style={styles.mainButtonText}>{t('signup')}</Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('haveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={styles.linkText}>{t('login')}</Text>
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
    borderColor: '#E1E1E1', 
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    marginBottom: 20,
  },

  // === UPLOAD BOX ===
  uploadBox: {
    width: '100%',
    height: 120, 
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
    resizeMode: 'cover', 
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