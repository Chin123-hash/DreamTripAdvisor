// src/screens/AdminMainPageScreen.js

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Service Imports
import { getCurrentUserData, logoutUser } from '../services/AuthService';

const { width } = Dimensions.get('window');

export default function AdminMainPageScreen() {
    const router = useRouter();

    // --- STATE ---
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    
    // Animation Ref for Sidebar
    const slideAnim = useRef(new Animated.Value(-width)).current;

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                setLoading(true);
                const userData = await getCurrentUserData();
                setAdminData(userData);
            } catch (error) {
                console.error("Failed to load admin data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdmin();
    }, []);

    // --- SIDEBAR ACTIONS ---
    const openSidebar = () => {
        setSidebarVisible(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeSidebar = () => {
        Animated.timing(slideAnim, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setSidebarVisible(false));
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
            closeSidebar();
            router.replace('/');
        } catch (error) {
            console.error("Logout failed");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#648DDB" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* HEADER (Matched Customer Style) */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={openSidebar}>
                        <Ionicons name="menu" size={30} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.appTitle}>Dream Trip Advisor</Text>
                    <View style={{ width: 30 }} />
                </View>

                {/* PROFILE SECTION (Matched Customer Style) */}
                <View style={styles.profileSection}>
                    <View style={styles.profileRow}>
                        <Image 
                            source={{ uri: adminData?.profileImage || 'https://via.placeholder.com/50' }} 
                            style={styles.profilePic} 
                        />
                        <View>
                            <Text style={styles.welcomeLabel}>Admin Dashboard</Text>
                            <Text style={styles.welcomeText}>
                                {adminData?.fullName ? adminData.fullName.split(' ')[0] : 'Admin'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.actionIcons}>
                        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconButton}>
                            <Ionicons name="settings-outline" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- ORIGINAL BUTTON STYLE (KEPT AS REQUESTED) --- */}
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Management</Text>

                <View style={styles.mainButtonContainer}>
                    
                    {/* USERS BUTTON */}
                    <TouchableOpacity 
                        style={[styles.bigButton, { backgroundColor: '#E3F2FD' }]} 
                        onPress={() => router.push('/admin-user-list')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#BBDEFB' }]}>
                            <Ionicons name="people-sharp" size={42} color="#1976D2" />
                        </View>
                        <View style={styles.buttonTextContainer}>
                            <Text style={styles.bigButtonText}>Users</Text>
                            <Text style={styles.subText}>Manage customer accounts</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#1976D2" />
                    </TouchableOpacity>

                    {/* TRAVEL AGENTS BUTTON */}
                    <TouchableOpacity 
                        style={[styles.bigButton, { backgroundColor: '#F3E5F5' }]} 
                        onPress={() => router.push('/manage-agency')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#E1BEE7' }]}>
                            <Ionicons name="business-sharp" size={42} color="#7B1FA2" />
                        </View>
                        <View style={styles.buttonTextContainer}>
                            <Text style={styles.bigButtonText}>Travel Agents</Text>
                            <Text style={styles.subText}>Verify agency partners</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#7B1FA2" />
                    </TouchableOpacity>

                    {/* ORDERS BUTTON */}
                    <TouchableOpacity 
                        style={[styles.bigButton, { backgroundColor: '#E8F5E9' }]} 
                        onPress={() => router.push('/admin-order-dashboard')}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#C8E6C9' }]}>
                            <Ionicons name="receipt-sharp" size={42} color="#388E3C" />
                        </View>
                        <View style={styles.buttonTextContainer}>
                            <Text style={styles.bigButtonText}>Orders</Text>
                            <Text style={styles.subText}>Orders & Sales Report</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#388E3C" />
                    </TouchableOpacity>

                </View>

                {/* SYSTEM STATS (Mini Card) */}
                <View style={styles.statsCard}>
                    <Ionicons name="server-outline" size={20} color="#666" />
                    <Text style={styles.statsText}>System Status: Online & Secured</Text>
                </View>

                <View style={{height: 40}} /> 
            </ScrollView>

            {/* SIDEBAR MODAL (Exact match to Customer Page) */}
            <Modal
                visible={isSidebarVisible}
                transparent={true}
                animationType="none"
                onRequestClose={closeSidebar}
            >
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={closeSidebar}>
                        <View style={styles.modalTransparentArea} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
                        {/* SIDEBAR HEADER */}
                        <View style={styles.sidebarHeader}>
                            <TouchableOpacity onPress={() => { closeSidebar(); router.push('/profile'); }}>
                                <Image 
                                    source={{ uri: adminData?.profileImage || 'https://via.placeholder.com/80' }} 
                                    style={styles.sidebarProfilePic} 
                                />
                            </TouchableOpacity>
                            <Text style={styles.sidebarName}>{adminData?.fullName || "Administrator"}</Text>
                            <Text style={styles.sidebarEmail}>{adminData?.email || "admin@system.com"}</Text>
                        </View>

                        {/* MENU ITEMS */}
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/profile'); }}>
                                <Ionicons name="person-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>My Profile</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/settings'); }}>
                                <Ionicons name="settings-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>System Settings</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.menuDivider} />
                            
                            <TouchableOpacity style={styles.menuItem} onPress={() => alert("Support coming soon")}>
                                <Ionicons name="help-circle-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>Help & Support</Text>
                            </TouchableOpacity>
                        </View>

                        {/* LOGOUT */}
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 20 },
    
    // Header
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
    appTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    // Profile Section
    profileSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#eee' },
    welcomeLabel: { fontSize: 12, color: '#888' },
    welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    actionIcons: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginLeft: 15, padding: 4 }, 

    // Section Titles & Divider
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, marginTop: 10, color: '#333' },
    divider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 20, marginVertical: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    
    // --- BIG BUTTONS STYLES (Restored) ---
    mainButtonContainer: { paddingHorizontal: 20, gap: 15 },
    bigButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconCircle: {
        width: 65,
        height: 65,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonTextContainer: { flex: 1, marginLeft: 15 },
    bigButtonText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    subText: { fontSize: 14, color: '#666', marginTop: 2 },

    // Misc
    statsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 15, backgroundColor: '#F5F5F5', marginHorizontal: 20, borderRadius: 12 },
    statsText: { marginLeft: 10, color: '#666', fontSize: 13, fontWeight: '500' },

    // Sidebar Styles (Exact Match)
    modalOverlay: { flex: 1, flexDirection: 'row' },
    modalTransparentArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sidebarContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.75, backgroundColor: '#FFF', shadowColor: "#000", shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, paddingTop: 50, paddingHorizontal: 20, justifyContent: 'space-between' },
    sidebarHeader: { alignItems: 'center', marginBottom: 40, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 20 },
    sidebarProfilePic: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, backgroundColor: '#EEE' },
    sidebarName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    sidebarEmail: { fontSize: 14, color: '#888', marginTop: 2 },
    menuContainer: { flex: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    menuText: { fontSize: 16, marginLeft: 15, color: '#333', fontWeight: '500' },
    menuDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginBottom: 20 },
    logoutText: { fontSize: 16, marginLeft: 15, color: '#FF3B30', fontWeight: 'bold' },
});