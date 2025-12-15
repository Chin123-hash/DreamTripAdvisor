import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- DUMMY DATA (Placeholders for Firebase) ---
const DUMMY_ENTERTAINMENT = [
  { id: '1', title: 'Penang Hill', image: 'https://via.placeholder.com/150' },
  { id: '2', title: 'Kek Lok Si', image: 'https://via.placeholder.com/150' },
  { id: '3', title: 'Tadom Hill', image: 'https://via.placeholder.com/150' },
];

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

export default function HomeScreen() {
  
  // --- RENDER ITEM: Horizontal Card (Food/Entertainment) ---
  const renderHorizontalCard = ({ item, isFood }) => (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => {
        if (isFood) {
          // Navigate to Food Details (We will build this next)
          // router.push({ pathname: '/food-details', params: { id: item.id } });
          alert(`Navigating to Food: ${item.title}`);
        } else {
          alert(`Navigating to Entertainment: ${item.title}`);
        }
      }}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* === HEADER SECTION === */}
        <View style={styles.headerContainer}>
          <TouchableOpacity>
             <Ionicons name="menu" size={30} color="#000" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>Dream Trip Advisor</Text>
          <View style={{width: 30}} /> {/* Spacer to balance menu icon */}
        </View>

        {/* PROFILE SECTION (Using your CSS values loosely adapted for Flex) */}
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            {/* Profile Pic Placeholder */}
            <Image 
              source={{ uri: 'https://via.placeholder.com/50' }} 
              style={styles.profilePic} 
            />
            <Text style={styles.welcomeText}>Hi, Traveller!</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="search" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* === SECTION 1: ENTERTAINMENT (Horizontal) === */}
        <Text style={styles.sectionTitle}>Recommended Entertainment</Text>
        <FlatList
          data={DUMMY_ENTERTAINMENT}
          renderItem={(item) => renderHorizontalCard({ ...item, isFood: false })}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        {/* === SECTION 2: FOOD (Horizontal) === */}
        <Text style={styles.sectionTitle}>Food you should try</Text>
        <FlatList
          data={DUMMY_FOOD}
          renderItem={(item) => renderHorizontalCard({ ...item, isFood: true })}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />

        {/* === SECTION 3: PLANS (Vertical) === */}
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Recommended Plan</Text>
        
        {/* We use .map() here because we are already inside a ScrollView */}
        {DUMMY_PLANS.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planRow}>
              <Image source={{ uri: plan.image }} style={styles.planImage} />
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDesc} numberOfLines={2}>{plan.desc}</Text>
                
                {/* Peer Rating Stars */}
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
            
            <TouchableOpacity style={styles.viewCartButton}>
               <Text style={styles.viewCartText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{height: 50}} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // === HEADER ===
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },

  // === PROFILE SECTION ===
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,  // Matches your CSS
    height: 45, // Matches your CSS
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#eee',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },

  // === HEADERS ===
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
    marginTop: 10,
    color: '#000',
  },

  // === HORIZONTAL LISTS ===
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 20,
  },
  cardContainer: {
    marginRight: 15,
    width: 120, // Width of small cards
    alignItems: 'center',
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },

  // === DIVIDER ===
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0', // Dotted line effect placeholder
    marginHorizontal: 20,
    marginVertical: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
  },

  // === VERTICAL PLAN CARDS ===
  planCard: {
    backgroundColor: '#F5F9F6', // Light Greenish tint from Figma
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  planRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  planImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#ddd',
  },
  planInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'column',
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 10,
    color: '#888',
  },
  priceText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'right', // "Estimated: RM" is aligned right in Figma
  },
  
  viewCartButton: {
    backgroundColor: '#648DDB',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-end', // Aligns button to the right
  },
  viewCartText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});