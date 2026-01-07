import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNewPlan, deletePlan, getUserPlans } from '../services/AuthService';
// 1. Import Hook
import { useLanguage } from '../context/LanguageContext';

export default function CartScreen() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const router = useRouter();
    // 2. Destructure Hook
    const { t } = useLanguage();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const userPlans = await getUserPlans();
            setPlans(userPlans || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) {
            Alert.alert(t('alertRequiredTitle'), t('alertPlanNameReq'));
            return;
        }
        try {
            setLoading(true);
            await createNewPlan(newPlanName);
            setNewPlanName('');
            setModalVisible(false);
            await fetchPlans(); // Refresh list
        } catch (error) {
            Alert.alert(t('alertErrorTitle'), t('alertCreateFail'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlan = (planId) => {
        Alert.alert(t('deletePlanTitle'), t('deletePlanMsg'), [
            { text: t('cancel'), style: "cancel" },
            {
                text: t('delete'),
                style: "destructive",
                onPress: async () => {
                    try {
                        await deletePlan(planId);
                        fetchPlans();
                    } catch (error) {
                        alert(t('alertDeleteFail'));
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* This inserts the button into the Native Header */}
            <Stack.Screen
                options={{
                    title: t('myCart'), // Localized Header Title
                    headerRight: () => (
                        // Only show the top '+' button if there are plans
                        plans.length > 0 ? (
                            <TouchableOpacity onPress={() => setModalVisible(true)}>
                                <Ionicons name="add" size={28} color="#007AFF" />
                            </TouchableOpacity>
                        ) : null
                    ),
                }}
            />

            {plans.length === 0 ? (
                /* EMPTY STATE */
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={90} color="#BDBDBD" />
                    <Text style={styles.emptyTitle}>{t('emptyCartTitle')}</Text>
                    <Text style={styles.emptySubtitle}>
                        {t('emptyCartSub')}
                    </Text>
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.mainButtonText}>{t('addNewPlan')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                /* LIST STATE */
                <FlatList
                    data={plans}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.planCard}
                            onPress={() => router.push({
                                pathname: '/cart-details',
                                params: { planId: item.id }
                            })}
                        >
                            <View style={styles.planIcon}>
                                <Ionicons name="map" size={22} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.planTitle}>{item.planName}</Text>
                                <Text style={styles.planSubtitle}>
                                    {item.items?.length || 0} {t('itemsCount')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleDeletePlan(item.id, item.items?.[0]?.id);
                                }}
                            >
                                <Ionicons name="trash-outline" size={22} color="#9DB7E8" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* MODAL */}
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('newTripName')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder={t('placeholderPlanName')}
                            value={newPlanName}
                            onChangeText={setNewPlanName}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.modalBtn} onPress={handleCreatePlan}>
                            <Text style={styles.modalBtnText}>{t('createPlan')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        color: '#333',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 30,
    },
    mainButton: {
        backgroundColor: '#648DDB',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    mainButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF2FF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 14,
    },
    planIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#8FB3FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    planTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F3A5F',
    },
    planSubtitle: {
        fontSize: 13,
        color: '#5F7FA3',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 25,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
    },
    modalBtn: {
        backgroundColor: '#648DDB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});