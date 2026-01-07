import { router } from 'expo-router';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { app } from '../../firebaseConfig';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

export default function ForgotPasswordScreen() {
  // 2. Destructure Hook
  const { t } = useLanguage();

  // State to toggle between "Enter Email" and "Check Email" screens
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation Logic
  useEffect(() => {
    const emailRegex = /\S+@\S+\.\S+/;
    setIsValid(emailRegex.test(email));
  }, [email]);

  // Handle Send Link
  const handleReset = async () => {
    const auth = getAuth(app);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      // Instead of an alert, we switch the screen UI to "Check Email"
      setIsEmailSent(true); 
    } catch (error) {
      alert(t('errorPrefix') + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- VIEW 1: CHECK YOUR EMAIL (Success State) ---
  if (isEmailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{t('checkEmailTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('checkEmailSub1')} <Text style={{fontWeight: 'bold', color: '#000'}}>{email}</Text>
            {t('checkEmailSub2')}
          </Text>

          <View style={{ height: 50 }} /> 

          <TouchableOpacity style={styles.resendLink} onPress={handleReset}>
            <Text style={styles.linkText}>{t('resendEmail')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={() => router.back()}>
            <Text style={styles.resetButtonText}>{t('backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- VIEW 2: ENTER EMAIL (Initial State) ---
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.contentContainer}>
          
          <Text style={styles.title}>{t('forgotPassTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('forgotPassSub')}
          </Text>

          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.inputField}
            placeholder="contact@dscode.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity 
            style={[styles.resetButton, !isValid && styles.disabledButton]} 
            onPress={handleReset}
            disabled={!isValid || loading}
          >
            <Text style={styles.resetButtonText}>
              {loading ? t('sending') : t('resetPassBtn')}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 27,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
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
    height: 56,
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    marginBottom: 30,
  },
  
  // === BUTTONS ===
  resetButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#648DDB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#648DDB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#A0C4FF', // Faded blue for "Unable" state
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // === LINKS ===
  resendLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  linkText: {
    color: '#648DDB',
    fontWeight: '600',
    fontSize: 14,
  }
});