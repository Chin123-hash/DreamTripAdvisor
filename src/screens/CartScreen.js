import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router'; // Import Stack
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createNewPlan, deletePlan, getUserPlans } from '../services/AuthService';

export default function CartScreen() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
    const router = useRouter();

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
            Alert.alert("Required", "Please enter a plan name.");
            return;
        }
        try {
            setLoading(true);
            await createNewPlan(newPlanName);
            setNewPlanName('');
            setModalVisible(false);
            await fetchPlans(); // Refresh list
        } catch (error) {
            Alert.alert("Error", "Failed to create plan.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePlan = (planId) => {
        Alert.alert("Delete Plan", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deletePlan(planId);
                        fetchPlans();
                    } catch (error) {
                        alert("Failed to delete.");
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* This inserts the button into the Native Header 
               It will appear on the same line as the "Cart" title 
            */}
            <Stack.Screen
                options={{
                    title: 'My Cart', // Sets the header title
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
                                    {item.items?.length || 0} items
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItemFromPlan(item.id, item.items[0].id);
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
                        <TouchableOpacity style={styles.modalBtn} onPress={handleCreatePlan}>
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
    // Custom header styles removed as we now use Stack.Screen
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