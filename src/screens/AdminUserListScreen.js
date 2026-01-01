import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- 1. 新增：引入 ImagePicker 和 Firebase Storage ---
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

import { adminUpdateUser, deleteUserFromFirestore, getAllUsers } from '../services/AuthService';

export default function AdminUserListScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme(); 

    // --- State ---
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // --- Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [updating, setUpdating] = useState(false);

    // --- 日历显示控制 ---
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- 编辑字段 State ---
    const [editName, setEditName] = useState('');       
    const [editUsername, setEditUsername] = useState('');
    const [editDob, setEditDob] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');

    // --- Agency 专属字段 ---
    const [editLicenseNo, setEditLicenseNo] = useState('');
    const [editCompanyUrl, setEditCompanyUrl] = useState('');
    const [editLogoUrl, setEditLogoUrl] = useState(''); // 存 Logo 图片路径 (本地或网络)

    // --- 【新增】普通用户/Admin 专属头像 ---
    const [editProfileImage, setEditProfileImage] = useState(''); // 存 Profile 图片路径

    // 1. 初始化
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getAllUsers();
        const sortedData = data.sort((a, b) => {
             const nameA = a.role === 'agency' ? (a.agencyName || '') : (a.fullName || '');
             const nameB = b.role === 'agency' ? (b.agencyName || '') : (b.fullName || '');
             return nameA.localeCompare(nameB);
        });
        setUsers(sortedData);
        setFilteredUsers(sortedData);
        setLoading(false);
    };

    // 2. 搜索逻辑
    const handleSearch = (text) => {
        setSearchText(text);
        if (text) {
            const lowerText = text.toLowerCase();
            const newData = users.filter((user) => {
                const name = user.role === 'agency' ? (user.agencyName || '') : (user.fullName || '');
                const email = user.email || '';
                const license = user.licenseNo || ''; 
                return name.toLowerCase().includes(lowerText) || 
                       email.toLowerCase().includes(lowerText) ||
                       license.toLowerCase().includes(lowerText);
            });
            setFilteredUsers(newData);
        } else {
            setFilteredUsers(users);
        }
    };

    // 3. 打开弹窗
    const openUserModal = (user) => {
        setSelectedUser(user);
        setShowDatePicker(false);

        // 先填充通用数据
        setEditUsername(user.username || '');
        setEditDob(user.dob || '');
        setEditEmail(user.email || '');
        setEditPhone(user.phone || '');

        if (user.role === 'agency') {
            // Agency 数据
            setEditName(user.agencyName || ''); 
            setEditLicenseNo(user.licenseNo || '');
            setEditCompanyUrl(user.companyUrl || '');
            setEditLogoUrl(user.logoUrl || ''); // 加载 Logo
            setEditProfileImage(''); // 清空 Profile Image
        } else {
            // User 数据
            setEditName(user.fullName || '');   
            setEditProfileImage(user.profileImage || ''); // 加载 Profile Image
            // 清空 Agency 数据
            setEditLicenseNo('');
            setEditCompanyUrl('');
            setEditLogoUrl('');
        }

        setModalVisible(true);
    };

    // --- 【新增】选择图片 (智能判断改的是 Logo 还是 头像) ---
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Need gallery access to change photo.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // 正方形裁剪
            quality: 0.5,
        });

        if (!result.canceled) {
            if (selectedUser.role === 'agency') {
                setEditLogoUrl(result.assets[0].uri); // 改 Agency Logo
            } else {
                setEditProfileImage(result.assets[0].uri); // 改 User Avatar
            }
        }
    };

    // --- 【新增】上传图片逻辑 ---
    const uploadImageToFirebase = async (uri, folder) => {
        if (!uri) return null;
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `${folder}/${selectedUser.id}/${new Date().getTime()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (error) {
            throw error;
        }
    };

    // 4. 保存编辑 (包含上传逻辑)
    const handleSaveEdit = async () => {
        if (!selectedUser) return;
        setUpdating(true);

        try {
            const updateData = {
                username: editUsername,
                dob: editDob,
                email: editEmail,
                phone: editPhone
            };

            if (selectedUser.role === 'agency') {
                // --- Agency 保存 ---
                updateData.agencyName = editName;     
                updateData.licenseNo = editLicenseNo;
                updateData.companyUrl = editCompanyUrl;
                
                // 处理 Logo 上传
                let finalLogoUrl = editLogoUrl;
                if (editLogoUrl && !editLogoUrl.startsWith('http')) {
                    finalLogoUrl = await uploadImageToFirebase(editLogoUrl, 'logos');
                }
                updateData.logoUrl = finalLogoUrl;

            } else {
                // --- User 保存 ---
                updateData.fullName = editName;       
                
                // 处理 Profile Image 上传
                let finalProfileUrl = editProfileImage;
                if (editProfileImage && !editProfileImage.startsWith('http')) {
                    finalProfileUrl = await uploadImageToFirebase(editProfileImage, 'profile_images');
                }
                updateData.profileImage = finalProfileUrl;
            }
            
            await adminUpdateUser(selectedUser.id, updateData);
            
            Alert.alert("Success", "User details updated successfully.");
            setModalVisible(false);
            fetchUsers(); 
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update user.");
        } finally {
            setUpdating(false);
        }
    };

    // 5. 删除用户
    const handleDeleteUser = () => {
        if (selectedUser?.role === 'admin') {
            Alert.alert("Action Denied", "Admin accounts cannot be deleted.");
            return;
        }

        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to remove ${editName}?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            await deleteUserFromFirestore(selectedUser.id);
                            
                            const newList = users.filter(u => u.id !== selectedUser.id);
                            setUsers(newList);
                            setFilteredUsers(newList); 
                            
                            setModalVisible(false);
                            Alert.alert("Deleted", "User has been removed.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete user.");
                        } finally {
                            setUpdating(false);
                        }
                    }
                }
            ]
        );
    };

    // --- 日历处理函数 ---
    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            setEditDob(`${year}-${month}-${day}`);
        }
    };

    const getDobDateObject = () => {
        if (!editDob) return new Date();
        const parts = editDob.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date();
    };

    const renderItem = ({ item }) => {
        const isAgency = item.role === 'agency';
        const displayName = isAgency ? (item.agencyName || "Unnamed Agency") : (item.fullName || "Unnamed User");
        // Agency 用 logoUrl, 别人用 profileImage
        const displayImage = isAgency ? item.logoUrl : item.profileImage;
        const role = item.role || 'user';

        return (
            <TouchableOpacity style={styles.userCard} onPress={() => openUserModal(item)}>
                <View style={styles.avatarContainer}>
                    {displayImage ? (
                        <Image source={{ uri: displayImage }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
                    <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
                    <View style={[styles.roleBadge, 
                        role === 'admin' ? styles.badgeAdmin : 
                        role === 'agency' ? styles.badgeAgency : 
                        styles.badgeTraveller
                    ]}>
                        <Text style={[styles.roleText, 
                            role === 'admin' ? styles.textAdmin : 
                            role === 'agency' ? styles.textAgency : 
                            styles.textTraveller
                        ]}>
                            {role.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Ionicons name="create-outline" size={24} color="#648DDB" />
            </TouchableOpacity>
        );
    };

    const renderFormFields = () => {
        const isAgency = selectedUser?.role === 'agency';

        return (
            <>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>User ID (Read-Only)</Text>
                    <Text style={styles.readOnlyValue}>{selectedUser?.id}</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{isAgency ? "Agency Name" : "Full Name"}</Text>
                    <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder={isAgency ? "Enter Agency Name" : "Enter Full Name"}
                    />
                </View>

                {isAgency && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SSM License No.</Text>
                            <TextInput
                                style={styles.input}
                                value={editLicenseNo}
                                onChangeText={setEditLicenseNo}
                                placeholder="e.g. 202401000123"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Company Website URL</Text>
                            <TextInput
                                style={styles.input}
                                value={editCompanyUrl}
                                onChangeText={setEditCompanyUrl}
                                placeholder="https://..."
                                autoCapitalize="none"
                            />
                        </View>

                        {/* --- 重点修改：Agency Logo 图片选择器 --- */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Company Logo</Text>
                            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                                {editLogoUrl ? (
                                    <View style={{width: '100%', height: '100%'}}>
                                        <Image 
                                            source={{ uri: editLogoUrl }} 
                                            style={styles.uploadedImage} 
                                            resizeMode="cover" 
                                        />
                                        <View style={styles.editIconOverlay}>
                                            <Ionicons name="pencil" size={12} color="#FFF" />
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="camera-outline" size={32} color="#648DDB" />
                                        <Text style={{color: '#648DDB', marginTop: 5, fontSize: 12}}>Tap to Upload Logo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={editUsername}
                        onChangeText={setEditUsername}
                        placeholder="Enter Username"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        value={editEmail}
                        onChangeText={setEditEmail}
                        placeholder="Enter Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        placeholder="Enter Phone No"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date of Birth</Text>
                    
                    <TouchableOpacity 
                        style={[styles.input, { justifyContent: 'center' }]} 
                        onPress={() => setShowDatePicker(!showDatePicker)}
                    >
                        <Text style={{ color: editDob ? '#333' : '#999', fontSize: 16 }}>
                            {editDob || "YYYY-MM-DD"}
                        </Text>
                        <Ionicons 
                            name={showDatePicker ? "chevron-up" : "calendar-outline"} 
                            size={20} 
                            color="#666" 
                            style={{ position: 'absolute', right: 12 }} 
                        />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={getDobDateObject()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            themeVariant={colorScheme} 
                            textColor={colorScheme === 'dark' ? '#FFFFFF' : '#000000'}
                            style={{ 
                                backgroundColor: colorScheme === 'dark' ? '#202020' : '#FFFFFF',
                            }}
                        />
                    )}
                </View>

                {/* --- 重点修改：普通用户/Admin 头像选择器 (放在最下面) --- */}
                {!isAgency && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Profile Image</Text>
                        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                            {editProfileImage ? (
                                <View style={{width: '100%', height: '100%'}}>
                                    <Image 
                                        source={{ uri: editProfileImage }} 
                                        style={styles.uploadedImage} 
                                        resizeMode="cover" 
                                    />
                                    <View style={styles.editIconOverlay}>
                                        <Ionicons name="pencil" size={12} color="#FFF" />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="person-circle-outline" size={32} color="#648DDB" />
                                    <Text style={{color: '#648DDB', marginTop: 5, fontSize: 12}}>Set Profile Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Name, SSM or Email..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                />
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color="#648DDB" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No users found.</Text>
                        </View>
                    }
                />
            )}

            {/* Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedUser?.role === 'agency' ? 'Edit Agency' : 'Edit User'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            
                            {renderFormFields()}

                            {/* Buttons */}
                            {updating ? (
                                <ActivityIndicator size="small" color="#648DDB" style={{ marginVertical: 20 }} />
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>

                                    {selectedUser?.role !== 'admin' ? (
                                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteUser}>
                                            <Ionicons name="trash-outline" size={18} color="#D32F2F" style={{marginRight: 8}}/>
                                            <Text style={styles.deleteButtonText}>Delete User</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.adminNote}>
                                            <Ionicons name="shield-checkmark" size={16} color="#666" />
                                            <Text style={styles.adminNoteText}>Admin accounts cannot be deleted.</Text>
                                        </View>
                                    )}
                                </>
                            )}
                            <View style={{height: 20}} /> 
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 15, paddingHorizontal: 15, borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#EEE' },
    searchInput: { flex: 1, height: '100%', fontSize: 16 },

    listContent: { paddingBottom: 30 },
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 16, elevation: 2 },
    
    avatarContainer: { marginRight: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEE' },
    placeholderAvatar: { backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#648DDB' },
    
    userInfo: { flex: 1, marginRight: 10 },
    userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    userEmail: { fontSize: 13, color: '#888', marginTop: 2 },
    
    roleBadge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
    badgeAgency: { backgroundColor: '#E8F5E9' },
    badgeTraveller: { backgroundColor: '#E3F2FD' },
    badgeAdmin: { backgroundColor: '#F3E5F5' },
    
    roleText: { fontSize: 10, fontWeight: 'bold' },
    textAgency: { color: '#2E7D32' },
    textTraveller: { color: '#1565C0' },
    textAdmin: { color: '#7B1FA2' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#999', fontSize: 16 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxHeight: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' },
    readOnlyValue: { fontSize: 14, color: '#888', backgroundColor: '#F0F0F0', padding: 12, borderRadius: 10 },
    input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#FFF' },
    
    // --- Upload Box Styles (Square & Clean) ---
    uploadBox: {
        width: 120, 
        height: 120,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 16,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginTop: 5,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    uploadPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    editIconOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        padding: 4,
    },

    saveButton: { backgroundColor: '#648DDB', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    
    deleteButton: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#FFEBEE', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
    deleteButtonText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },

    adminNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8 },
    adminNoteText: { fontSize: 12, color: '#666', marginLeft: 6, fontStyle: 'italic' }
});