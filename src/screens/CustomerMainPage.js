// src/screens/CustomerMainPage.js

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
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

// Service
// ADDED: getPlanList to the imports
import { getCurrentUserData, getEntertainmentList, getFoodList, getPlanList, logoutUser } from '../services/AuthService';

const { width } = Dimensions.get('window');

export default function CustomerMainPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [entertainmentList, setEntertainmentList] = useState([]);
  const [foodList, setFoodList] = useState([]);
  // ADDED: State for plans
  const [planList, setPlanList] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // --- SIDEBAR STATE ---
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current; 

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Entertainment
        const entData = await getEntertainmentList();
        const validEnt = entData.filter(item => item.title && item.imageUrl);
        setEntertainmentList(validEnt.map(item => ({ ...item, image: item.imageUrl })));

        // 2. Fetch Food
        const foodData = await getFoodList();
        const validFood = foodData
            .filter(item => item.title && item.imageUrl)
            .map(item => ({ ...item, image: item.imageUrl }));
        setFoodList(validFood);

        // 3. Fetch Plans (NEW CODE)
        const pData = await getPlanList();
        // We map the database fields to the names your UI expects
        const formattedPlans = pData.map(item => ({
            id: item.id,
            title: item.title || 'Untitled Plan',
            // Check if DB uses 'description' or 'desc', fallback to empty string
            desc: item.description || item.desc || 'No description available.',
            // Check if DB uses 'price', ensure it's a string or number
            price: item.price || 'N/A',
            // Default rating to 5 if missing
            rating: item.rating || 5, 
            // Use imageUrl from DB, or a placeholder if missing
            image: item.imageUrl || 'https://via.placeholder.com/300' 
        }));
        setPlanList(formattedPlans);

        // 4. Fetch User
        const user = await getCurrentUserData();
        setUserData(user);

      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          Alert.alert("Error", "Failed to log out");
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={openSidebar}>
             <Ionicons name="menu" size={30} color="#333" />
          </TouchableOpacity>
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
                <Text style={styles.welcomeLabel}>Hi,</Text>
                <Text style={styles.welcomeText}>
                    {userData?.fullName ? userData.fullName.split(' ')[0] : 'Traveller'}
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
        <Text style={styles.sectionTitle}>Recommended Entertainment</Text>
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
            ListEmptyComponent={<Text style={styles.emptyText}>No entertainment found.</Text>}
          />
        )}

        {/* FOOD LIST */}
        <Text style={styles.sectionTitle}>Food you should try</Text>
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
                          ListEmptyComponent={<Text style={styles.emptyText}>No food spots found.</Text>}
                      />
              )}

        {/* PLAN LIST (UPDATED) */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Recommended Plan</Text>
        
        {loading ? (
             <ActivityIndicator size="small" color="#648DDB" style={{ marginLeft: 20, alignSelf: 'flex-start' }} />
        ) : planList.length === 0 ? (
             <Text style={styles.emptyText}>No plans available at the moment.</Text>
        ) : (
            planList.map((plan) => (
            <TouchableOpacity 
                key={plan.id} 
                style={styles.planCard}
                onPress={() => {
                    // Navigate to Plan Details (ensure this route exists later)
                    router.push({ pathname: '/planDetails', params: { id: plan.id } });
                }}
            >
                <View style={styles.planRow}>
                <Image source={{ uri: plan.image }} style={styles.planImage} />
                <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planDesc} numberOfLines={2}>{plan.desc}</Text>
                    <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Rating</Text>
                    <View style={{flexDirection:'row', marginLeft: 5}}>
                        {[...Array(plan.rating > 5 ? 5 : plan.rating)].map((_, i) => (
                           <Ionicons key={i} name="star" size={14} color="#FFD700" />
                        ))}
                    </View>
                    </View>
                    <Text style={styles.priceText}>Estimated: {plan.price}</Text>
                </View>
                </View>
            </TouchableOpacity>
            ))
        )}
        
        <View style={{height: 40}} /> 
      </ScrollView>

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
                      <Text style={styles.sidebarName}>{userData?.fullName || "Traveller"}</Text>
                      <Text style={styles.sidebarEmail}>{userData?.email || "No Email"}</Text>
                  </View>

                  {/* MENU ITEMS */}
                  <View style={styles.menuContainer}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/profile'); }}>
                          <Ionicons name="person-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>My Profile</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/history'); }}>
                          <Ionicons name="receipt-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Orders</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.menuItem} onPress={() => closeSidebar()}>
                          <Ionicons name="heart-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Favourites</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); router.push('/settings'); }}>
                          <Ionicons name="settings-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Settings</Text>
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