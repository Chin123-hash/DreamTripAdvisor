import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router'; // Make sure Stack is imported from expo-router
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

// Import services
import { getCurrentUserData, updateUserProfile } from '../services/AuthService'; //

export default function ProfileScreen() {
    const router = useRouter();

    // --- STATE MANAGEMENT ---
    const [isEditing, setIsEditing] = useState(false); // Default: View Mode (False)
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data State
    const [uid, setUid] = useState(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [profileImage, setProfileImage] = useState(null); 
    const [newImageUri, setNewImageUri] = useState(null);   

    // --- 1. FETCH USER DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const user = await getCurrentUserData();
                if (user) {
                    setUid(user.uid);
                    setFullName(user.fullName || user.agencyName || '');
                    setPhone(user.phone || '');
                    setEmail(user.email || 'No Email');
                    setRole(user.role || 'Traveller');
                    setProfileImage(user.profileImage || user.logoUrl || null);
                }
            } catch (error) {
                console.error("Profile Load Error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- 2. IMAGE PICKER (Edit Mode Only) ---
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Allow access to photos to change your profile picture.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    // --- 3. SAVE ACTION ---
    const handleSave = async () => {
        if (!fullName.trim() || !phone.trim()) {
            Alert.alert("Required", "Please enter your Name and Phone.");
            return;
        }

        setSaving(true);
        try {
            await updateUserProfile(
                uid,
                { fullName, phone },
                newImageUri 
            );
            Alert.alert("Success", "Profile updated!");
            
            // Update local state to show new image in View Mode
            if (newImageUri) {
                setProfileImage(newImageUri);
                setNewImageUri(null);
            }
            
            setIsEditing(false); // Switch back to View Mode
        } catch (error) {
            Alert.alert("Error", "Could not update profile.");
        } finally {
            setSaving(false);
        }
    };

    // --- 4. CANCEL ACTION ---
    const handleCancel = () => {
        setNewImageUri(null); // Discard unsaved image
        setIsEditing(false);  // Return to view mode
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#648DDB" />
            </View>
        );
    }

    // Determine Image Source
    const displayImage = newImageUri 
        ? { uri: newImageUri } 
        : profileImage 
            ? { uri: profileImage } 
            : { uri: 'https://via.placeholder.com/150' };

    return (
        // Edges: we remove 'top' padding because the native header handles it
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.container}>
            
            {/* FORCE NATIVE HEADER & BACK BUTTON */}
            <Stack.Screen 
                options={{
                    headerShown: true,             // 1. Force header to show
                    headerBackVisible: true,       // 2. Force back button to be visible
                    headerTitle: isEditing ? "Edit Profile" : "My Profile",
                    headerTintColor: '#333',       // 3. Color of the back arrow
                    headerStyle: { backgroundColor: '#FFF' },
                    headerShadowVisible: false,    // Clean look without shadow line
                }} 
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* ================= VIEW MODE ================= */}
                    {!isEditing && (
                        <View style={styles.viewContainer}>
                            {/* Avatar */}
                            <View style={styles.avatarContainer}>
                                <Image source={displayImage} style={styles.avatarLarge} />
                            </View>

                            {/* Name & Role */}
                            <Text style={styles.viewName}>{fullName || "Traveller"}</Text>
                            <Text style={styles.viewRole}>{role.toUpperCase()}</Text>

                            {/* Info Card */}
                            <View style={styles.detailsCard}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="mail-outline" size={20} color="#648DDB" />
                                    <View style={styles.detailTextContainer}>
                                        <Text style={styles.detailLabel}>Email</Text>
                                        <Text style={styles.detailValue}>{email}</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.detailRow}>
                                    <Ionicons name="call-outline" size={20} color="#648DDB" />
                                    <View style={styles.detailTextContainer}>
                                        <Text style={styles.detailLabel}>Phone</Text>
                                        <Text style={styles.detailValue}>{phone || "Not set"}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Go to Edit Mode Button */}
                            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                                <Text style={styles.editButtonText}>Edit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ================= EDIT MODE ================= */}
                    {isEditing && (
                        <View style={styles.formContainer}>
                            
                            {/* Editable Avatar */}
                            <View style={styles.avatarContainer}>
                                <TouchableOpacity onPress={pickImage}>
                                    <Image source={displayImage} style={styles.avatarLarge} />
                                    <View style={styles.cameraBadge}>
                                        <Ionicons name="camera" size={18} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.changePhotoText}>Tap to change</Text>
                            </View>

                            {/* Input Fields */}
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="e.g. John Doe"
                            />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g. 0123456789"
                                keyboardType="phone-pad"
                            />

                            {/* Read-Only Fields */}
                            <Text style={styles.label}>Email (Read-only)</Text>
                            <View style={[styles.input, styles.readOnlyInput]}>
                                <Text style={{color: '#999'}}>{email}</Text>
                                <Ionicons name="lock-closed" size={16} color="#CCC" />
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity 
                                    style={styles.cancelButton} 
                                    onPress={handleCancel}
                                    disabled={saving}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.saveButton} 
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 24, paddingBottom: 50 },

    // --- SHARED ---
    avatarContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
    avatarLarge: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#F2F2F2',
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5,
    },

    // --- VIEW MODE STYLES ---
    viewContainer: { alignItems: 'center', width: '100%' },
    viewName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    viewRole: { fontSize: 14, color: '#648DDB', fontWeight: '600', letterSpacing: 1, marginBottom: 30 },
    
    detailsCard: {
        width: '100%',
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F0F0F0'
    },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    detailTextContainer: { marginLeft: 15 },
    detailLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
    detailValue: { fontSize: 16, color: '#333', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },

    editButton: {
        width: '100%',
        height: 52,
        backgroundColor: '#648DDB',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#648DDB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6
    },
    editButtonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },

    // --- EDIT MODE STYLES ---
    formContainer: { width: '100%' },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#648DDB', width: 34, height: 34, borderRadius: 17,
        justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF'
    },
    changePhotoText: { marginTop: 10, color: '#648DDB', fontSize: 14, fontWeight: '600', textAlign:'center' },
    
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginLeft: 4 },
    input: {
        width: '100%', height: 50,
        borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12,
        paddingHorizontal: 16, fontSize: 16, color: '#333', backgroundColor: '#FAFAFA',
        marginBottom: 20
    },
    readOnlyInput: { backgroundColor: '#F5F5F5', borderColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    cancelButton: {
        flex: 1, height: 52, marginRight: 10,
        backgroundColor: '#F5F5F5', borderRadius: 14,
        justifyContent: 'center', alignItems: 'center'
    },
    cancelButtonText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
    saveButton: {
        flex: 2, height: 52,
        backgroundColor: '#648DDB', borderRadius: 14,
        justifyContent: 'center', alignItems: 'center'
    },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});