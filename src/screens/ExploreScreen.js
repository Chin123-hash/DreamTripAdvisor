// src/screens/ExploreScreen.js
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { getEntertainmentList, getFoodList } from '../services/AuthService';

export default function ExploreScreen() {
    const router = useRouter();

    // --- State ---
    const [entertainmentData, setEntertainmentData] = useState([]);
    const [foodData, setFoodData] = useState([]);
    const [displayList, setDisplayList] = useState([]); 
    const [loading, setLoading] = useState(true);

    // Search State
    const [entSearch, setEntSearch] = useState('');
    const [foodSearch, setFoodSearch] = useState('');
    const [activeTab, setActiveTab] = useState('entertainment'); // 'entertainment' or 'food'

    // --- 1. Fetch Data on Load ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const ent = await getEntertainmentList();
            const food = await getFoodList();
            
            setEntertainmentData(ent);
            setFoodData(food);
            
            // Default: Show Entertainment
            setDisplayList(ent);
            setLoading(false);
        };
        loadData();
    }, []);

    // --- 2. Handle Search Logic ---
    const handleEntSearch = (text) => {
        setEntSearch(text);
        setActiveTab('entertainment'); 
        setFoodSearch(''); 
        
        if (text) {
            const query = (text || '').toString().toLowerCase();
            const filtered = entertainmentData.filter(item => {
                const title = (item?.title || '').toString().toLowerCase();
                return title.includes(query);
            });
            setDisplayList(filtered);
        } else {
            setDisplayList(entertainmentData);
        }
    };

    const handleFoodSearch = (text) => {
        setFoodSearch(text);
        setActiveTab('food'); 
        setEntSearch(''); 
        
        if (text) {
            const query = (text || '').toString().toLowerCase();
            const filtered = foodData.filter(item => {
                const title = (item?.title || '').toString().toLowerCase();
                return title.includes(query);
            });
            setDisplayList(filtered);
        } else {
            setDisplayList(foodData);
        }
    };

    // --- 3. Navigation ---
    const handlePressItem = (item) => {
        if (activeTab === 'food') {
            // Future: Navigate to Food Details
            // router.push({ pathname: '/food-details', params: { id: item.id } });
            alert("Food Details coming soon!");
        } else {
            router.push({ pathname: '/entertainment-details', params: { id: item.id } });
        }
    };

    // --- 4. Render Card ---
    const renderCard = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => handlePressItem(item)}
            activeOpacity={0.9}
        >
            <Image 
                source={{ uri: item.imageUrl || item.image || 'https://via.placeholder.com/150' }} 
                style={styles.cardImage} 
            />
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating || 4.5}</Text>
                    </View>
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description || "No description available."}
                </Text>
                <Text style={styles.cardPrice}>
                    {activeTab === 'food' ? `RM ${item.priceRange || '15-30'}` : `RM ${(parseFloat(item.ticketCost || 0) + parseFloat(item.transportCost || 0)).toFixed(2)}`}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Configure Default Header Title */}
                <Stack.Screen options={{ headerTitle: 'Explore' }} />

                {/* --- SEARCH SECTION --- */}
                <View style={styles.searchSection}>
                    <Text style={styles.sectionHeader}>Find your next adventure</Text>
                    
                    {/* Entertainment Input */}
                    <View style={[styles.searchBar, activeTab === 'entertainment' && styles.activeSearch]}>
                        <Ionicons name="ticket-outline" size={20} color={activeTab === 'entertainment' ? "#5A8AE4" : "#999"} />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search Entertainment..."
                            value={entSearch}
                            onChangeText={handleEntSearch}
                            onFocus={() => { setActiveTab('entertainment'); setDisplayList(entertainmentData); }}
                        />
                    </View>

                    {/* Food Input */}
                    <View style={[styles.searchBar, activeTab === 'food' && styles.activeSearch]}>
                        <Ionicons name="fast-food-outline" size={20} color={activeTab === 'food' ? "#5A8AE4" : "#999"} />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search Food..."
                            value={foodSearch}
                            onChangeText={handleFoodSearch}
                            onFocus={() => { setActiveTab('food'); setDisplayList(foodData); }}
                        />
                    </View>
                </View>

                {/* --- RESULTS LIST --- */}
                <View style={styles.resultsContainer}>
                    <View style={styles.listHeader}>
                        <Text style={styles.resultTitle}>
                            {activeTab === 'entertainment' ? 'Popular Attractions' : 'Local Delicacies'}
                        </Text>
                        <Text style={styles.resultCount}>{displayList.length} found</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#5A8AE4" style={{marginTop: 50}} />
                    ) : (
                        <FlatList
                            data={displayList}
                            renderItem={renderCard}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="search-outline" size={50} color="#DDD" />
                                    <Text style={styles.emptyText}>No results found.</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeSearch: {
        borderColor: '#5A8AE4',
        backgroundColor: '#F0F7FF',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
    },
    resultsContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    resultCount: {
        fontSize: 13,
        color: '#888',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 10,
    },
    cardPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#5A8AE4',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 15,
    },
});