import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { createNewPlan, getUserPlans } from '../services/AuthService';

export default function CartScreen() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states (REUSED pattern)
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const userPlans = await getUserPlans();
            setPlans(userPlans);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) {
            alert('Please enter a plan name.');
            return;
        }

        try {
            await createNewPlan(newPlanName);
            setNewPlanName('');
            setModalVisible(false);
            fetchPlans(); // refresh cart
        } catch (error) {
            alert('Failed to create plan.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#648DDB" />
            </View>
        );
    }

    const isEmpty = plans.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* EMPTY CART */}
            {isEmpty && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={90} color="#BDBDBD" />
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>
                        Create a plan to start adding entertainments and foods.
                    </Text>

                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.mainButtonText}>Add a new plan</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isEmpty && (
                <View style={{ padding: 20 }}>
                    {plans.map((plan) => (
                        <TouchableOpacity key={plan.id} style={styles.planCard}>
                            <View style={styles.planIcon}>
                                <Ionicons name="map" size={22} color="#FFFFFF" />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.planTitle}>{plan.planName}</Text>
                                <Text style={styles.planSubtitle}>
                                    {plan.items?.length || 0} items
                                </Text>
                            </View>

                            <Ionicons name="chevron-forward" size={22} color="#9DB7E8" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Trip Name</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Penang Food Hunt"
                            value={newPlanName}
                            onChangeText={setNewPlanName}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={styles.modalBtn}
                            onPress={handleCreatePlan}
                        >
                            <Text style={styles.modalBtnText}>Create Plan</Text>
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

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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

    // MODAL
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

    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAF2FF', // soft blue
        padding: 16,
        borderRadius: 16,
        marginBottom: 14,
    },

    planIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#8FB3FF', // stronger blue
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    planTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F3A5F', // deep blue
    },

    planSubtitle: {
        fontSize: 13,
        color: '#5F7FA3', // blue-gray
        marginTop: 2,
    },
});
