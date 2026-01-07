import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { getFavorites } from '../services/AuthService';

export default function FavoritesScreen() {
    const router = useRouter();
    const { t } = useLanguage();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        setLoading(true);
        const data = await getFavorites();
        setFavorites(data);
        setLoading(false);
    };

    const handlePress = (item) => {
        // Navigate based on type
        if (item.type === 'food') {
            router.push({ pathname: '/food-details', params: { id: item.id } });
        } else if (item.type === 'entertainment') {
            router.push({ pathname: '/entertainment-details', params: { id: item.id } });
        } else if (item.type === 'plan') {
            router.push({ pathname: '/planDetails', params: { id: item.id } });
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
                <View style={styles.row}>
                    <Text style={styles.typeBadge}>{item.type?.toUpperCase()}</Text>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.ratingText}>{item.rating || 'N/A'}</Text>
                    </View>
                </View>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>
                    {item.type === 'plan' ? 'Est. ' : ''}RM {item.price ? parseFloat(item.price).toFixed(2) : '0.00'}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" style={{ marginRight: 10 }} />
        </TouchableOpacity>
    );

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#648DDB" /></View>;

    return (
        <View style={styles.container}>
            <FlatList
                data={favorites}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-dislike-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No favorites yet.</Text>
                        <Text style={styles.emptySub}>Go explore and save items you like!</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9F9F9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 15, padding: 10, marginBottom: 15, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    image: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#EEE' },
    info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, paddingRight: 10 },
    typeBadge: { fontSize: 10, color: '#648DDB', fontWeight: 'bold', backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 12, color: '#555', marginLeft: 4 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
    price: { fontSize: 14, color: '#666', fontWeight: '500' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#999', marginTop: 10 },
    emptySub: { fontSize: 14, color: '#BBB', marginTop: 5 }
});