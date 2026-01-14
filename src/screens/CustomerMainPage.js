import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Service
import { getCurrentUserData, getEntertainmentList, getFoodList, getPlanList, logoutUser } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

// Helper to parse "RM 500.00" -> 500
const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    // Remove "RM" and any non-numeric chars except dot
    const clean = String(priceStr).replace(/[^0-9.]/g, '');
    return parseFloat(clean) || 0;
};

export default function CustomerMainPage() {
    const router = useRouter();
    const { t } = useLanguage();
    
    // --- STATE ---
    const [entertainmentList, setEntertainmentList] = useState([]);
    const [foodList, setFoodList] = useState([]);
    const [planList, setPlanList] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userData, setUserData] = useState(null);

    // --- SIDEBAR STATE ---
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-width)).current; 

    // --- FETCH DATA FUNCTION ---
    const fetchData = async () => {
        try {
            const entData = await getEntertainmentList();
            const validEnt = entData.filter(item => item.title && item.imageUrl);
            setEntertainmentList(validEnt.map(item => ({ ...item, image: item.imageUrl })));

            const foodData = await getFoodList();
            const validFood = foodData
                .filter(item => item.title && item.imageUrl)
                .map(item => ({ ...item, image: item.imageUrl }));
            setFoodList(validFood);

            const pData = await getPlanList();
            const formattedPlans = pData.map(item => ({
                id: item.id,
                title: item.title || 'Untitled Plan',
                desc: item.description || item.desc || 'No description available.',
                price: item.price || '0', // e.g. "RM 500.00"
                pax: item.pax || 1,       // Need pax to calculate per-person price
                rating: item.rating || 5, 
                image: item.imageUrl || 'https://via.placeholder.com/300' 
            }));
            setPlanList(formattedPlans);

            const user = await getCurrentUserData();
            setUserData(user);

        } catch (error) {
            console.error("Failed to load data:", error);
        }
    };

    // --- AUTO REFRESH ON FOCUS ---
    useFocusEffect(
        useCallback(() => {
            const loadOnFocus = async () => {
                await fetchData();
                setLoading(false);
            };
            
            loadOnFocus();
        }, [])
    );

    // --- PULL TO REFRESH ---
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // --- SIDEBAR ANIMATION ---
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
            Alert.alert(t('alertErrorTitle'), t('alertLogoutFail'));
        }
    };

    // --- RENDER CARD (Horizontal) ---
    const renderHorizontalCard = ({ item, isFood }) => (
        <TouchableOpacity 
            style={styles.cardContainer}
            onPress={() => {
                const route = isFood ? '/food-details' : '/entertainment-details';
                router.push({ pathname: route, params: { id: item.id } });
            }}
        >
            <Image source={{ uri: isFood ? item.image : item.imageUrl }} style={styles.cardImage} />
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#648DDB']} />
                }
            >
                
                {/* HEADER */}
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={openSidebar}>
                        <Ionicons name="menu" size={30} color="#333" />
                    </TouchableOpacity>
                    {/* APP NAME IS UNTRANSLATED */}
                    <Text style={styles.appTitle}>Dream Trip Advisor</Text>
                    <View style={{width: 30}} />
                </View>

                {/* PROFILE & ACTIONS SECTION */}
                <View style={styles.profileSection}>
                    <View style={styles.profileRow}>
                        <Image 
                            source={{ uri: userData?.profileImage || 'https://via.placeholder.com/50' }} 
                            style={styles.profilePic} 
                        />
                        <View>
                            <Text style={styles.welcomeLabel}>{t('hi')}</Text>
                            <Text style={styles.welcomeText}>
                                {userData?.fullName ? userData.fullName.split(' ')[0] : t('traveller')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.actionIcons}>
                        <TouchableOpacity onPress={() => router.push('/explore')} style={styles.iconButton}>
                            <Ionicons name="search" size={28} color="#333" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconButton}>
                            <Ionicons name="cart-outline" size={28} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ENTERTAINMENT LIST */}
                <Text style={styles.sectionTitle}>{t('sectionEnt')}</Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#648DDB" style={{marginLeft: 20, alignSelf:'flex-start'}} />
                ) : (
                    <FlatList
                        data={entertainmentList}
                        renderItem={(item) => renderHorizontalCard({ ...item, isFood: false })}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                        ListEmptyComponent={<Text style={styles.emptyText}>{t('emptyEnt')}</Text>}
                    />
                )}

                {/* FOOD LIST */}
                <Text style={styles.sectionTitle}>{t('sectionFood')}</Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#648DDB" style={{ marginLeft: 20, alignSelf: 'flex-start' }} />
                ) : (
                    <FlatList
                        data={foodList}
                        renderItem={({ item }) => renderHorizontalCard({ item, isFood: true })} 
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                        ListEmptyComponent={<Text style={styles.emptyText}>{t('emptyFood')}</Text>}
                    />
                )}

                {/* PLAN LIST */}
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>{t('sectionPlan')}</Text>
                
                {loading ? (
                    <ActivityIndicator size="small" color="#648DDB" style={{ marginLeft: 20, alignSelf: 'flex-start' }} />
                ) : planList.length === 0 ? (
                    <Text style={styles.emptyText}>{t('emptyPlan')}</Text>
                ) : (
                    planList.map((plan) => {
                        // --- CALCULATION LOGIC ---
                        const total = parsePrice(plan.price);
                        const pax = parseInt(plan.pax) || 1;
                        const perPax = (total / pax).toFixed(2);

                        return (
                            <TouchableOpacity 
                                key={plan.id} 
                                style={styles.planCard}
                                onPress={() => {
                                    router.push({ pathname: '/planDetails', params: { id: plan.id } });
                                }}
                            >
                                <View style={styles.planRow}>
                                    <Image source={{ uri: plan.image }} style={styles.planImage} />
                                    <View style={styles.planInfo}>
                                        <Text style={styles.planTitle}>{plan.title}</Text>
                                        <Text style={styles.planDesc} numberOfLines={2}>{plan.desc}</Text>
                                        <View style={styles.ratingRow}>
                                            <Text style={styles.ratingLabel}>{t('rating')}</Text>
                                            <View style={{flexDirection:'row', marginLeft: 5}}>
                                                {[...Array(Math.min(5, Math.floor(plan.rating)))].map((_, i) => (
                                                    <Ionicons key={i} name="star" size={14} color="#FFD700" />
                                                ))}
                                            </View>
                                        </View>
                                        
                                        {/* Updated Price Display */}
                                        <Text style={styles.priceText}>
                                            {t('estimated')} RM {perPax} /pax
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                
                {/* Added padding at bottom so scroll doesn't get hidden behind the new button */}
                <View style={{height: 100}} /> 
            </ScrollView>

            {/* --- FLOATING CHATBOT BUTTON --- */}
            <TouchableOpacity 
                style={styles.floatingButton}
                onPress={() => router.push('/chatbot')}
                activeOpacity={0.8}
            >
                <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* SIDEBAR MODAL */}
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
                                    source={{ uri: userData?.profileImage || 'https://via.placeholder.com/80' }} 
                                    style={styles.sidebarProfilePic} 
                                />
                            </TouchableOpacity>
                            <Text style={styles.sidebarName}>{userData?.fullName || t('traveller')}</Text>
                            <Text style={styles.sidebarEmail}>{userData?.email || "No Email"}</Text>
                        </View>

                        {/* MENU ITEMS */}
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/profile'); }}>
                                <Ionicons name="person-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>{t('myProfile')}</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/history'); }}>
                                <Ionicons name="receipt-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>{t('menuOrders')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/favourite'); } }>
                                <Ionicons name="heart-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>{t('menuFav')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/settings'); }}>
                                <Ionicons name="settings-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>{t('menuSettings')}</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.menuDivider} />
                            
                            <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/help-support'); }}>
                                <Ionicons name="help-circle-outline" size={24} color="#333" />
                                <Text style={styles.menuText}>{t('menuHelp')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* LOGOUT */}
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                            <Text style={styles.logoutText}>{t('logout')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingBottom: 20 },
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
    appTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    profileSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#eee' },
    welcomeLabel: { fontSize: 12, color: '#888' },
    welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    actionIcons: { flexDirection: 'row', alignItems: 'center' },
    iconButton: { marginLeft: 15, padding: 4 }, 
    badgeDot: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, marginTop: 10, color: '#333' },
    horizontalList: { paddingLeft: 20, paddingRight: 10, paddingBottom: 20 },
    cardContainer: { marginRight: 15, width: 120, alignItems: 'center' },
    cardImage: { width: 100, height: 100, borderRadius: 15, marginBottom: 8, backgroundColor: '#f0f0f0' },
    cardTitle: { fontSize: 12, fontWeight: '500', textAlign: 'center', color: '#333' },
    emptyText: { marginLeft: 20, color: '#999', fontStyle: 'italic', marginBottom: 10 },
    divider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 20, marginVertical: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
    
    // Plan Card Styles
    planCard: { backgroundColor: '#F5F9F6', marginHorizontal: 20, marginBottom: 15, borderRadius: 15, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 3 },
    planRow: { flexDirection: 'row', marginBottom: 10 },
    planImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#ddd' },
    planInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    planTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
    planDesc: { fontSize: 12, color: '#666', marginBottom: 6 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    ratingLabel: { fontSize: 10, color: '#888', marginRight: 5 },
    priceText: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textAlign: 'right', color: '#333' },

    // --- FLOATING BUTTON STYLE ---
    floatingButton: {
        position: 'absolute', 
        bottom: 30,           
        right: 20,            
        width: 60,            
        height: 60,           
        borderRadius: 30,     
        backgroundColor: '#648DDB', 
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 999,
    },

    // Sidebar Styles
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