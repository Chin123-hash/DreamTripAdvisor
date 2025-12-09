import { Ionicons } from '@expo/vector-icons'; // Built-in icons for the Calendar
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView // We need this because the form is long!
    ,


    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
export default function RegisterScreen() {
  // 1. Form State
  const [role, setRole] = useState('traveller'); // Default to Traveller
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
// Add these new states
const [date, setDate] = useState(new Date()); // The actual date object
const [showPicker, setShowPicker] = useState(false); // Controls if calendar is visible

// Add this function to handle the selection
const onChangeDate = (event, selectedDate) => {
  const currentDate = selectedDate || date;
  setShowPicker(Platform.OS === 'ios'); // On iOS keep it open, on Android close it
  setDate(currentDate);
  
  // Format the date to DD/MM/YYYY for the text box
  let tempDate = new Date(currentDate);
  let fDate = tempDate.getDate() + '/' + (tempDate.getMonth() + 1) + '/' + tempDate.getFullYear();
  setDob(fDate);
  
  if (Platform.OS === 'android') {
    setShowPicker(false);
  }
};
  // 2. Handle Button Logic
  const handlePress = () => {
    if (role === 'agency') {
      alert("Navigate to Agency Details Page");
      // Later: router.push('/agency-details');
    } else {
      alert("Creating Customer Account...");
      // Later: Call Firebase Register function
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
              onPress={() => router.push('/')} // Go back to Login
            >
              <Text style={styles.inactiveTabText}>Log in</Text>
            </TouchableOpacity>

            <View style={styles.activeTabBorder}>
              <Text style={styles.activeTabText}>Sign up</Text>
            </View>
          </View>

          {/* FORM INPUTS */}
          
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.inputField} placeholder="e.g. Shane Lee" value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>User Name</Text>
          <TextInput style={styles.inputField} placeholder="e.g. XXXX" value={username} onChangeText={setUsername} />

          <Text style={styles.label}>Your Email</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder="contact@dscodetech.com" 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder="••••••••••••" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={true} 
          />

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateContainer}>
        {/* We make the TextInput "pointerEvents='none'" so clicking it opens the calendar instead of the keyboard */}
        <View pointerEvents="none">
            <TextInput 
            style={[styles.inputField, {marginBottom: 0}]} 
            placeholder="DD/MM/YYYY" 
            value={dob} 
            editable={false} // User cannot type manually, must use calendar
            />
        </View>
        <Ionicons name="calendar-outline" size={24} color="#BDBDBD" style={styles.calendarIcon} />
        </TouchableOpacity>

        {/* The Actual Calendar Component (Hidden until clicked) */}
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

          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.inputField} 
            placeholder="019-3140197" 
            value={phone} 
            onChangeText={setPhone} 
            keyboardType="phone-pad"
          />

          {/* ROLE SELECTION (Radio Buttons) */}
          <Text style={styles.questionLabel}>Are you a traveller/ travel agency?</Text>
          
          <View style={styles.radioGroup}>
            {/* Option 1: Traveller */}
            <TouchableOpacity style={styles.radioRow} onPress={() => setRole('traveller')}>
              <View style={[styles.radioOuter, role === 'traveller' && styles.radioSelected]}>
                {role === 'traveller' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Traveller</Text>
            </TouchableOpacity>

            {/* Option 2: Travel Agency */}
            <TouchableOpacity style={styles.radioRow} onPress={() => setRole('agency')}>
              <View style={[styles.radioOuter, role === 'agency' && styles.radioSelected]}>
                {role === 'agency' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioText}>Travel Agency</Text>
            </TouchableOpacity>
          </View>

          {/* DYNAMIC BUTTON */}
          <TouchableOpacity style={styles.mainButton} onPress={handlePress}>
            <Text style={styles.mainButtonText}>
              {role === 'agency' ? 'Continue' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

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
    paddingBottom: 50, // Extra padding at bottom for scrolling
  },
  
  // === TAB BAR (Reused) ===
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    //justifyContent: 'center', // Center the tabs
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
    height: 50, // Slightly shorter than login to fit everything
    borderWidth: 1.5,
    borderColor: '#E1E1E1',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    marginBottom: 16,
  },
  
  // === CALENDAR SPECIFIC ===
  dateContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  calendarIcon: {
    position: 'absolute',
    right: 16,
    top: 13, // Center it vertically
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
    borderColor: '#648DDB', // Blue border when selected
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#648DDB', // Blue dot
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