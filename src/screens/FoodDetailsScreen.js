import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

import { useLanguage } from '../context/LanguageContext';
import {
    addItemToPlan,
    checkFavoriteStatus,
    createNewPlan,
    getCurrentUserData,
    getFoodById,
    getUserPlans,
    toggleFavorite
} from '../services/AuthService';

const { width, height } = Dimensions.get('window');

const FoodDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { t } = useLanguage();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    
    // --- Role States ---
    const [isTraveller, setIsTraveller] = useState(false);
    const [isAgency, setIsAgency] = useState(false);

    // --- 1. Use Focus Effect for Data Refresh ---
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const fetchDetails = async () => {
                try {
                    // Check User Role
                    const user = await getCurrentUserData();
                    if (isActive) {
                        setIsTraveller(user?.role === 'traveller');
                        setIsAgency(user?.role === 'agency');
                    }

                    if (id) {
                        const result = await getFoodById(id); 
                        const status = await checkFavoriteStatus(id);
                        
                        if (isActive) {
                            setData(result);
                            setIsFavorite(status);
                            setLoading(false);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching food details:", error);
                    if (isActive) setLoading(false);
                }
            };

            fetchDetails();

            return () => {
                isActive = false;
            };
        }, [id])
    );

    // --- 2. Edit Handler ---
    const handleEdit = () => {
        router.push({
            pathname: '/agency-edit-food',
            params: { id: data.id }
        });
    };

    const handleToggleFavorite = async () => {
        if (!data) return;
        const itemToSave = {
            id: data.id,
            title: data.title,
            image: data.imageUrl,
            price: parseFloat(data.estimatedTotalExpenses) || parseFloat(data.price) || 0,
            type: 'food',
            rating: data.rating,
            locationURL: data.locationURL || ""
        };
        try {
            const newStatus = await toggleFavorite(itemToSave);
            setIsFavorite(newStatus);
        } catch (error) {
            Alert.alert(t('alertErrorTitle'), "Please login to save favorites.");
        }
    };

    // --- MAP SCRIPT ---
    const mobileCleanScript = `
      (function() {
        function hideJunk() {
            var css = \`
                .app-view-header, header, .ml-searchbox-landing-omnibox-container, .searchbox-hamburger-container { display: none !important; opacity: 0 !important; }
                .place-card-large, .place-card, .bottom-panel, .scene-footer, .QU77pf, .k69vge, .bJzME, .h169D { display: none !important; opacity: 0 !important; }
                .ml-promotion-container, .mobile-promotion-container, .promotional-footer, .upsell-container { display: none !important; opacity: 0 !important; }
                .gb_gd, .gb_T, .gb_zd { display: none !important; opacity: 0 !important; }
            \`;
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            head.appendChild(style);
            var bottomCards = document.querySelectorAll('div[role="dialog"], div[aria-label^="Place"], #bottom-pane');
            bottomCards.forEach(el => el.style.display = 'none');
        }
        hideJunk();
        setInterval(hideJunk, 500);
      })();
      true;
    `;

    const getPreviewUrl = (savedUrl) => {
        if (!savedUrl) return null;
        if (savedUrl.includes('q=')) {
            const match = savedUrl.match(/[?&]q=([^&]+)/);
            if (match && match[1]) {
                return `https://www.google.com/maps/search/?api=1&query=${match[1]}`;
            }
        }
        return savedUrl;
    };

    const openNavigationApp = () => {
        const url = data?.locationURL;
        if (!url) {
            Alert.alert(t('alertNoLocation'), t('alertNoLocationMsg'));
            return;
        }
        let latLng = null;
        if (url.includes('q=')) {
            const match = url.match(/[?&]q=([^&]+)/);
            if (match && match[1]) latLng = match[1]; 
        }
        let targetUrl = url;
        if (latLng) {
            const label = encodeURIComponent(data.title || 'Food Spot');
            if (Platform.OS === 'ios') targetUrl = `maps:0,0?q=${label}@${latLng}`;
            else targetUrl = `geo:0,0?q=${latLng}(${label})`;
        } else {
            const query = encodeURIComponent(data.title || '');
            if (Platform.OS === 'ios') targetUrl = `maps:0,0?q=${query}`;
            else targetUrl = `geo:0,0?q=${query}`;
        }
        Linking.canOpenURL(targetUrl).then((supported) => {
            if (supported) Linking.openURL(targetUrl);
            else Linking.openURL(url);
        }).catch((err) => Linking.openURL(url));
    };

    const handleAddToPlanClick = async () => {
        setModalVisible(true);
        setLoadingPlans(true);
        try {
            const userPlans = await getUserPlans();
            setPlans(userPlans);
        } catch (error) {
            Alert.alert(t('alertErrorTitle'), t('alertFetchPlanFail'));
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) {
            Alert.alert(t('alertRequiredTitle'), t('alertTripNameReq'));
            return;
        }
        try {
            const newPlanId = await createNewPlan(newPlanName);
            await handleSelectItem({ id: newPlanId, planName: newPlanName });
        } catch (error) {
            Alert.alert(t('alertErrorTitle'), t('alertCreateFail'));
        }
    };

    const handleSelectItem = async (plan) => {
        try {
            const itemToSave = {
                id: data.id,
                title: data.title,
                price: parseFloat(data.estimatedTotalExpenses) || parseFloat(data.price) || 0, 
                imageUrl: data.imageUrl,
                type: 'food',
                locationURL: data.locationURL || "" 
            };
            await addItemToPlan(plan.id, itemToSave);
            setModalVisible(false);
            setNewPlanName('');
            setIsCreatingPlan(false);
            Alert.alert(t('alertSuccessTitle'), `${t('alertAddedTo')} ${plan.planName}!`);
        } catch (error) {
            Alert.alert(t('alertErrorTitle'), t('alertAddToPlanFail'));
        }
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF7C5E" /></View>;
    if (!data) return <View style={styles.loadingContainer}><Text>Food Not Found</Text></View>;

    const bgImage = data.imageUrl || 'https://via.placeholder.com/400';
    const priceRange = data.priceRange || "RM 10 - RM 30"; 
    const transportPrice = parseFloat(data.transportCost) || 0;
    const estimatedExp = parseFloat(data.estimatedTotalExpenses) || 0;
    const rating = data.rating || 4.5;
    const previewUrl = getPreviewUrl(data.locationURL);

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{ 
                    headerTransparent: true, 
                    headerTitle: "", 
                    headerTintColor: "#FFF",
                    headerRight: () => isTraveller ? (
                        <TouchableOpacity 
                            style={styles.favButtonHeader} 
                            onPress={handleToggleFavorite}
                        >
                            <Ionicons 
                                name={isFavorite ? "heart" : "heart-outline"} 
                                size={26} 
                                color={isFavorite ? "#FF3B30" : "#FFF"} 
                            />
                        </TouchableOpacity>
                    ) : null
                }} 
            />
            <StatusBar barStyle="light-content" />

            <View style={styles.imageContainer}>
                <Image source={{ uri: bgImage }} style={styles.heroImage} />
            </View>

            <View style={styles.sheetContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* --- HEADER SECTION --- */}
                    <View style={styles.headerSection}>
                        <View style={{flex: 1, marginRight: 10}}>
                            <Text style={styles.title}>{data.title}</Text>
                        </View>
                        
                        {/* --- 3. Edit Button for Agencies --- */}
                        {isAgency && (
                            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                                <Ionicons name="create-outline" size={26} color="#333" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={18} color="#FFD700" />
                        <Text style={styles.ratingText}>{rating} ({t('foodieRating')})</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>{t('aboutSpot')}</Text>
                    <Text style={styles.descriptionText}>{data.description}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>{t('estimatedCosts')}</Text>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>{t('priceRange')}</Text>
                        <Text style={styles.costValue}>{priceRange}</Text>
                    </View>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>{t('transport')} ({data.suggestedTransport || 'Grab'})</Text>
                        <Text style={styles.costValue}>RM {transportPrice.toFixed(2)}</Text>
                    </View>
                    {/* Disclaimer Text */}
                    <Text style={styles.noteText}>
                        * Transport fee estimated assuming departure from the same state (e.g. Penang).
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>{t('locationPreview')}</Text>
                    <View style={styles.mapContainer}>
                        {previewUrl ? (
                            <WebView
                                source={{ uri: previewUrl }}
                                style={styles.mapWebView}
                                nestedScrollEnabled={true}
                                showsUserLocation={false}
                                injectedJavaScript={mobileCleanScript}
                                startInLoadingState={true}
                                renderLoading={() => <View style={styles.loadingOverlay}><ActivityIndicator color="#FF7C5E" /></View>}
                            />
                        ) : (
                            <View style={styles.noMapContainer}>
                                <Ionicons name="map-outline" size={30} color="#ccc" />
                                <Text style={styles.noMapText}>{t('noMap')}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.navigateFab} onPress={openNavigationApp}>
                            <Ionicons name="navigate" size={20} color="#FFF" />
                            <Text style={styles.navigateFabText}>{t('go')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 140 }} />
                </ScrollView>
            </View>

            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.totalLabel}>{t('estimatedTotal')}</Text>
                    <Text style={styles.totalPrice}>RM {estimatedExp.toFixed(2)}</Text>
                </View>
                {/* Conditional Rendering for Add Button */}
                {isTraveller && (
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: '#FF7C5E' }]} onPress={handleAddToPlanClick}>
                        <Text style={styles.addButtonText}>{t('addToPlan')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{isCreatingPlan ? t('newTripName') : t('selectTrip')}</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setIsCreatingPlan(false); }}>
                                <Ionicons name="close" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        {!isCreatingPlan && (
                            <>
                                {loadingPlans ? <ActivityIndicator color="#FF7C5E" style={{ margin: 20 }} /> : (
                                    <View style={{ maxHeight: 300 }}>
                                        <FlatList
                                            data={plans}
                                            keyExtractor={item => item.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity style={styles.planItem} onPress={() => handleSelectItem(item)}>
                                                    <View style={[styles.planIcon, { backgroundColor: '#FFF0ED' }]}>
                                                        <Ionicons name="restaurant" size={20} color="#FF7C5E" />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.planName}>{item.planName}</Text>
                                                        <Text style={styles.planSub}>{item.items?.length || 0} {t('itemsCount')}</Text>
                                                    </View>
                                                    <Ionicons name="add-circle-outline" size={24} color="#FF7C5E" style={{ marginLeft: 'auto' }} />
                                                </TouchableOpacity>
                                            )}
                                            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', margin: 20 }}>{t('noActivePlans')}</Text>}
                                        />
                                    </View>
                                )}
                                <TouchableOpacity style={styles.createPlanBtn} onPress={() => setIsCreatingPlan(true)}>
                                    <Ionicons name="add" size={20} color="#FFF" />
                                    <Text style={styles.createPlanText}>{t('createNewPlan')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {isCreatingPlan && (
                            <View style={{ width: '100%' }}>
                                <TextInput style={styles.input} placeholder={t('placeholderPlanName')} value={newPlanName} onChangeText={setNewPlanName} autoFocus />
                                <View style={styles.modalActionRow}>
                                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsCreatingPlan(false)}><Text style={{ color: '#666' }}>{t('back')}</Text></TouchableOpacity>
                                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF7C5E' }]} onPress={handleCreatePlan}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('createAndAdd')}</Text></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageContainer: { height: height * 0.5, width: '100%', position: 'absolute', top: 0 },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    
    favButtonHeader: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 6,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },

    sheetContainer: { flex: 1, marginTop: height * 0.35, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 10 },
    scrollContent: { paddingHorizontal: 25, paddingTop: 35 },
    
    // Updated Header Section Layout
    headerSection: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 5 
    },
    title: { fontSize: 28, fontWeight: 'bold', flexShrink: 1 },
    
    // Edit Button Style
    editButton: {
        padding: 5,
        backgroundColor: '#F2F2F2',
        borderRadius: 20,
    },

    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, // Increased margin bottom since it's separated now
    ratingText: { marginLeft: 5, fontSize: 15, color: '#666' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    descriptionText: { fontSize: 16, color: '#666', lineHeight: 26 },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    costLabel: { fontSize: 17, color: '#333' },
    costValue: { fontSize: 17, fontWeight: 'bold' },
    
    noteText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 5 },

    mapContainer: { width: '100%', height: 450, borderRadius: 20, overflow: 'hidden', marginBottom: 10, position: 'relative', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#EEE' },
    mapWebView: { flex: 1, backgroundColor: 'transparent', opacity: 0.99 },
    navigateFab: { position: 'absolute', bottom: 10, right: 10, backgroundColor: '#FF7C5E', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', elevation: 5, zIndex: 999 },
    navigateFabText: { color: '#FFF', marginLeft: 5, fontSize: 12, fontWeight: 'bold' },
    noMapContainer: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
    noMapText: { marginTop: 5, color: '#999', fontSize: 12 },
    loadingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 120, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 20, borderTopWidth: 1, borderColor: '#F0F0F0', elevation: 20 },
    totalLabel: { fontSize: 14, color: '#888', textTransform: 'uppercase', maxWidth: '90%' },
    totalPrice: { fontSize: 28, fontWeight: '800', color: '#FF7C5E' },
    addButton: { paddingVertical: 18, paddingHorizontal: 20, minWidth: 160, borderRadius: 20, elevation: 5, justifyContent: 'center', alignItems: 'center' },
    addButtonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: 300 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    planItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    planIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    planName: { fontSize: 16, fontWeight: '600', color: '#333' },
    planSub: { fontSize: 12, color: '#888' },
    createPlanBtn: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 15, borderRadius: 12 },
    createPlanText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
    input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 20 },
    modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 }
});

export default FoodDetailsScreen;