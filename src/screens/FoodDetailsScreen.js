import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { addItemToPlan, createNewPlan, getFoodById, getUserPlans } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

const FoodDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    // 2. Destructure Hook
    const { t } = useLanguage();

    // Data State
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // New Plan Input State
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const result = await getFoodById(id); 
                setData(result); 
            } catch (error) {
                console.error("Error fetching food details:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetails();
    }, [id]);

    // --- MAP CLEANING SCRIPT ---
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

    // --- HELPER: CONVERT SAVED URL TO WEBVIEW URL ---
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

    // --- NAVIGATION HANDLER (Deep Link) ---
    const openNavigationApp = () => {
        const url = data?.locationURL;
        if (!url) {
            Alert.alert(t('alertNoLocation'), t('alertNoLocationMsg'));
            return;
        }

        let latLng = null;
        if (url.includes('q=')) {
            const match = url.match(/[?&]q=([^&]+)/);
            if (match && match[1]) {
                latLng = match[1]; 
            }
        }

        let targetUrl = url;

        if (latLng) {
            const label = encodeURIComponent(data.title || 'Food Spot');
            if (Platform.OS === 'ios') {
                targetUrl = `maps:0,0?q=${label}@${latLng}`;
            } else {
                targetUrl = `geo:0,0?q=${latLng}(${label})`;
            }
        } else {
            const query = encodeURIComponent(data.title || '');
            if (Platform.OS === 'ios') {
                targetUrl = `maps:0,0?q=${query}`;
            } else {
                targetUrl = `geo:0,0?q=${query}`;
            }
        }

        Linking.canOpenURL(targetUrl)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(targetUrl);
                } else {
                    console.log("Deep link not supported, opening web URL");
                    Linking.openURL(url);
                }
            })
            .catch((err) => {
                console.error("Map Error:", err);
                Linking.openURL(url);
            });
    };

    // --- ACTIONS ---
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF7C5E" />
            </View>
        );
    }

    if (!data) return <View style={styles.loadingContainer}><Text>Food Not Found</Text></View>;

    const bgImage = data.imageUrl || 'https://via.placeholder.com/400';
    const priceRange = data.priceRange || "RM 10 - RM 30"; 
    const transportPrice = parseFloat(data.transportCost) || 0;
    const estimatedExp = parseFloat(data.estimatedTotalExpenses) || 0;
    const rating = data.rating || 4.5;

    const previewUrl = getPreviewUrl(data.locationURL);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerTransparent: true, headerTitle: "", headerTintColor: "#FFF" }} />
            <StatusBar barStyle="light-content" />

            <View style={styles.imageContainer}>
                <Image source={{ uri: bgImage }} style={styles.heroImage} />
            </View>

            <View style={styles.sheetContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>{data.title}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={18} color="#FFD700" />
                            <Text style={styles.ratingText}>{rating} ({t('foodieRating')})</Text>
                        </View>
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

                    <View style={styles.divider} />

                    {/* === MAP SECTION === */}
                    <Text style={styles.sectionTitle}>{t('locationPreview')}</Text>
                    <View style={styles.mapContainer}>
                        {previewUrl ? (
                            <WebView
                                source={{ uri: previewUrl }}
                                style={styles.mapWebView}
                                nestedScrollEnabled={true}
                                showsUserLocation={false}
                                androidLayerType="hardware"
                                userAgent="Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0"
                                injectedJavaScript={mobileCleanScript}
                                originWhitelist={['*']}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                startInLoadingState={true}
                                renderLoading={() => (
                                    <View style={styles.loadingOverlay}>
                                        <ActivityIndicator color="#FF7C5E" />
                                    </View>
                                )}
                                onShouldStartLoadWithRequest={(request) => {
                                    const { url } = request;
                                    if (url.startsWith('http') || url.startsWith('https')) return true;
                                    return false;
                                }}
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
                    {/* ============================= */}

                    <View style={{ height: 140 }} />
                </ScrollView>
            </View>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.totalLabel}>{t('estimatedTotal')}</Text>
                    <Text style={styles.totalPrice}>RM {estimatedExp.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: '#FF7C5E' }]} onPress={handleAddToPlanClick}>
                    <Text style={styles.addButtonText}>{t('addToPlan')}</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL: ADD TO PLAN */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isCreatingPlan ? t('newTripName') : t('selectTrip')}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setModalVisible(false);
                                setIsCreatingPlan(false);
                            }}>
                                <Ionicons name="close" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {!isCreatingPlan && (
                            <>
                                {loadingPlans ? (
                                    <ActivityIndicator color="#FF7C5E" style={{ margin: 20 }} />
                                ) : (
                                    <View style={{ maxHeight: 300 }}>
                                        <FlatList
                                            data={plans}
                                            keyExtractor={item => item.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.planItem}
                                                    onPress={() => handleSelectItem(item)}
                                                >
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
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('placeholderPlanName')}
                                    value={newPlanName}
                                    onChangeText={setNewPlanName}
                                    autoFocus
                                />
                                <View style={styles.modalActionRow}>
                                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#f0f0f0' }]} onPress={() => setIsCreatingPlan(false)}>
                                        <Text style={{ color: '#666' }}>{t('back')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF7C5E' }]} onPress={handleCreatePlan}>
                                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('createAndAdd')}</Text>
                                    </TouchableOpacity>
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
    sheetContainer: { flex: 1, marginTop: height * 0.35, backgroundColor: '#FFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, elevation: 10 },
    scrollContent: { paddingHorizontal: 25, paddingTop: 35 },
    headerSection: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { marginLeft: 5, fontSize: 15, color: '#666' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    descriptionText: { fontSize: 16, color: '#666', lineHeight: 26 },
    costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    costLabel: { fontSize: 17, color: '#333' },
    costValue: { fontSize: 17, fontWeight: 'bold' },

    // === MAP STYLES ===
    mapContainer: {
        width: '100%',
        height: 450, 
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 10,
        position: 'relative',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#EEE'
    },
    mapWebView: {
        flex: 1,
        backgroundColor: 'transparent',
        opacity: 0.99
    },
    navigateFab: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#FF7C5E', 
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 5,
        zIndex: 999
    },
    navigateFabText: { color: '#FFF', marginLeft: 5, fontSize: 12, fontWeight: 'bold' },
    noMapContainer: { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12 },
    noMapText: { marginTop: 5, color: '#999', fontSize: 12 },
    loadingOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0'
    },

    bottomBar: { 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        height: 120, 
        backgroundColor: '#FFF', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 30, 
        paddingBottom: 20, 
        borderTopWidth: 1, 
        borderColor: '#F0F0F0', 
        elevation: 20 
    },
    totalLabel: { 
        fontSize: 14, 
        color: '#888', 
        textTransform: 'uppercase',
        maxWidth: '90%'
    },
    totalPrice: { 
        fontSize: 28, 
        fontWeight: '800', 
        color: '#FF7C5E',
    },
    // --- DYNAMIC BUTTON STYLES ---
    addButton: { 
        paddingVertical: 18, 
        paddingHorizontal: 20, // Reduced from 32
        minWidth: 160,         // Added minWidth for English
        borderRadius: 20, 
        elevation: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },
    addButtonText: { 
        color: '#FFF', 
        fontSize: 17,          // Reduced from 18
        fontWeight: 'bold',
        textAlign: 'center'
    },
    
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