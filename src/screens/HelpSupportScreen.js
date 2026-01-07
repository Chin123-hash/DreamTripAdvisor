import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    LayoutAnimation,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HelpSupportScreen() {
    const router = useRouter();
    // 2. Destructure Hook
    const { t } = useLanguage();
    const [expandedSection, setExpandedSection] = useState(null);

    // --- CONSTRUCT LOCALIZED DATA ---
    const FAQ_DATA = [
        {
            category: t('catTravelers'),
            items: [
                { question: t('qCancel'), answer: t('aCancel') },
                { question: t('qItinerary'), answer: t('aItinerary') },
                { question: t('qRate'), answer: t('aRate') },
            ]
        },
        {
            category: t('catAgencies'),
            items: [
                { question: t('qVerify'), answer: t('aVerify') },
                { question: t('qRevenue'), answer: t('aRevenue') },
            ]
        },
        {
            category: t('catAccount'),
            items: [
                { question: t('qForgotPass'), answer: t('aForgotPass') },
                { question: t('qContact'), answer: t('aContact') },
            ]
        }
    ];

    const toggleExpand = (catIndex, itemIndex) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedSection?.catIndex === catIndex && expandedSection?.itemIndex === itemIndex) {
            setExpandedSection(null); // Collapse if already open
        } else {
            setExpandedSection({ catIndex, itemIndex });
        }
    };

    const handleEmailSupport = () => {
        Linking.openURL('mailto:a201951@siswa.ukm.edu.my?subject=Support Request');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+60183140197');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('helpSupport')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Intro Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>{t('helpHeroTitle')}</Text>
                    <Text style={styles.heroSub}>{t('helpHeroSub')}</Text>
                </View>

                {/* FAQ Section */}
                {FAQ_DATA.map((section, catIndex) => (
                    <View key={catIndex} style={styles.sectionContainer}>
                        <Text style={styles.sectionHeader}>{section.category}</Text>
                        {section.items.map((item, itemIndex) => {
                            const isOpen = expandedSection?.catIndex === catIndex && expandedSection?.itemIndex === itemIndex;
                            return (
                                <TouchableOpacity 
                                    key={itemIndex} 
                                    style={[styles.accordionItem, isOpen && styles.accordionItemActive]} 
                                    onPress={() => toggleExpand(catIndex, itemIndex)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.accordionHeader}>
                                        <Text style={[styles.questionText, isOpen && styles.questionTextActive]}>
                                            {item.question}
                                        </Text>
                                        <Ionicons 
                                            name={isOpen ? "chevron-up" : "chevron-down"} 
                                            size={20} 
                                            color={isOpen ? "#648DDB" : "#999"} 
                                        />
                                    </View>
                                    {isOpen && (
                                        <View style={styles.accordionBody}>
                                            <Text style={styles.answerText}>{item.answer}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                {/* Contact Section */}
                <View style={styles.contactSection}>
                    <Text style={styles.sectionHeader}>{t('stillNeedHelp')}</Text>
                    
                    <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="mail" size={24} color="#648DDB" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactTitle}>{t('emailSupport')}</Text>
                            <Text style={styles.contactSub}>{t('emailSub')}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="call" size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactTitle}>{t('callUs')}</Text>
                            <Text style={styles.contactSub}>{t('callSub')}</Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>DreamTrip Advisor v1.0.2</Text>
                    <View style={styles.legalLinks}>
                        <Text style={styles.legalText}>{t('privacyPolicy')}</Text>
                        <Text style={styles.legalText}> • </Text>
                        <Text style={styles.legalText}>{t('termsOfService')}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    scrollContent: { paddingBottom: 40 },
    
    // Hero
    heroSection: { padding: 25, backgroundColor: '#FFF', marginBottom: 10 },
    heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    heroSub: { fontSize: 15, color: '#666', lineHeight: 22 },

    // Sections
    sectionContainer: { marginBottom: 20, paddingHorizontal: 20 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 10 },
    
    // Accordion
    accordionItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    accordionItemActive: {
        borderColor: '#648DDB',
        backgroundColor: '#FDFDFD'
    },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    questionText: { fontSize: 15, fontWeight: '500', color: '#444', flex: 1, marginRight: 10 },
    questionTextActive: { color: '#648DDB', fontWeight: '700' },
    accordionBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    answerText: { fontSize: 14, color: '#666', lineHeight: 22 },

    // Contact
    contactSection: { paddingHorizontal: 20, marginBottom: 30 },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2
    },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    contactInfo: { flex: 1 },
    contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    contactSub: { fontSize: 13, color: '#888', marginTop: 2 },

    // Footer
    footer: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
    versionText: { color: '#BBB', fontSize: 12, marginBottom: 5 },
    legalLinks: { flexDirection: 'row' },
    legalText: { color: '#648DDB', fontSize: 12, fontWeight: '500' }
});