// src/screens/EntertainmentDetailsScreen.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
// IMPORT THE NEW FUNCTIONS
import { addItemToPlan, createNewPlan, getEntertainmentById, getUserPlans } from '../services/AuthService';

const { width, height } = Dimensions.get('window');

const EntertainmentDetailsScreen = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    
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

    useEffect(() => {
        const fetchDetails = async () => {
            if (id) {
                const result = await getEntertainmentById(id);
                setData(result);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [id]);

    // --- ACTION: Open Modal & Fetch Plans ---
    const handleAddToPlanClick = async () => {
        setModalVisible(true);
        setLoadingPlans(true);
        try {
            const userPlans = await getUserPlans();
            setPlans(userPlans);
        } catch (error) {
            Alert.alert("Error", "Could not fetch your plans.");
        } finally {
            setLoadingPlans(false);
        }
    };

    // --- ACTION: Create New Plan & Auto-Select ---
    const handleCreatePlan = async () => {
        if (!newPlanName.trim()) {
            Alert.alert("Required", "Please enter a trip name.");
            return;
        }
        try {
            const newPlanId = await createNewPlan(newPlanName);
            // After creating, immediately add the item to this new plan
            await handleSelectItem({ id: newPlanId, planName: newPlanName });
        } catch (error) {
            Alert.alert("Error", "Failed to create plan.");
        }
    };

    // --- ACTION: Add Item to Selected Plan ---
    const handleSelectItem = async (plan) => {
        try {
            // Prepare the clean object to save
            const itemToSave = {
                id: data.id,
                title: data.title,
                price: totalExpenses, // calculated variable below
                imageUrl: data.imageUrl
            };

            await addItemToPlan(plan.id, itemToSave);
            
            setModalVisible(false);
            setNewPlanName('');
            setIsCreatingPlan(false);
            
            Alert.alert("Success", `Added to ${plan.planName}!`);
        } catch (error) {
            Alert.alert("Error", "Could not add to plan.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5A8AE4" />
            </View>
        );
    }

    if (!data) return <View style={styles.loadingContainer}><Text>Not Found</Text></View>;

    // Calculations
    const bgImage = data.imageUrl || 'https://via.placeholder.com/400';
    const ticketPrice = parseFloat(data.ticketCost) || 0;
    const transportPrice = parseFloat(data.transportCost) || 0;
    const totalExpenses = (ticketPrice + transportPrice).toFixed(2);
    const rating = data.rating || 4.5;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerTransparent: true, headerTitle: "", headerTintColor: "#FFF" }} />
            <StatusBar barStyle="light-content" />
            
            {/* HERO IMAGE */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: bgImage }} style={styles.heroImage} />
            </View>

            {/* CONTENT SHEET */}
            <View style={styles.sheetContainer}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>{data.title}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={18} color="#FFD700" />
                            <Text style={styles.ratingText}>{rating} (Peer Rating)</Text>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.descriptionText}>{data.description}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Cost Breakdown</Text>
                    {/* Simplified Cost Row for brevity in this snippet */}
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Ticket</Text>
                        <Text style={styles.costValue}>RM {ticketPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.costRow}>
                        <Text style={styles.costLabel}>Transport</Text>
                        <Text style={styles.costValue}>RM {transportPrice.toFixed(2)}</Text>
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

            {/* ================= MODAL: ADD TO PLAN ================= */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        
                        {/* Modal Header */}
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

                        {/* CONTENT A: LIST OF PLANS */}
                        {!isCreatingPlan && (
                            <>
                                {loadingPlans ? (
                                    <ActivityIndicator color="#5A8AE4" style={{margin: 20}}/>
                                ) : (
                                    <View style={{maxHeight: 300}}>
                                        <FlatList
                                            data={plans}
                                            keyExtractor={item => item.id}
                                            renderItem={({item}) => (
                                                <TouchableOpacity 
                                                    style={styles.planItem} 
                                                    onPress={() => handleSelectItem(item)}
                                                >
                                                    <View style={styles.planIcon}>
                                                        <Ionicons name="map" size={20} color="#5A8AE4" />
                                                    </View>
                                                    <View>
                                                        <Text style={styles.planName}>{item.planName}</Text>
                                                        <Text style={styles.planSub}>{item.items?.length || 0} items</Text>
                                                    </View>
                                                    <Ionicons name="add-circle-outline" size={24} color="#5A8AE4" style={{marginLeft: 'auto'}}/>
                                                </TouchableOpacity>
                                            )}
                                            ListEmptyComponent={
                                                <Text style={{textAlign:'center', color:'#999', margin: 20}}>No active plans.</Text>
                                            }
                                        />
                                    </View>
                                )}
                                
                                {/* Create New Button */}
                                <TouchableOpacity 
                                    style={styles.createPlanBtn} 
                                    onPress={() => setIsCreatingPlan(true)}
                                >
                                    <Ionicons name="add" size={20} color="#FFF" />
                                    <Text style={styles.createPlanText}>Create New Plan</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* CONTENT B: CREATE NEW INPUT */}
                        {isCreatingPlan && (
                            <View style={{width: '100%'}}>
                                <TextInput 
                                    style={styles.input}
                                    placeholder="e.g. Penang Food Hunt"
                                    value={newPlanName}
                                    onChangeText={setNewPlanName}
                                    autoFocus
                                />
                                <View style={styles.modalActionRow}>
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, {backgroundColor: '#f0f0f0'}]}
                                        onPress={() => setIsCreatingPlan(false)}
                                    >
                                        <Text style={{color:'#666'}}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.modalBtn, {backgroundColor: '#5A8AE4'}]}
                                        onPress={handleCreatePlan}
                                    >
                                        <Text style={{color:'#FFF', fontWeight: 'bold'}}>Create & Add</Text>
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
    // ... (Keep all your existing Layout Styles from the "Clean" version) ...
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

    // BOTTOM BAR
    bottomBar: { position: 'absolute', bottom: 0, width: '100%', height: 120, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 20, borderTopWidth: 1, borderColor: '#F0F0F0', elevation: 20 },
    totalLabel: { fontSize: 14, color: '#888', textTransform: 'uppercase' },
    totalPrice: { fontSize: 28, fontWeight: '800', color: '#5A8AE4' },
    addButton: { backgroundColor: '#5A8AE4', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 20, elevation: 5 },
    addButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

    // === MODAL STYLES ===
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, minHeight: 300 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    planItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    planIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    planName: { fontSize: 16, fontWeight: '600', color: '#333' },
    planSub: { fontSize: 12, color: '#888' },
    
    createPlanBtn: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 15, borderRadius: 12 },
    createPlanText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
    
    input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#EEE', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 20 },
    modalActionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    modalBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 }
});

export default EntertainmentDetailsScreen;