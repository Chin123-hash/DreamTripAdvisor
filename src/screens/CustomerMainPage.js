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
// IMPORTS UPDATED: Added getCurrentUserData
import { getCurrentUserData, getEntertainmentList, logoutUser } from '../services/AuthService';

const { width } = Dimensions.get('window');

// --- DUMMY DATA (Only for Food & Plans, since Entertainment is fetched) ---
const DUMMY_FOOD = [
    { id: '1', title: 'Laksalicious', image: 'https://via.placeholder.com/150' },
    { id: '2', title: 'Tiger Char Kuey Teow', image: 'https://via.placeholder.com/150' },
    { id: '3', title: 'Nasi Kandar', image: 'https://via.placeholder.com/150' },
];

const DUMMY_PLANS = [
    { 
        id: '1', 
        title: 'Penang 3D2N Fun Trip', 
        desc: 'Experience the heritage and food of Penang.', 
        rating: 4, 
        price: '450',
        image: 'https://via.placeholder.com/300'
    },
    { 
        id: '2', 
        title: 'KL City Escape', 
        desc: 'Shopping and sightseeing in the heart of KL.', 
        rating: 5, 
        price: '300',
        image: 'https://via.placeholder.com/300'
    }
];

export default function CustomerMainPage() {
  const router = useRouter();
  
  // --- MAIN STATE ---
  const [entertainmentList, setEntertainmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- USER STATE (NEW) ---
  const [userData, setUserData] = useState(null);

  // --- SIDEBAR STATE ---
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current; 

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Entertainment
        const data = await getEntertainmentList();
        const validData = data.filter(item => item.title && item.imageUrl);
        const formattedData = validData.map(item => ({
          ...item,
          image: item.imageUrl 
        }));
        setEntertainmentList(formattedData);

        // 2. Fetch User Data (NEW)
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

  // --- SIDEBAR ANIMATION LOGIC ---
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

    // --- RENDER CARD ---
    const renderHorizontalCard = ({ item, isFood }) => (
        <TouchableOpacity 
            style={styles.cardContainer}
            onPress={() => {
                if (!isFood) {
                    // Navigate to Entertainment Details (New Feature)
                    router.push({ pathname: '/entertainment-details', params: { id: item.id } });
                } else {
                    // Placeholder for Food (Future Feature)
                    alert(`Navigating to Food: ${item.title}`);
                }
            }}
        >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={openSidebar}>
             <Ionicons name="menu" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Dream Trip Advisor</Text>
          <View style={{width: 30}} />
        </View>

        {/* PROFILE SECTION (UPDATED) */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <Image 
              // Use user image or fallback
              source={{ uri: userData?.profileImage || 'https://via.placeholder.com/50' }} 
              style={styles.profilePic} 
            />
            <Text style={styles.welcomeText}>
                Hi, {userData?.fullName ? userData.fullName.split(' ')[0] : 'Traveller'}!
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/explore')}>
            <Ionicons name="search" size={28} color="#333" />
          </TouchableOpacity>
        </View>

                {/* SECTION 1: ENTERTAINMENT (Real Fetched Data) */}
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

                {/* SECTION 2: FOOD (Dummy Data) */}
                <Text style={styles.sectionTitle}>Food you should try</Text>
                <FlatList
                    data={DUMMY_FOOD}
                    renderItem={(item) => renderHorizontalCard({ ...item, isFood: true })}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                />

                {/* SECTION 3: PLANS (Vertical) */}
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Recommended Plan</Text>
                
                {DUMMY_PLANS.map((plan) => (
                    <View key={plan.id} style={styles.planCard}>
                        <View style={styles.planRow}>
                            <Image source={{ uri: plan.image }} style={styles.planImage} />
                            <View style={styles.planInfo}>
                                <Text style={styles.planTitle}>{plan.title}</Text>
                                <Text style={styles.planDesc} numberOfLines={2}>{plan.desc}</Text>
                                
                                <View style={styles.ratingRow}>
                                    <Text style={styles.ratingLabel}>Peer Rating</Text>
                                    <View style={{flexDirection:'row'}}>
                                        {[...Array(plan.rating)].map((_, i) => (
                                            <Ionicons key={i} name="star" size={14} color="#FFD700" />
                                        ))}
                                    </View>
                                </View>

                <Text style={styles.priceText}>Estimated: RM {plan.price}</Text>
              </View>
            </View>
          </View>
        ))}

                <View style={{height: 80}} /> 
            </ScrollView>

      {/* FAB BUTTON */}
      <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/cart')}>
        <Ionicons name="cart" size={24} color="#FFF" style={{marginRight: 5}} />
        <Text style={styles.fabText}>View Cart</Text>
      </TouchableOpacity>


      {/* ================= SIDEBAR MODAL ================= */}
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
                  
                  {/* 1. Profile Header (UPDATED) */}
                  <View style={styles.sidebarHeader}>
                      <Image 
                          source={{ uri: userData?.profileImage || 'https://via.placeholder.com/80' }} 
                          style={styles.sidebarProfilePic} 
                      />
                      <Text style={styles.sidebarName}>
                          {userData?.fullName || "Traveller"}
                      </Text>
                      <Text style={styles.sidebarEmail}>
                          {userData?.email || "No Email"}
                      </Text>
                  </View>

                  {/* 2. Menu Items */}
                  <View style={styles.menuContainer}>
                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); }}>
                          <Ionicons name="person-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>My Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); }}>
                          <Ionicons name="map-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>My Plans</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); }}>
                          <Ionicons name="heart-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Favourites</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); }}>
                          <Ionicons name="settings-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Settings</Text>
                      </TouchableOpacity>

                      <View style={styles.menuDivider} />

                      <TouchableOpacity style={styles.menuItem} onPress={() => { closeSidebar(); alert("Support coming soon"); }}>
                          <Ionicons name="help-circle-outline" size={24} color="#333" />
                          <Text style={styles.menuText}>Help & Support</Text>
                      </TouchableOpacity>
                  </View>

                  {/* 3. Logout Footer */}
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
  // ... EXISTING STYLES ...
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 20 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  appTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  profileSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profilePic: { width: 50, height: 45, borderRadius: 25, marginRight: 15, backgroundColor: '#eee' },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
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
  ratingRow: { flexDirection: 'column', marginBottom: 4 },
  ratingLabel: { fontSize: 10, color: '#888' },
  priceText: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textAlign: 'right', color: '#333' },
  fabButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#648DDB', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  fabText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // === SIDEBAR STYLES ===
  modalOverlay: {
      flex: 1,
      flexDirection: 'row',
  },
  modalTransparentArea: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)', // Darken background
  },
  sidebarContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: width * 0.75, // Takes 75% of screen width
      backgroundColor: '#FFF',
      shadowColor: "#000",
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      paddingTop: 50,
      paddingHorizontal: 20,
      justifyContent: 'space-between', // Pushes logout to bottom
  },
  sidebarHeader: {
      alignItems: 'center',
      marginBottom: 40,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
      paddingBottom: 20,
  },
  sidebarProfilePic: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 10,
      backgroundColor: '#EEE',
  },
  sidebarName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  sidebarEmail: {
      fontSize: 14,
      color: '#888',
      marginTop: 2,
  },
  menuContainer: {
      flex: 1,
  },
  menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
  },
  menuText: {
      fontSize: 16,
      marginLeft: 15,
      color: '#333',
      fontWeight: '500',
  },
  menuDivider: {
      height: 1,
      backgroundColor: '#F0F0F0',
      marginVertical: 15,
  },
  logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
      marginBottom: 20,
  },
  logoutText: {
      fontSize: 16,
      marginLeft: 15,
      color: '#FF3B30',
      fontWeight: 'bold',
  },
});