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
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUserData, updateUserProfile } from '../services/AuthService';

export default function ProfileScreen() {
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [uid, setUid] = useState(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Read-only
    const [role, setRole] = useState(''); // Read-only
    const [profileImage, setProfileImage] = useState(null); // The URL or URI
    const [newImageUri, setNewImageUri] = useState(null); // Temporary URI if user picks new photo

    // 1. Fetch User Data on Load
    useEffect(() => {
        const loadData = async () => {
            const user = await getCurrentUserData();
            if (user) {
                setUid(user.uid);
                setFullName(user.fullName || '');
                setPhone(user.phone || '');
                setEmail(user.email || '');
                setRole(user.role || 'User');
                setProfileImage(user.profileImage || null);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    // 2. Handle Image Picker
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri); // Temporarily show this new image
        }
    };

    // 3. Save Changes
    const handleSave = async () => {
        if (!fullName.trim() || !phone.trim()) {
            Alert.alert("Missing Info", "Please fill in your Name and Phone.");
            return;
        }

        setSaving(true);
        try {
            await updateUserProfile(
                uid, 
                { fullName, phone }, 
                newImageUri // Pass the new image URI if one exists
            );
            Alert.alert("Success", "Profile updated successfully!");
            router.back(); // Go back to main page
        } catch (error) {
            Alert.alert("Error", "Could not update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A8AE4" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={{flex: 1}}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <View style={{width: 24}} /> 
                    </View>

                    {/* Profile Picture Section */}
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={pickImage}>
                            <Image 
                                source={{ uri: newImageUri || profileImage || 'https://via.placeholder.com/150' }} 
                                style={styles.avatar} 
                            />
                            <View style={styles.editIconBadge}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.changePhotoText}>Tap to change photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput 
                            style={styles.input} 
                            value={fullName} 
                            onChangeText={setFullName}
                            placeholder="Your Name"
                        />

                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput 
                            style={styles.input} 
                            value={phone} 
                            onChangeText={setPhone}
                            placeholder="0123456789"
                            keyboardType="phone-pad"
                        />

                        {/* Read Only Fields */}
                        <Text style={styles.label}>Email Address</Text>
                        <View style={[styles.input, styles.readOnlyInput]}>
                            <Text style={styles.readOnlyText}>{email}</Text>
                            <Ionicons name="lock-closed-outline" size={16} color="#999" />
                        </View>

                        <Text style={styles.label}>Account Role</Text>
                        <View style={[styles.input, styles.readOnlyInput]}>
                            <Text style={styles.readOnlyText}>{role.toUpperCase()}</Text>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.saveButton} 
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    // Avatar Styles
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#F0F0F0',
        backgroundColor: '#EEE',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#5A8AE4',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    changePhotoText: {
        marginTop: 10,
        color: '#5A8AE4',
        fontSize: 14,
        fontWeight: '600',
    },
    // Form Styles
    formContainer: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '600',
        marginLeft: 4,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
        backgroundColor: '#FAFAFA',
    },
    readOnlyInput: {
        backgroundColor: '#F5F5F5',
        borderColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    readOnlyText: {
        color: '#999',
    },
    // Footer
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFF',
    },
    saveButton: {
        backgroundColor: '#5A8AE4',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#5A8AE4",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});