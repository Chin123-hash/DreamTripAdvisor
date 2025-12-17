import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
// Re-using your existing service function
import { getFoodById } from '../services/AuthService';

const { width } = Dimensions.get('window');

const AgencyFoodDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); 
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (id) {
                    // Fetching directly from 'foods' collection as per your AuthService
                    const result = await getFoodById(id);
                    setItem(result);
                }
            } catch (error) {
                console.error("Error fetching food details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#A58383" />
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.loaderContainer}>
                <Text style={styles.errorText}>Food details not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                    <Text style={{color: '#A58383'}}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: true }} />
            <StatusBar barStyle="dark-content" />

            {/* Blurred Dynamic Background */}
            <ImageBackground
                source={{ uri: item.imageUrl }}
                style={StyleSheet.absoluteFillObject}
                blurRadius={20}
            >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />

                <SafeAreaView style={styles.safeArea}>
                    {/* HEADER */}
                    <View style={styles.header}>
                       
                        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={{ width: 45 }} /> 
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* MAIN IMAGE */}
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: item.imageUrl }} style={styles.mainImage} />
                            {/* Rating Badge (from your rating field) */}
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
                            </View>
                        </View>

                        {/* DATA CARD */}
                        <View style={styles.infoCard}>
                            <Text style={styles.cardLabel}>Dining Details</Text>
                            
                            <View style={styles.dataRow}>
                                <Ionicons name="pricetag-outline" size={20} color="#666" />
                                <Text style={styles.dataValue}>Price Range: {item.priceRange}</Text>
                            </View>

                            <View style={styles.dataRow}>
                                <Ionicons name="bus-outline" size={20} color="#666" />
                                <Text style={styles.dataValue}>
                                    Transport: {item.suggestedTransport} (RM {item.transportCost?.toFixed(2)})
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.descriptionLabel}>Description</Text>
                            <Text style={styles.descriptionText}>{item.description}</Text>

                            <View style={styles.footerRow}>
                                <Text style={styles.totalLabel}>Est. Total Expenses</Text>
                                <Text style={styles.totalAmount}>RM {item.estimatedTotalExpenses?.toFixed(2)}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
    safeArea: { flex: 1 },
    header: {
        height: 50, // Set a fixed height for your header
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Important: aligns content to center
        paddingHorizontal: 20,
        position: 'relative', // Needed for the absolute child
        
      },
      headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        // === The Magic Part ===
        position: 'absolute', // Takes the title out of the flow
        left: 0,
        right: 0, // left 0 + right 0 stretches it across the screen
       
      },
    circleButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    scrollContent: { alignItems: 'center', paddingBottom: 40 },
    imageWrapper: {
        marginVertical: 25,
        position: 'relative',
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    mainImage: { width: width * 0.8, height: width * 0.8, borderRadius: 30 },
    ratingBadge: {
        position: 'absolute',
        bottom: -10,
        right: 20,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 5,
    },
    ratingText: { marginLeft: 5, fontWeight: 'bold', fontSize: 14 },
    infoCard: {
        width: '90%',
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    cardLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    dataValue: { marginLeft: 10, fontSize: 15, color: '#444' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
    descriptionLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    descriptionText: { fontSize: 14, color: '#666', lineHeight: 22 },
    footerRow: { 
        marginTop: 25, 
        borderTopWidth: 1, 
        borderTopColor: '#F0F0F0', 
        paddingTop: 15,
        alignItems: 'flex-end'
    },
    totalLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase' },
    totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#E35D5D' },
    errorText: { fontSize: 16, color: '#666' },
    backLink: { marginTop: 15 }
});

export default AgencyFoodDetailsScreen;