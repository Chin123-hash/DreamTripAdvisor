// src/screens/AgencyMainPageScreen.js

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
// Service Imports
import {
  getCurrentUserData,
  getEntertainmentList,
  getFoodList,
  getPlanList, // <--- UPDATED: Using getPlanList as requested
  logoutUser
} from '../services/AuthService';

const { width } = Dimensions.get('window');

export default function AgencyMainPageScreen() {
  const router = useRouter(); 

  // --- STATE ---
  const [entertainments, setEntertainments] = useState([]);
  const [foods, setFoods] = useState([]);
  const [allPlans, setAllPlans] = useState([]); 
  const [agencyData, setAgencyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- SIDEBAR STATE ---
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current; 

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data
        const [userData, entList, foodList, plans] = await Promise.all([
          getCurrentUserData(),
          getEntertainmentList(),
          getFoodList(),
          getPlanList() // <--- UPDATED: Calling getPlanList
        ]);
        
        // Process Lists
        const formattedEnt = entList.map(item => ({ ...item, image: item.imageUrl || item.image }));
        const formattedFood = foodList.map(item => ({ ...item, image: item.imageUrl || item.image }));

        // Set State
        setAgencyData(userData);
        setEntertainments(formattedEnt);
        setFoods(formattedFood);
        setAllPlans(plans); 

      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- ANIMATIONS & LOGOUT ---
  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true, }).start();
  };
  const closeSidebar = () => {
    Animated.timing(slideAnim, { toValue: -width, duration: 300, useNativeDriver: true, }).start(() => setSidebarVisible(false));
  };
  const handleLogout = async () => {
      try { await logoutUser(); closeSidebar(); router.replace('/'); } catch (error) { console.error("Failed to log out"); }
  };

  const renderHorizontalCard = ({ item, isFood }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => {
          const route = isFood ? '/agencyfood-details' : '/agencyentertainment-details';
          router.push({ pathname: route, params: { id: item.id } });
      }}
    >
      <Image source={{ uri: isFood ? item.image : item.imageUrl }} style={styles.cardImage} />
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  const getDisplayName = () => {
      if (!agencyData) return 'Loading...';
      return agencyData.agencyName || agencyData.fullName || 'Agency Partner';
  };
  const getDisplayImage = () => {
      const uri = agencyData?.logoUrl || agencyData?.profileImage;
      return uri ? { uri } : { uri: 'https://via.placeholder.com/80' }; 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={openSidebar}>
             <Ionicons name="menu" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Agency Dashboard</Text>
          <View style={{width: 30}} />
        </View>

        {/* PROFILE SECTION */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <Image source={getDisplayImage()} style={styles.profilePic} />
            <View>
                <Text style={styles.welcomeLabel}>Welcome back,</Text>
                <Text style={styles.welcomeText}>{loading ? '...' : getDisplayName()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/explore')} style={styles.iconButton}>
            <Ionicons name="search" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* AGENCY ACTION BUTTONS */}
        <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/agency-upload_plan')}>
                <Ionicons name="add-circle-outline" size={24} color="#648DDB" />
                <Text style={styles.gridText}>Add Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/agency-upload_food')}> 
                <Ionicons name="fast-food-outline" size={24} color="#648DDB" />
                <Text style={styles.gridText}>Add Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/agency-upload_entertainment')}>
                <Ionicons name="musical-notes-outline" size={24} color="#648DDB" />
                <Text style={styles.gridText}>Add Ent.</Text>
            </TouchableOpacity>
          <TouchableOpacity style={styles.gridButton} onPress={() => router.push('/orderSalesDashboard')}>
                <Ionicons name="list-outline" size={24} color="#648DDB" />
                <Text style={styles.gridText}>View Orders</Text>
            </TouchableOpacity>
        </View>

        {/* ENTERTAINMENT LIST */}
        <Text style={styles.sectionTitle}>Popular Entertainment</Text>
        {loading ? <ActivityIndicator size="small" color="#648DDB" /> : (
          <FlatList
            data={entertainments}
            renderItem={(item) => renderHorizontalCard({ ...item, isFood: false })}
            keyExtractor={item => item.id || Math.random().toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ListEmptyComponent={<Text style={styles.emptyText}>No entertainment found.</Text>}
          />
        )}

        {/* FOOD LIST */}
        <Text style={styles.sectionTitle}>Popular Food</Text>
        {loading ? <ActivityIndicator size="small" color="#648DDB" /> : (
            <FlatList
                data={foods}
                renderItem={({ item }) => renderHorizontalCard({ item, isFood: true })}
                keyExtractor={item => item.id || Math.random().toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                ListEmptyComponent={<Text style={styles.emptyText}>No food spots found.</Text>}
            />
        )}

        {/* --- DYNAMIC ALL PLANS LIST --- */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>All Market Plans</Text>
        
        {allPlans.length === 0 ? (
            <Text style={styles.emptyText}>No plans available.</Text>
        ) : (
            allPlans.map((plan) => (
            <TouchableOpacity 
                key={plan.id}
                style={styles.planCard}
                onPress={() => router.push({ pathname: '/agencyplanDetails', params: { id: plan.id } })} 
            >
                <View style={styles.planRow}>
                    <Image source={{ uri: plan.imageUrl || 'https://via.placeholder.com/200' }} style={styles.planImage} />
                    <View style={styles.planInfo}>
                        <Text style={styles.planTitle}>{plan.title || plan.planName || "Untitled"}</Text>
                        <Text style={styles.planDesc} numberOfLines={1}>{plan.description || "No description"}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={{fontSize:12, marginLeft:5, color:'#666'}}>{plan.rating || 5}.0</Text>
                            {/* Optional: Highlight if it's YOUR plan */}
                            {plan.userId === agencyData?.uid && (
                                <Text style={{fontSize:12, marginLeft:10, color:'#648DDB', fontWeight:'bold'}}>(Yours)</Text>
                            )}
                        </View>
                        <Text style={styles.priceText}> {plan.price || '0'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
            ))
        )}
        
        <View style={{height: 40}} /> 
      </ScrollView>

      {/* SIDEBAR MODAL */}
      <Modal visible={isSidebarVisible} transparent={true} animationType="none" onRequestClose={closeSidebar}>
          <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={closeSidebar}><View style={styles.modalTransparentArea} /></TouchableWithoutFeedback>
              <Animated.View style={[styles.sidebarContainer, { transform: [{ translateX: slideAnim }] }]}>
                  <View style={styles.sidebarHeader}>
                      <Image source={getDisplayImage()} style={styles.sidebarProfilePic} />
                      <Text style={styles.sidebarName}>{getDisplayName()}</Text>
                      <Text style={styles.sidebarEmail}>{agencyData?.email || "No Email Found"}</Text>
                  </View>
                  <View style={styles.menuContainer}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/profile") }>
                          <Ionicons name="person-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Agency Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => closeSidebar()}>
                          <Ionicons name="briefcase-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Manage Services</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/settings")}>
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
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 20 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  appTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  profileSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#eee' },
  welcomeLabel: { fontSize: 12, color: '#888' },
  welcomeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  iconButton: { marginLeft: 15, padding: 4 }, 
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 10, marginTop: 10, color: '#333' },
  horizontalList: { paddingLeft: 20, paddingRight: 10, paddingBottom: 20 },
  cardContainer: { marginRight: 15, width: 120, alignItems: 'center' },
  cardImage: { width: 100, height: 100, borderRadius: 15, marginBottom: 8, backgroundColor: '#f0f0f0' },
  cardTitle: { fontSize: 12, fontWeight: '500', textAlign: 'center', color: '#333' },
  emptyText: { marginLeft: 20, color: '#999', fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 20, marginVertical: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  planCard: { backgroundColor: '#F5F9F6', marginHorizontal: 20, marginBottom: 15, borderRadius: 15, padding: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 3 },
  planRow: { flexDirection: 'row', marginBottom: 10 },
  planImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#ddd' },
  planInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  planTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  planDesc: { fontSize: 12, color: '#666', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', marginBottom: 4, alignItems:'center' },
  priceText: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textAlign: 'right', color: '#333' },

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
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginBottom: 20 },
  logoutText: { fontSize: 16, marginLeft: 15, color: '#FF3B30', fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  gridButton: { width: '48%', backgroundColor: '#F8F9FA', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#E0E0E0', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  gridText: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#333' }
});