import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

import { registerTraveller } from '../services/AuthService';
// IMPORT LANGUAGE HOOK
import { useLanguage } from '../context/LanguageContext';

export default function RegisterScreen() {
  // USE HOOK
  const { t } = useLanguage();

  // 1. Form State
  const [role, setRole] = useState('traveller'); 
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  // Date Picker State
  const [date, setDate] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false); 

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios'); 
    setDate(currentDate);
    
    // Format the date to DD/MM/YYYY
    let tempDate = new Date(currentDate);
    let fDate = tempDate.getDate() + '/' + (tempDate.getMonth() + 1) + '/' + tempDate.getFullYear();
    setDob(fDate);
    
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
  };

  // 2. Handle Button Logic
  const phoneDigits = phone.replace(/\D/g, '');
  const malaysiaPhoneRegex = /^(011\d{8}|01[02-9]\d{7})$/;
  const isPhoneValid = malaysiaPhoneRegex.test(phoneDigits);

  const isFormValid =
    fullName.trim() &&
    username.trim() &&
    email.trim() &&
    password.trim() &&
    dob.trim() &&
    phone.trim() &&
    isPhoneValid;

  const handlePress = async () => {
    // Require all fields before proceeding
    if (
      !fullName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !dob.trim() ||
      !phone.trim()
    ) {
      alert(t('alertFillFields'));
      return;
    }
    if (password.length < 6) {
      alert(t('alertPassShort'));
      return; 
    }
    
    if (!isPhoneValid) {
      alert(t('alertPhoneInvalid'));
      return;
    }

    if (role === 'agency') {
      // A. If Agency, pass data to Next Page (Do not save yet)
      router.push({
        pathname: '/agency-details',
        params: { email: email.trim(), password: password } 
      });
    } else {
      // B. If Traveller, Save to Database NOW
      try {
        await registerTraveller(email.trim(), password, {
          fullName: fullName.trim(),
          username: username.trim(),
          phone: phone.trim(),
          dob: dob.trim()
        });
        alert(t('alertAccountCreated'));
        router.replace('/');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* TOP TABS (Log in / Sign up) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={styles.inactiveTab} 
              onPress={() => router.push('/')} 
            >
              <Text style={styles.inactiveTabText}>{t('login')}</Text>
            </TouchableOpacity>

            <View style={styles.activeTabBorder}>
              <Text style={styles.activeTabText}>{t('signup')}</Text>
            </View>
          </View>

          {/* FORM INPUTS */}
          
          <Text style={styles.label}>{t('fullName')}</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder={t('placeholderName')} 
            value={fullName} 
            onChangeText={setFullName} 
          />

          <Text style={styles.label}>{t('username')}</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder={t('placeholderUsername')} 
            value={username} 
            onChangeText={setUsername} 
          />

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder={t('placeholderEmail')} 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t('password')}</Text>
          
          {/* ENHANCED PASSWORD FIELD WITH ICON */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity 
              onPress={() => setPasswordVisible(!isPasswordVisible)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} 
                size={24} 
                color="#BDBDBD" 
              />
            </TouchableOpacity>
          </View>

        <Text style={styles.label}>{t('dob')}</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateContainer}>
        {/* Pointer events none makes the TextInput clickable via the parent TouchableOpacity */}
        <View pointerEvents="none">
            <TextInput 
            style={[styles.inputField, {marginBottom: 0}]} 
            placeholder={t('placeholderDob')} 
            value={dob} 
            editable={false} 
            />
        </View>
        <Ionicons name="calendar-outline" size={24} color="#BDBDBD" style={styles.calendarIcon} />
        </TouchableOpacity>

        {/* The Actual Calendar Component */}
        {showPicker && (
        <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChangeDate}
        />
        )}

          <Text style={styles.label}>{t('phone')}</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder={t('placeholderPhone')} 
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad"
          />

          {/* ROLE SELECTION (Radio Buttons) */}
          <Text style={styles.questionLabel}>{t('roleQuestion')}</Text>
          
          <View style={styles.radioGroup}>
            {/* Option 1: Traveller */}
            <TouchableOpacity style={styles.radioRow} onPress={() => setRole('traveller')}>
              <View style={[styles.radioOuter, role === 'traveller' && styles.radioSelected]}>
                {role === 'traveller' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>{t('traveller')}</Text>
            </TouchableOpacity>

            {/* Option 2: Travel Agency */}
            <TouchableOpacity style={styles.radioRow} onPress={() => setRole('agency')}>
              <View style={[styles.radioOuter, role === 'agency' && styles.radioSelected]}>
                {role === 'agency' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>{t('agency')}</Text>
            </TouchableOpacity>
          </View>

          {/* DYNAMIC BUTTON */}
          <TouchableOpacity
            style={[styles.mainButton, !isFormValid && styles.mainButtonDisabled]}
            onPress={handlePress}
            disabled={!isFormValid}
          >
            <Text style={styles.mainButtonText}>
              {role === 'agency' ? t('continue') : t('signup')}
            </Text>
          </TouchableOpacity>

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
    paddingBottom: 50, 
  },
  
  // === TAB BAR ===
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activeTabBorder: {
    borderBottomWidth: 3,
    borderBottomColor: '#648DDB',
    paddingBottom: 10,
    width: 100,
    alignItems: 'center',
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#648DDB',
  },
  inactiveTab: {
    paddingBottom: 10,
    width: 100,
    alignItems: 'center',
  },
  inactiveTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BDBDBD',
  },

  // === FORM LABELS & INPUTS ===
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
    marginBottom: 16,
  },
  
  // === PASSWORD TOGGLE STYLES ===
  passwordContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingRight: 16,
  },
  passwordInput: {
    flex: 1, 
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  
  // === CALENDAR SPECIFIC ===
  dateContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  calendarIcon: {
    position: 'absolute',
    right: 16,
    top: 13, 
  },

  // === RADIO BUTTONS ===
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 15,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#648DDB', 
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#648DDB', 
  },
  radioText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
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
  },
  footerText: {
    color: '#888',
  },
  linkText: {
    color: '#648DDB',
    fontWeight: 'bold',
  },
});