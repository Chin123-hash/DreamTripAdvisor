// src/screens/AgencyEntertainmentDetailsScreen.js

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
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { getEntertainmentById } from '../services/AuthService';

const { width } = Dimensions.get('window');

const AgencyEntertainmentDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                if (id) {
                    const result = await getEntertainmentById(id);
                    setItem(result);
                }
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const openNavigationApp = () => {
        if (item?.locationURL) {
            Linking.openURL(item.locationURL).catch(() => {
                Alert.alert('Error', 'Could not open map application.');
            });
        } else {
            Alert.alert('No Location', 'No location link provided.');
        }
    };

    // =================================================================
    // 🧹 VISUAL CLEANUP & ZOOM SCRIPT 🧹
    // 1. Hides search bars/footers
    // 2. Zooms out to 85% to show more map area
    // =================================================================
    const mobileCleanScript = `
      (function() {
        var style = document.createElement('style');
        style.innerHTML = \`
          .app-view-header, header, .ml-searchbox-landing-omnibox-container, .searchbox-hamburger-container { display: none !important; }
          .scene-footer, .place-card-large, .bottom-panel, #bottom-pane, .quick-actions-container { display: none !important; }
          .ml-promotion-container, .mobile-promotion-container, .promotional-footer, .upsell-container, div[role="dialog"] { display: none !important; }
          .gb_gd, .gb_T { display: none !important; }
          html, body, #app-container, #content-container { height: 100% !important; width: 100% !important; background-color: white; }
        \`;
        document.head.appendChild(style);

        // OPTIONAL: Zoom out slightly to show more content
        try {
            document.body.style.zoom = '0.85';
        } catch(e) {}
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
                <Text style={styles.errorText}>Entertainment details not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                    <Text style={{ color: '#A58383' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: true, title: item.title }} />
            <StatusBar barStyle="dark-content" />

            <ImageBackground
                source={{ uri: item.imageUrl }}
                style={StyleSheet.absoluteFillObject}
                blurRadius={20}
            >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />

                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: item.imageUrl }} style={styles.mainImage} />
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                                <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '0.0'}</Text>
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.cardLabel}>Activity Details</Text>

                            <View style={styles.dataRow}>
                                <Ionicons name="bus-outline" size={20} color="#666" />
                                <View style={styles.dataTextGroup}>
                                    <Text style={styles.dataTitle}>Suggested Transport</Text>
                                    <Text style={styles.dataValue}>
                                        {item.suggestedTransport} (RM {item.transportCost?.toFixed(2)})
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            {/* --- MAP SECTION --- */}
                            <Text style={[styles.dataTitle, { marginBottom: 10 }]}>Location Preview</Text>

                            <View style={styles.mapContainer}>
                                {item.locationURL ? (
                                    <WebView
                                        source={{ uri: item.locationURL }}
                                        style={styles.mapWebView}
                                        nestedScrollEnabled={true}
                                        showsUserLocation={false}
                                        
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
                                        <Text style={styles.noMapText}>No location map available</Text>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.navigateFab} onPress={openNavigationApp}>
                                    <Ionicons name="navigate" size={20} color="#FFF" />
                                    <Text style={styles.navigateFabText}>Go</Text>
                                </TouchableOpacity>
                            </View>
                            {/* ------------------------ */}

                            <View style={styles.divider} />

                            <View style={styles.descriptionSection}>
                                <Text style={styles.descriptionLabel}>About this activity</Text>
                                <Text style={styles.descriptionText}>
                                    {item.description || 'No additional details provided.'}
                                </Text>
                            </View>

                            <View style={styles.footerRow}>
                                <Text style={styles.totalLabel}>Estimated Total Cost</Text>
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
    header: { height: 50, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { alignItems: 'center', paddingBottom: 40 },
    imageWrapper: { marginVertical: 25, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 12 },
    mainImage: { width: width * 0.8, height: width * 0.8, borderRadius: 30 },
    ratingBadge: { position: 'absolute', bottom: -10, right: 20, backgroundColor: '#FFF', flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    infoCard: { width: '90%', backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
    dataRow: { flexDirection: 'row', marginBottom: 15 },
    dataTextGroup: { marginLeft: 12 },
    dataTitle: { fontSize: 13, color: '#888', fontWeight: '600' },
    dataValue: { fontSize: 15, color: '#444' },
    divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
    
    // Map Styles - UPDATED HEIGHT
    mapContainer: {
        width: '100%',
        height: 450, // INCREASED HEIGHT from 250 to 450
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
        backgroundColor: 'transparent'
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

    descriptionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    descriptionText: { fontSize: 14, color: '#555', lineHeight: 22 },
    footerRow: { marginTop: 20, alignItems: 'flex-end' },
    totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#E35D5D' },
    errorText: { fontSize: 16, color: '#666' },
    backLink: { marginTop: 15 }
});

export default AgencyEntertainmentDetailsScreen;