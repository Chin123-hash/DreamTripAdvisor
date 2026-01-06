import { Ionicons } from '@expo/vector-icons'; // Added for the Eye Icon
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert, // Added Alert for better popups
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 1. New State for UI enhancements
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Basic Validation
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    setLoading(true); // Start loading spinner/text

    try {
      // 1. Call the service
      const result = await loginUser(email, password);
  
      // 2. Check Role & Navigate
      if (result.role === 'admin') {
         router.replace('/admin-main');
        
      } else if (result.role === 'agency' && result.status === 'approved') {
        router.replace('/agency-main'); }

        else if (result.role === 'agency' && result.status === 'pending' ) { 
        Alert.alert("Welcome Agency", "Please Wait for Your Account Application be Approved"); }

        else if (result.role === 'agency' && result.status === 'rejected' ) { 
        Alert.alert("Sorry Agency", "Your Account Application have been Rejected");
      } else if (result.role === 'traveller'){
        router.replace('/customer-main'); // Traveller
        //Alert.alert("Welcome Traveller", "Login Successful!");
      }
    } catch (error) {
      
      // 3. Friendly Error Handling
      let errorMessage = "Something went wrong. Please try again.";

      // Translate Firebase technical codes to human text
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
      setLoading(false); // Stop loading regardless of success/failure
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        
        {/* 1. TOP APP BAR (Tab Switcher) */}
        <View style={styles.tabContainer}>
          <View style={styles.activeTabBorder}>
            <Text style={styles.activeTabText}>Log in</Text>
          </View>
          <TouchableOpacity 
            style={styles.inactiveTab} 
            onPress={() => router.push('/register')}
          >
            <Text style={styles.inactiveTabText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* 2. HEADER SECTION */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your Dream Trip</Text>
        </View>

        {/* 3. INPUT SECTION */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Email</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          
          {/* ENHANCED PASSWORD FIELD WITH ICON */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput} // Changed style to fit inside container
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible} // Toggles true/false
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
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* 4. BUTTON SECTION */}
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading} // Prevent double clicking
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Checking..." : "Log In"}
          </Text>
        </TouchableOpacity>

        {/* 5. FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
        
        {/* <TouchableOpacity style={styles.adminLink} onPress={() => alert("Feature coming in Sprint 5")}>
           <Text style={styles.adminText}>Sign in as Admin</Text>
        </TouchableOpacity> */}

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