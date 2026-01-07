import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageBackground,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { getFoodById } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const AgencyFoodDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams(); 
    // 2. Destructure Hook
    const { t } = useLanguage();
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (id) {
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

    const openNavigationApp = () => {
        if (item?.locationURL) {
            Linking.openURL(item.locationURL).catch(() => {
                Alert.alert(t('alertErrorTitle'), t('errorMapApp'));
            });
        } else {
            Alert.alert(t('noLocationTitle'), t('noLocationMsg'));
        }
    };

    // =================================================================
    // 🧹 AGGRESSIVE CLEANING SCRIPT 🧹
    // =================================================================
    const mobileCleanScript = `
      (function() {
        function hideJunk() {
            var css = \`
                /* Hide Top Bar & Search */
                .app-view-header, header, .ml-searchbox-landing-omnibox-container, .searchbox-hamburger-container { display: none !important; opacity: 0 !important; }
                
                /* Hide Bottom White Card & Footer */
                .place-card-large, .place-card, .bottom-panel, .scene-footer, .QU77pf, .k69vge, .bJzME, .h169D { display: none !important; opacity: 0 !important; }
                
                /* Hide "Open App" Button */
                .ml-promotion-container, .mobile-promotion-container, .promotional-footer, .upsell-container { display: none !important; opacity: 0 !important; }
                
                /* Hide Google Login/Account Icons */
                .gb_gd, .gb_T, .gb_zd { display: none !important; opacity: 0 !important; }
            \`;
            
            var head = document.head || document.getElementsByTagName('head')[0];
            var style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            head.appendChild(style);
        }

        // Run immediately and repeatedly to catch late loaders
        hideJunk();
        setInterval(hideJunk, 500);
      })();
      true;
    `;

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
                <Text style={styles.errorText}>{t('foodNotFound')}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                    <Text style={{color: '#A58383'}}>{t('goBack')}</Text>
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
                            {/* Rating Badge */}
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
                            </View>
                        </View>

                        {/* DATA CARD */}
                        <View style={styles.infoCard}>
                            <Text style={styles.cardLabel}>{t('diningDetails')}</Text>
                            
                            <View style={styles.dataRow}>
                                <Ionicons name="pricetag-outline" size={20} color="#666" />
                                <Text style={styles.dataValue}>{t('priceRangeLabel')} {item.priceRange}</Text>
                            </View>

                            <View style={styles.dataRow}>
                                <Ionicons name="bus-outline" size={20} color="#666" />
                                <Text style={styles.dataValue}>
                                    {t('transportLabel')} {item.suggestedTransport} (RM {item.transportCost?.toFixed(2)})
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            {/* --- MAP SECTION --- */}
                            <Text style={[styles.cardLabel, {fontSize: 14, marginBottom: 10, color: '#888'}]}>{t('locationPreview')}</Text>

                            <View style={styles.mapContainer}>
                                {item.locationURL ? (
                                    <WebView
                                        source={{ uri: item.locationURL }}
                                        style={styles.mapWebView}
                                        nestedScrollEnabled={true}
                                        showsUserLocation={false}
                                        // Hardware acceleration for Android
                                        androidLayerType="hardware"
                                        // Mobile UserAgent
                                        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0"
                                        
                                        injectedJavaScript={mobileCleanScript}
                                        
                                        originWhitelist={['*']}
                                        javaScriptEnabled={true}
                                        domStorageEnabled={true}
                                        setSupportMultipleWindows={false}
                                        startInLoadingState={true}
                                        renderLoading={() => (
                                            <View style={styles.loadingOverlay}>
                                                <ActivityIndicator color="#648DDB" />
                                                <Text style={styles.loadingText}>Loading Map...</Text>
                                            </View>
                                        )}
                                        // Block Intent Redirections
                                        onShouldStartLoadWithRequest={(request) => {
                                            const { url } = request;
                                            if (url.startsWith('intent:') || url.startsWith('intent://')) return false; 
                                            if (url.startsWith('http:') || url.startsWith('https:')) return true;
                                            return false;
                                        }}
                                        onError={(syntheticEvent) => {
                                            const { nativeEvent } = syntheticEvent;
                                            console.warn('WebView error: ', nativeEvent);
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
                            {/* ------------------------ */}

                            <View style={styles.divider} />

                            <Text style={styles.descriptionLabel}>{t('labelDescription')}</Text>
                            <Text style={styles.descriptionText}>{item.description}</Text>

                            <View style={styles.footerRow}>
                                <Text style={styles.totalLabel}>{t('estTotalRM')}</Text>
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
    backLink: { marginTop: 15 },

    // --- MAP STYLES ---
    mapContainer: {
        width: '100%',
        height: 450, // Height fixed to match request
        borderRadius: 12,
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
        backgroundColor: '#4285F4',
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
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5'
    },
    loadingText: { fontSize: 10, color: '#999', marginTop: 5 },
});

export default AgencyFoodDetailsScreen;