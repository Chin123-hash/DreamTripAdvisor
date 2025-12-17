// src/screens/AgencyUploadEntertainmentScreen.js

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addEntertainment } from '../services/AuthService';


const generateEntertainmentId = () => {
    const timestamp = new Date().getTime().toString().slice(-10);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `E${timestamp}${random}`;
};

export function AgencyUploadEntertainmentScreen() {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const [entertainmentId] = useState(generateEntertainmentId());
    const [title, setTitle] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [transportType, setTransportType] = useState(''); 
    const [transportPrice, setTransportPrice] = useState(''); 
    const [description, setDescription] = useState('');
    const [totalExpenses, setTotalExpenses] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);

   
    const tPrice = parseFloat(ticketPrice) || 0;
    const trPrice = parseFloat(transportPrice) || 0;
    const currentSum = tPrice + trPrice;
    
    const totalPlaceholder = currentSum > 0 ? currentSum.toString() : "RM";

    
    const handleReset = () => {
        setTitle('');
        setTicketPrice('');
        setTransportType('');
        setTransportPrice('');
        setDescription('');
        setTotalExpenses('');
        setImageUri(null); 
    };

    
    const pickImage = async () => {
       
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true,
            aspect: [4, 3], 
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    
    const handleSave = async () => {
        if (!currentUser) {
            Alert.alert("Error", "You must be logged in to upload content.");
            return;
        }

      
        if (!title || !ticketPrice || !description || !imageUri) {
            Alert.alert("Error", "Please fill in Entertainment Name, Ticket Price, Description, and upload a Picture.");
            return;
        }

        // 验证数字
        if (isNaN(parseFloat(ticketPrice)) || (transportPrice && isNaN(parseFloat(transportPrice)))) {
            Alert.alert("Error", "Ticket Price and Transport Price must be valid numbers.");
            return;
        }
        
        // 准备数据对象
        // ⚠️ 重要：这里的字段名已经对应了 AuthService 里的读取逻辑
        const entertainmentData = {
            title: title,
            description: description,
            
            // 对应 Service 里的 suggestedTransport
            suggestedTransport: transportType || 'N/A', 
            
            // 对应 Service 里的 transportCost
            transportCost: transportPrice || '0', 
            
            // 对应 Service 里的 estimatedTotalExpenses
            estimatedTotalExpenses: totalExpenses || '0', 
            
            // 额外字段
            ticketPrice: ticketPrice, 
            rating: 5, 
            referenceId: entertainmentId,
            agencyId: currentUser.uid // 记录是谁上传的
        };

        setLoading(true);
        try {
            // ⚠️ 关键修复：只传 2 个参数 (data, uri)
            // 这样就不会报错 Network request failed 了
            await addEntertainment(
                entertainmentData,
                imageUri
            );
            
            Alert.alert("Success", "Entertainment Package Uploaded!");
            handleReset(); 
        } catch (error) {
            console.error("Upload Error:", error);
            Alert.alert("Upload Failed", error.message || "An unknown error occurred during upload.");
        } finally {
            setLoading(false);
        }
    };

    // --- Render UI ---
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => console.log("Back pressed")}>
                    <Ionicons name="arrow-back" size={28} color="#333" /> 
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>Upload Entertainment</Text>
                
                <View style={{ width: 33 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    
                    {/* ID Display */}
                    <Text style={styles.idText}>
                        Entertainment ID: <Text style={{ fontWeight: '600' }}>{entertainmentId}</Text>
                    </Text>

                    {/* Image Upload Area */}
                    <View style={styles.imageContainer}>
                        <View style={styles.imageBox}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="image-outline" size={50} color="#CCCCCC" />
                                </View>
                            )}
                        </View>
                        <TouchableOpacity 
                            style={styles.changePictureButtonContainer}
                            onPress={pickImage}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#4CD964', '#28A745']} 
                                start={{ x: 0, y: 0 }} 
                                end={{ x: 1, y: 0 }}   
                                style={styles.gradientButton} 
                            >
                            <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                            <Text style={styles.changePictureText}>
                                {imageUri ? "Change Picture" : "Upload Picture"}
                            </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Form Inputs */}
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Entertainment Name</Text>
                        <TextInput 
                            style={styles.inputField} 
                            placeholder="e.g. Sunway Lagoon Ticket"
                            placeholderTextColor="#888"
                            value={title} 
                            onChangeText={setTitle} 
                        />
                        
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Ticket Price</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. 120" 
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={ticketPrice} 
                                    onChangeText={setTicketPrice} 
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Transport (Optional)</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. Bus, Taxi" 
                                    placeholderTextColor="#888"
                                    value={transportType} 
                                    onChangeText={setTransportType} 
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Transport Price</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="e.g. 50" 
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={transportPrice} 
                                    onChangeText={setTransportPrice} 
                                />
                            </View>
                             <View style={styles.col}>
                                <Text style={styles.label}>Total Expenses</Text>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder={totalPlaceholder}
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={totalExpenses} 
                                    onChangeText={setTotalExpenses} 
                                    onFocus={() => {
                                        if (!totalExpenses && currentSum > 0) {
                                            setTotalExpenses(currentSum.toString());
                                        }
                                    }}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Description</Text>
                        <TextInput 
                            style={[styles.inputField, styles.multilineInput]} 
                            placeholder="Detailed description of the package..."
                            placeholderTextColor="#888"
                            multiline
                            numberOfLines={4}
                            value={description} 
                            onChangeText={setDescription} 
                        />
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.resetButton, loading && {opacity: 0.5}]}
                            onPress={handleReset}
                            disabled={loading}
                        >
                            <Text style={styles.resetButtonText}>Reset</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, !imageUri && {opacity: 0.5}]}
                            onPress={handleSave}
                            disabled={loading || !imageUri}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    
    idText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },

    imageContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    imageBox: {
        width: 150,
        height: 150,
        borderRadius: 15,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E1E1E1',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 10,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    changePictureButtonContainer: {
        borderRadius: 25, 
        overflow: 'hidden', 
        marginTop: 10,
        shadowColor: "#28A745",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },

    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,   
        paddingHorizontal: 30, 
    },

    changePictureText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    formContainer: {
        backgroundColor: '#F4FFF2', // 绿色主题背景
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
        fontWeight: '600',
    },
    inputField: {
        width: '100%',
        height: 45,
        borderWidth: 1,
        borderColor: '#E1E1E1',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        fontSize: 15,
        marginBottom: 20,
        color: '#333',
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    col: {
        width: '48%', 
    },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginTop: 10,
    },
    resetButton: {
        flex: 1,
        backgroundColor: '#EBEBEB',
        paddingVertical: 15,
        borderRadius: 10,
        marginRight: 10,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#648DDB',
        paddingVertical: 15,
        borderRadius: 10,
        marginLeft: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});