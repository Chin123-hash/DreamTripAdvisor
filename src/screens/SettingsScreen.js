// src/screens/SettingsScreen.js

import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext'; // <--- Import

export default function SettingsScreen() {
    const router = useRouter();

    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // 1. Get t() and language state from context
    const { language, setLanguage, t } = useLanguage(); 

    const toggleLanguage = (value) => {
        setLanguage(value ? 'ms' : 'en'); // Switch between Malay and English
    };

    const handleDarkMode = (value) => {
        setIsDarkMode(value);
        Alert.alert(
            "Dark Mode", 
            value ? "Dark Mode Enabled" : "Light Mode Enabled"
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            t('clearCache'), // Translated Title
            "Are you sure you want to delete all cached data?",
            [
                { text: t('cancel'), style: "cancel" }, // Translated Button
                { 
                    text: t('clear'), // Translated Button
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const cacheDir = FileSystem.cacheDirectory;
                            const files = await FileSystem.readDirectoryAsync(cacheDir);
                            
                            const deletePromises = files.map(file => 
                                FileSystem.deleteAsync(cacheDir + file, { idempotent: true })
                            );
                            
                            await Promise.all(deletePromises);

                            Alert.alert("Success", "Cache has been cleared.");
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Failed to clear cache.");
                        }
                    } 
                }
            ]
        );
    };

    // --- REUSABLE ROW COMPONENT ---
    const SettingItem = ({ icon, color, title, onPress, value, isSwitch = false }) => (
        <TouchableOpacity 
            style={[styles.row, isDarkMode && styles.darkRow]} 
            onPress={isSwitch ? null : onPress} 
            activeOpacity={isSwitch ? 1 : 0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: color }]}>
                <Ionicons name={icon} size={20} color="#FFF" />
            </View>
            <Text style={[styles.rowTitle, isDarkMode && styles.darkText]}>{title}</Text>
            
            {isSwitch ? (
                <Switch
                    trackColor={{ false: "#E0E0E0", true: "#AECBFA" }}
                    thumbColor={value ? "#5A8AE4" : "#f4f3f4"}
                    onValueChange={onPress}
                    value={value}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#666" : "#CCC"} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
            
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* --- ACCOUNT SECTION --- */}
                <Text style={styles.sectionHeader}>{t('account')}</Text> 
                <View style={[styles.section, isDarkMode && styles.darkSection]}>
                    <SettingItem 
                        icon="person" 
                        color="#5A8AE4" 
                        title={t('editProfile')} // <--- Translated
                        onPress={() => router.push('/profile')}
                    />
                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
                    <SettingItem 
                        icon="lock-closed" 
                        color="#FF3B30" 
                        title={t('changePass')} // <--- Translated
                        onPress={() => router.push('/forgot-password')}
                    />
                </View>

                {/* --- LANGUAGE SECTION (NEW) --- */}
                <Text style={styles.sectionHeader}>{t('language')}</Text>
                <View style={[styles.section, isDarkMode && styles.darkSection]}>
                    <SettingItem 
                        icon="language" 
                        color="#FF9500" 
                        title="Bahasa Melayu" 
                        isSwitch={true}
                        value={language === 'ms'} // Check if current language is Malay
                        onPress={toggleLanguage}
                    />
                </View>

                {/* --- SUPPORT SECTION --- */}
                <Text style={styles.sectionHeader}>{t('support')}</Text>
                <View style={[styles.section, isDarkMode && styles.darkSection]}>
                    <SettingItem 
                        icon="trash" 
                        color="#8E8E93" 
                        title={t('clearCache')} // <--- Translated
                        onPress={handleClearCache}
                    />
                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
                    <SettingItem 
                        icon="document-text" 
                        color="#34C759" 
                        title={t('terms')} // <--- Translated
                        onPress={() => Alert.alert("Info", "Terms of Service placeholder.")}
                    />
                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
                    <SettingItem 
                        icon="information-circle" 
                        color="#007AFF" 
                        title={t('about')} // <--- Translated
                        onPress={() => Alert.alert("Dream Trip Advisor", "Version 1.0.0\nDeveloped for MPU32013.")}
                    />
                </View>

                <Text style={styles.footerText}>Version 1.0.0 (Build 2025)</Text>
                <View style={{height: 50}} />
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    darkContainer: { backgroundColor: '#000' }, 

    sectionHeader: {
        fontSize: 13,
        color: '#6D6D72',
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 30, 
        marginLeft: 20,
        textTransform: 'uppercase'
    },
    
    section: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E1E1E1',
        paddingLeft: 20,
    },
    darkSection: {
        backgroundColor: '#1C1C1E', 
        borderColor: '#333',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingRight: 20,
    },
    darkRow: {
        backgroundColor: '#1C1C1E',
    },

    iconBox: {
        width: 30,
        height: 30,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    
    rowTitle: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
    darkText: {
        color: '#FFF',
    },

    divider: {
        height: 1,
        backgroundColor: '#E1E1E1',
        marginLeft: 45, 
    },
    darkDivider: {
        backgroundColor: '#38383A',
    },

    footerText: {
        textAlign: 'center',
        color: '#8E8E93',
        marginTop: 20,
        fontSize: 13,
    }
});