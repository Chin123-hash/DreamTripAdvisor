import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router'; // Import Stack
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
            console.error("Error fetching plans:", error);
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
        Alert.alert("Delete Plan", "Are you sure you want to remove this trip?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deletePlan(planId);
                        fetchPlans();
                    } catch (error) {
                        alert("Error", "Failed to delete.");
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'My Cart',
                    headerRight: () => (
                        plans.length > 0 ? (
                            <TouchableOpacity onPress={() => setModalVisible(true)} style={{ marginRight: 15 }}>
                                <Ionicons name="add" size={28} color="#648DDB" />
                            </TouchableOpacity>
                        ) : null
                    ),
                }}
            />

            {loading ? (
                <View style={styles.emptyContainer}><ActivityIndicator size="large" color="#648DDB" /></View>
            ) : plans.length === 0 ? (
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
                <FlatList
                    data={plans}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.planCard}
                            onPress={() => router.push({
                                pathname: '/PlanDetailsScreen', // Ensure this matches your file name
                                params: { planId: item.id }
                            })}
                        >
                            <View style={styles.planIcon}>
                                <Ionicons name="map" size={22} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.planTitle}>{item.planName}</Text>
                                <Text style={styles.planSubtitle}>
                                    {item.items?.length || 0} items • RM {parseFloat(item.estimatedCost || 0).toFixed(2)}
                                </Text>
                            </View>

                            {/* Trash Icon Button */}
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={(e) => {
                                    e.stopPropagation(); // Prevents opening the plan details
                                    handleDeletePlan(item.id);
                                }}
                            >
                                <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* CREATE PLAN MODAL */}
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
                            placeholder="e.g. My Awesome Vacation"
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
    container: { flex: 1, backgroundColor: '#FFF' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, color: '#333' },
    emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 30 },
    mainButton: { backgroundColor: '#648DDB', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
    mainButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F9FF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E0E7FF'
    },
    planIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#648DDB', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    planTitle: { fontSize: 16, fontWeight: '600', color: '#1F3A5F' },
    planSubtitle: { fontSize: 13, color: '#5F7FA3' },
    deleteButton: { padding: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 20 },
    modalBtn: { backgroundColor: '#648DDB', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});