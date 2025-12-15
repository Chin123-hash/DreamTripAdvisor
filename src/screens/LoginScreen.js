import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        
        {/* 1. TOP APP BAR (Tab Switcher) */}
        <View style={styles.tabContainer}>
          {/* Active Tab (Log In) */}
          <View style={styles.activeTabBorder}>
            <Text style={styles.activeTabText}>Log in</Text>
          </View>
          
          {/* Inactive Tab (Sign Up) - clickable to go to register */}
          <TouchableOpacity 
            style={styles.inactiveTab} 
            onPress={() => router.push('/register')}
          >
            <Text style={styles.inactiveTabText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* 2. HEADER SECTION (Restored Welcome Text) */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your Dream Trip</Text>
        </View>

        {/* 3. INPUT SECTION */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>User Name</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true} 
          />
          
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* 4. BUTTON SECTION */}
        <TouchableOpacity style={styles.loginButton} onPress={() => alert('Login Pressed')}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        {/* 5. FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.adminLink}>
           <Text style={styles.adminText}>Sign in as Admin</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 27, // Matches your Figma 'left: 27px'
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  
  // === TOP TAB BAR STYLES ===
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0', // Very light line across whole width
  },
  activeTabBorder: {
    borderBottomWidth: 3,       // The Blue Line
    borderBottomColor: '#648DDB', // Your Blue
    paddingBottom: 10,
    marginRight: 30,
    width: 80,                  // Fixed width for the line
    alignItems: 'center',
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#648DDB',           // Blue text
  },
  inactiveTab: {
    paddingBottom: 10,
    width: 80,
    alignItems: 'center',
  },
  inactiveTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BDBDBD',           // Gray text
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
    borderColor: '#E1E1E1', // Figma Gray Border
    borderRadius: 12,       // Figma Radius
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
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
    backgroundColor: '#648DDB', // Figma Blue Button
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: "#648DDB",    // Adds a nice glow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,              // Required for Android shadow
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