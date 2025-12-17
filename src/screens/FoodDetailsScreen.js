// src/screens/FoodDetailsScreen.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// SERVICES
import {
    addItemToPlan,
    createNewPlan,
    getFoodById,
    getUserPlans
} from '../services/AuthService';

const { width, height } = Dimensions.get('window');

const FoodDetailsScreen = () => {
    const { id } = useLocalSearchParams();

    // DATA
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // MODAL
    const [modalVisible, setModalVisible] = useState(false);
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // NEW PLAN
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            if (id) {
                const result = await getFoodById(id);
                setData(result);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [id]);

    // OPEN MODAL
    const handleAddToPlanClick = async () => {
        setModalVisible(true);
        setLoadingPlans(true);
        try {
            const userPlans = await getUserPlans();
            setPlans(userPlans);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch plans.");
        } finally {
            setLoadingPlans(false);
        }
    };

    // CREATE PLAN
    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) {
            Alert.alert("Required", "Please enter a trip name.");
            return;
        }
        try {
            const newPlanId = await createNewPlan(newPlanName);
            await handleSelectPlan({ id: newPlanId, planName: newPlanName });
        } catch {
            Alert.alert("Error", "Failed to create plan.");
        }
    };

    // ADD FOOD TO PLAN
    const handleSelectPlan = async (plan) => {
        try {
            const itemToSave = {
                id: data.id,
                title: data.title,
                price: totalExpenses,
                imageUrl: data.imageUrl,
                type: 'food'
            };

            await addItemToPlan(plan.id, itemToSave);

            setModalVisible(false);
            setIsCreatingPlan(false);
            setNewPlanName('');

            Alert.alert("Success", `Added to ${plan.planName}`);
        } catch {
            Alert.alert("Error", "Failed to add item.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A8AE4" />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Food not found</Text>
            </View>
        );
    }

    // CALCULATIONS
    const bgImage = data.imageUrl || 'https://via.placeholder.com/400';
    const foodCost = parseFloat(data.estimatedTotalExpenses) || 0;
    const transportCost = parseFloat(data.transportCost) || 0;
    const totalExpenses = (foodCost + transportCost).toFixed(2);
    const rating = data.rating || 4.5;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerTransparent: true, headerTitle: "", headerTintColor: "#FFF" }} />
            <StatusBar barStyle="light-content" />

            {/* IMAGE */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: bgImage }} style={styles.heroImage} />
            </View>

            {/* CONTENT */}
            <View style={styles.sheetContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>{data.title}</Text>

                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={18} color="#FFD700" />
                        <Text style={styles.ratingText}>{rating} (Food Rating)</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{data.description}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Cost Breakdown</Text>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Food</Text>
                        <Text style={styles.costValue}>RM {foodCost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Transport</Text>
                        <Text style={styles.costValue}>RM {transportCost.toFixed(2)}</Text>
                    </View>

                    <View style={{ height: 140 }} />
                </ScrollView>
            </View>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.totalLabel}>Total Expenses</Text>
                    <Text style={styles.totalPrice}>RM {totalExpenses}</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddToPlanClick}>
                    <Text style={styles.addButtonText}>Add to Plan</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL */}
            <Modal transparent animationType="slide" visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isCreatingPlan ? "New Trip Name" : "Select a Trip"}
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
                                    <ActivityIndicator style={{ margin: 20 }} />
                                ) : (
                                    <FlatList
                                        data={plans}
                                        keyExtractor={item => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.planItem}
                                                onPress={() => handleSelectPlan(item)}
                                            >
                                                <Ionicons name="restaurant" size={20} color="#5A8AE4" />
                                                <Text style={styles.planName}>{item.planName}</Text>
                                            </TouchableOpacity>
                                        )}
                                    />
                                )}

                                <TouchableOpacity
                                    style={styles.createPlanBtn}
                                    onPress={() => setIsCreatingPlan(true)}
                                >
                                    <Ionicons name="add" size={20} color="#FFF" />
                                    <Text style={styles.createPlanText}>Create New Plan</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {isCreatingPlan && (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Trip name"
                                    value={newPlanName}
                                    onChangeText={setNewPlanName}
                                />
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={handleCreatePlan}
                                >
                                    <Text style={styles.addButtonText}>Create & Add</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default FoodDetailsScreen;
