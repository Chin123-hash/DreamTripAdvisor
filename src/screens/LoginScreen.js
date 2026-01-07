import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loginUser } from '../services/AuthService';
// 1. Import the hook
import { useLanguage } from '../context/LanguageContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2. Get the translation function
  const { t } = useLanguage(); 

  const handleLogin = async () => {
    // Basic Validation
    if (!email || !password) {
      // Note: You can also wrap Alert strings with t() if you add them to your dictionary
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    setLoading(true); 

    try {
      const result = await loginUser(email, password);
  
      if (result.role === 'admin') {
         router.replace('/admin-main');
      } else if (result.role === 'agency' && result.status === 'approved') {
        router.replace('/agency-main'); 
      } else if (result.role === 'agency' && result.status === 'pending' ) { 
        Alert.alert("Welcome Agency", "Please Wait for Your Account Application be Approved"); 
      } else if (result.role === 'agency' && result.status === 'rejected' ) { 
        Alert.alert("Sorry Agency", "Your Account Application have been Rejected");
      } else if (result.role === 'traveller'){
        router.replace('/customer-main'); 
      }
    } catch (error) {
      let errorMessage = "Something went wrong. Please try again.";

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
           errorMessage = "This email is not registered.\nPlease check your email or Sign Up.";
           break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
           errorMessage = "Wrong password.\nPlease try again.";
           break;
        case 'auth/too-many-requests':
           errorMessage = "Too many failed attempts.\nPlease try again later.";
           break;
        default:
           errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        
        {/* TOP APP BAR (Tab Switcher) */}
        <View style={styles.tabContainer}>
          <View style={styles.activeTabBorder}>
            {/* Translated: "Log in" */}
            <Text style={styles.activeTabText}>{t('login')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.inactiveTab} 
            onPress={() => router.push('/register')}
          >
            {/* Translated: "Sign up" */}
            <Text style={styles.inactiveTabText}>{t('signup')}</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          {/* Translated: "Welcome Back" */}
          <Text style={styles.title}>{t('welcome')}</Text>
          {/* Translated: "Sign in to continue..." */}
          <Text style={styles.subtitle}>{t('welcomeSub')}</Text>
        </View>

        {/* INPUT SECTION */}
        <View style={styles.inputContainer}>
          {/* Translated: "Your Email" */}
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your email" // You can add {t('enterEmail')} here if you add it to dictionary
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Translated: "Password" */}
          <Text style={styles.label}>{t('password')}</Text>
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput} 
              placeholder="Enter your password" // You can add {t('enterPassword')} here
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
          
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            {/* Translated: "Forgot password?" */}
            <Text style={styles.forgotPassword}>{t('forgotPass')}</Text>
          </TouchableOpacity>
        </View>

        {/* BUTTON SECTION */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading} 
        >
          <Text style={styles.loginButtonText}>
            {/* Translated Button Text */}
            {loading ? "Checking..." : t('loginBtn')}
          </Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
          {/* Translated: "Don't have an account?" */}
          <Text style={styles.footerText}>{t('noAccount')} </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            {/* Translated: "Sign up" */}
            <Text style={styles.signupText}>{t('signup')}</Text>
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
  keyboardView: {
    flex: 1,
    paddingHorizontal: 27,
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  
  // === TOP TAB BAR STYLES ===
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activeTabBorder: {
    borderBottomWidth: 3,
    borderBottomColor: '#648DDB',
    paddingBottom: 10,
    marginRight: 30,
    width: 80,
    alignItems: 'center',
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#648DDB',
  },
  inactiveTab: {
    paddingBottom: 10,
    width: 80,
    alignItems: 'center',
  },
  inactiveTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BDBDBD',
  },

  // === WELCOME HEADER STYLES ===
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },

  // === INPUT STYLES ===
  inputContainer: {
    marginBottom: 24,
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
    marginBottom: 20,
  },
  
  // NEW STYLES FOR PASSWORD TOGGLE
  passwordContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    paddingRight: 16,
  },
  passwordInput: {
    flex: 1, 
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    color: '#648DDB', 
    fontWeight: '600',
  },

  // === BUTTON STYLES ===
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#648DDB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#648DDB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // === FOOTER STYLES ===
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  signupText: {
    color: '#648DDB',
    fontWeight: 'bold',
    fontSize: 14,
  },
  adminLink: {
    alignItems: 'center',
  },
  adminText: {
    color: '#648DDB',
    fontWeight: '600',
  }
});