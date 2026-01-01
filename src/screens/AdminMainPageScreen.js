import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

// Service Imports (Adjust paths based on your project structure)
import { getCurrentUserData, logoutUser } from '../services/AuthService';

const { width, height } = Dimensions.get('window');

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
                <ActivityIndicator size="large" color="#1976D2" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* HEADER */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
                    <Ionicons name="menu-outline" size={32} color="#333" />
                </TouchableOpacity>
                <Text style={styles.appTitle}>Dream Trip Advisor</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* WELCOME SECTION */}
                <View style={styles.welcomeSection}>
                    
                    <Text style={styles.adminName}>Hello, {adminData?.fullName || 'Admin'}</Text>
                </View>

                {/* THREE BIG BUTTONS */}
                <View style={styles.mainButtonContainer}>
                    
                    {/* USERS BUTTON */}
                    <TouchableOpacity 
                        style={[styles.bigButton, { backgroundColor: '#E3F2FD' }]} 
                        onPress={() => router.push('/admin/users')}
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
                        onPress={() => router.push('/admin/orders')}
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

                {/* SYSTEM STATS PLACEHOLDER */}
                <View style={styles.statsCard}>
                    <Ionicons name="stats-chart" size={20} color="#666" />
                    <Text style={styles.statsText}>System status: Active & Secured</Text>
                </View>

            </ScrollView>

            {/* SIDEBAR MODAL */}
            <Modal visible={isSidebarVisible} transparent={true} animationType="none">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={closeSidebar}>
                        <View style={styles.modalTransparentArea} />
                    </TouchableWithoutFeedback>
                    
                    <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
                        <View style={styles.sidebarHeader}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person-circle" size={80} color="#1976D2" />
                            </View>
                            <Text style={styles.sidebarName}>{adminData?.fullName || 'Administrator'}</Text>
                            <Text style={styles.sidebarEmail}>{adminData?.email || 'admin@system.com'}</Text>
                        </View>

                        <View style={styles.menuContainer}>
                            <TouchableOpacity 
                                style={styles.menuItem} 
                                onPress={() => { closeSidebar(); router.push("/profile"); }}
                            >
                                <Ionicons name="person-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>My Profile</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.menuItem} 
                                onPress={() => { closeSidebar(); router.push("/settings"); }}
                            >
                                <Ionicons name="settings-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>Settings</Text>
                            </TouchableOpacity>
                        </View>

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
    safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    
    // Header
    headerContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    menuButton: { padding: 5 },
    appTitle: { fontSize: 18, fontWeight: '800', color: '#333', letterSpacing: 0.5 },
    
    // Welcome
    welcomeSection: { marginBottom: 30, marginTop: 10 },
    welcomeLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 },
    adminName: { fontSize: 28, fontWeight: 'bold', color: '#222' },
    
    // Big Buttons
    mainButtonContainer: { gap: 15 },
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

    // Sidebar
    modalOverlay: { flex: 1, flexDirection: 'row' },
    modalTransparentArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sidebarContainer: { 
        position: 'absolute', 
        left: 0, top: 0, bottom: 0, 
        width: width * 0.75, 
        backgroundColor: '#FFF', 
        paddingTop: 60, 
        paddingHorizontal: 20 
    },
    sidebarHeader: { alignItems: 'center', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 20 },
    avatarContainer: { marginBottom: 10 },
    sidebarName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    sidebarEmail: { fontSize: 14, color: '#888' },
    menuContainer: { flex: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
    menuText: { fontSize: 16, marginLeft: 15, fontWeight: '500', color: '#333' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#EEE', marginBottom: 20 },
    logoutText: { fontSize: 16, marginLeft: 15, color: '#FF3B30', fontWeight: 'bold' },

    // Misc
    statsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, padding: 15, backgroundColor: '#EEE', borderRadius: 12 },
    statsText: { marginLeft: 10, color: '#666', fontSize: 13, fontWeight: '500' }
});