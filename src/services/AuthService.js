// src/services/AuthService.js
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    addDoc,
    arrayUnion, collection,
    deleteDoc,
    doc, getDoc, getDocs, orderBy, // Changed from onSnapshot for simpler one-time fetch
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';

// --- HELPER: Upload Image to Firebase Storage ---
const uploadLogo = async (uri, uid) => {
    if (!uri) return null;
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        // Save as: logos/USER_ID/timestamp.jpg
        const filename = `logos/${uid}/${new Date().getTime()}.jpg`;
        const storageRef = ref(storage, filename);

        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Upload Error:", error);
        throw new Error("Failed to upload image");
    }
};

// --- FUNCTION 1: Register a Traveller ---
export const registerTraveller = async (email, password, userData) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save Profile to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: 'traveller',
            fullName: userData.fullName,
            username: userData.username,
            phone: userData.phone,
            dob: userData.dob,
            createdAt: new Date().toISOString()
        });

        return user;
    } catch (error) {
        throw error;
    }
};

// --- FUNCTION 2: Register an Agency (With Logo) ---
export const registerAgency = async (email, password, agencyData, logoUri) => {
    try {
        // 1. Create Auth Account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Upload Logo (if exists)
        let logoUrl = null;
        if (logoUri) {
            logoUrl = await uploadLogo(logoUri, user.uid);
        }

        // 3. Save Data to Firestore with default status 'pending'
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: 'agency',
            agencyName: agencyData.agencyName,
            licenseNo: agencyData.licenseNo,
            companyUrl: agencyData.companyUrl,
            logoUrl: logoUrl,      // We save the link, not the file!
            status: 'pending',     // <-- Default status
            createdAt: new Date().toISOString()
        });

        return user;
    } catch (error) {
        throw error;
    }
};

// --- FUNCTION 3: Login User ---
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch user data from Firestore to get Role and Status
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        return { 
            user, 
            role: userData.role, 
            status: userData.status // Returns status (e.g., 'pending', 'approved') if it exists
        };
    } catch (error) {
        throw error;
    }
};

// --- FUNCTION 4: Reset Password ---
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        throw error;
    }
};
//
export const addEntertainment = async (data, imageUri) => {
    try {
        let imageUrl = null;

        // 1. Upload Image (Reusing similar logic to uploadLogo, but generic folder)
        if (imageUri) {
            // We can reuse the uploadLogo helper if modified, or just write a quick fetch here
            // Since uploadLogo is scoped locally in your file, let's copy the logic pattern:
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const filename = `entertainments/${new Date().getTime()}.jpg`; // New folder for organization
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            imageUrl = await getDownloadURL(storageRef);
        }

        // 2. Save Data to Firestore (Auto-ID)
        // We use addDoc because we don't have a specific User ID to link to, we want a random ID.
        await addDoc(collection(db, "entertainments"), {
            title: data.title,
            description: data.description,
            locationURL: data.locationURL || "",
            suggestedTransport: data.suggestedTransport,
            transportCost: parseFloat(data.transportCost) || 0,
            ticketPrice: parseFloat(data.ticketPrice) || 0,
            estimatedTotalExpenses: parseFloat(data.estimatedTotalExpenses) || 0,
            rating: parseFloat(data.rating) || 0,
            imageUrl: imageUrl,
            type: 'entertainments',
            createdAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        throw error;
    }
};
export const getEntertainmentList = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "entertainments"));

        const list = [];
        querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
        });
        return list;
    } catch (error) {
        console.error("Error fetching entertainments:", error);
        return [];
    }
};

export const getEntertainmentById = async (id) => {
    try {
        const docRef = doc(db, "entertainments", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching details:", error);
        throw error;
    }
};

export const getUserPlans = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const q = query(
            collection(db, "users", user.uid, "plans"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const plans = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return plans;
    } catch (error) {
        console.error("Error fetching plans:", error);
        throw error;
    }
};

// 2. Create a New Plan
export const createNewPlan = async (planName) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // We return the reference so we can use the ID immediately
        const docRef = await addDoc(collection(db, "users", user.uid, "plans"), {
            planName: planName,
            status: 'planning',
            items: [],
            createdAt: new Date().toISOString() // Using String for easier display
        });
        return docRef.id; // Return ID to auto-select it
    } catch (error) {
        throw error;
    }
};

// 3. Add Item to a Specific Plan
// 1. UPDATE: Add a unique 'cartId' when adding items
// In src/services/AuthService.js

export const addItemToPlan = async (planId, itemData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const planRef = doc(db, "users", user.uid, "plans", planId);
        const newCartId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

        await updateDoc(planRef, {
            items: arrayUnion({
                itemId: itemData.id, 
                cartId: newCartId,
                title: itemData.title,
                price: parseFloat(itemData.price), 
                image: itemData.imageUrl,
                type: itemData.type || 'entertainment',
                locationURL: itemData.locationURL || "", // <--- ADD THIS LINE
                addedAt: new Date().toISOString()
            })
        });
        return true;
    } catch (error) {
        console.error("Error adding to plan:", error);
        throw error;
    }
};

export const getFoodList = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "foods"));
        const list = [];
        querySnapshot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() });
        });
        return list;
    } catch (error) {
        console.error("Error fetching food list:", error);
        return [];
    }
};

export const getFoodById = async (id) => {
    try {
        const docRef = doc(db, "foods", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
        return true;
    } catch (error) {
        throw error;
    }
};

export const getCurrentUserData = async () => {
    const user = auth.currentUser;
    if (!user) return null; // Not logged in

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            return { uid: user.uid, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

export const getUserProfile = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

export const deletePlan = async (planId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const planRef = doc(db, "users", user.uid, "plans", planId);
        await deleteDoc(planRef);
        return true;
    } catch (error) {
        console.error("Error deleting plan:", error);
        throw error;
    }
};

export const updateUserProfile = async (uid, userData, imageUri) => {
    try {
        let updatedFields = { ...userData };

        // 1. If a new image is provided, upload it first
        if (imageUri) {
            const response = await fetch(imageUri);
            const blob = await response.blob();

            // Save as: profile_images/USER_ID.jpg
            // We overwrite the existing one to save space
            const filename = `profile_images/${uid}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            // Add the new URL to the fields to update
            updatedFields.profileImage = downloadUrl;
        }

        // 2. Update Firestore Document
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, updatedFields);

        return true;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
};


export const getPlanById = async (planId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // Reference: users -> UID -> plans -> PLAN_ID
        const planRef = doc(db, "users", user.uid, "plans", planId);
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
            return { id: planSnap.id, ...planSnap.data() };
        } else {
            console.log("No such plan found!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching plan details:", error);
        throw error;
    }
};

export const deleteItemFromPlan = async (planId, targetCartId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const planRef = doc(db, "users", user.uid, "plans", planId);
        
        const planDoc = await getDoc(planRef);
        if (!planDoc.exists()) throw new Error("Plan not found");
        
        const currentData = planDoc.data();
        const currentItems = currentData.items || [];

        // FILTER: Keep items where cartId DOES NOT match the target
        // (Fallback: if cartId is missing for old items, we check unique timestamp 'addedAt' or worst case 'itemId')
        const updatedItems = currentItems.filter(item => {
            if (item.cartId) return item.cartId !== targetCartId;
            return item.itemId !== targetCartId; // Fallback for old items
        });

        await updateDoc(planRef, {
            items: updatedItems
        });
        
        return true;
    } catch (error) {
        console.error("Error deleting item from plan:", error);
        throw error;
    }
};
// --- ADD FOOD (For Agencies) ---
export const addFood = async (data, imageUri) => {
    try {
        let imageUrl = null;

        // 1. Upload Image to Storage
        if (imageUri) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const filename = `foods/${new Date().getTime()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            imageUrl = await getDownloadURL(storageRef);
        }

        // 2. Save Data to Firestore (foods collection)
        await addDoc(collection(db, "foods"), {
            title: data.title,
            description: data.description,
            locationURL: data.locationURL || "",
            priceRange: parseFloat(data.priceRange) || 0, // e.g., "RM 10 - RM 30"
            suggestedTransport: data.suggestedTransport,
            transportCost: parseFloat(data.transportCost) || 0,
            estimatedTotalExpenses: parseFloat(data.estimatedTotalExpenses) || 0,
            rating: parseFloat(data.rating) || 0,
            imageUrl: imageUrl,
            type: 'food',
            createdAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        console.error("Error adding food:", error);
        throw error;
    }
};


// --- DELETE FOOD (For Agencies) ---
export const deleteFood = async (foodId) => {
    try {
        const foodRef = doc(db, "foods", foodId);
        await deleteDoc(foodRef);
        return true;
    } catch (error) {
        console.error("Error deleting food:", error);
        throw error;
    }
};

// --- UPDATE FOOD (For Agencies) ---
export const updateFood = async (foodId, updatedData, newImageUri) => {
    try {
        let finalData = {
            ...updatedData,
            transportCost: parseFloat(updatedData.transportCost) || 0,
            estimatedTotalExpenses: parseFloat(updatedData.estimatedTotalExpenses) || 0,
            rating: parseFloat(updatedData.rating) || 0,
        };

        if (newImageUri) {
            const response = await fetch(newImageUri);
            const blob = await response.blob();
            const filename = `foods/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            finalData.imageUrl = await getDownloadURL(storageRef);
        }

        const foodRef = doc(db, "foods", foodId);
        await updateDoc(foodRef, finalData);

        return true;
    } catch (error) {
        console.error("Error updating food:", error);
        throw error;
    }
};

/**
 * 1. Fetch Food List for Dropdown
 * Formats data into { label, value } for RNPickerSelect
 */
export const fetchFoodList = async () => {
    try {
        const foodCol = collection(db, 'foods'); // Ensure this matches your collection name
        const snapshot = await getDocs(foodCol);
        return snapshot.docs.map(doc => ({
            label: doc.data().title, // Display name
            value: doc.id,           // Document ID
        }));
    } catch (error) {
        console.error("Error fetching food:", error);
        throw error;
    }
};

/**
 * 2. Fetch Entertainment List for Dropdown
 */
export const fetchEntertainmentList = async () => {
    try {
        const entCol = collection(db, 'entertainments'); // Ensure this matches your collection name
        const snapshot = await getDocs(entCol);
        return snapshot.docs.map(doc => ({
            label: doc.data().title, // Adjust 'title' if your field is named differently
            value: doc.id,
        }));
    } catch (error) {
        console.error("Error fetching entertainment:", error);
        throw error;
    }
};

/**
 * 3. Add New Plan
 * Handles image upload to Storage and data save to Firestore
 */
export const addPlan = async (planData, imageUri) => {
    try {
        let imageUrl = '';

        // Handle Image Upload
        if (imageUri) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const filename = `plans/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            imageUrl = await getDownloadURL(storageRef);
        }

        // Add to Firestore
        const docRef = await addDoc(collection(db, 'plans'), {
            ...planData,
            imageUrl,
            createdAt: new Date().toISOString(),
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding plan:", error);
        throw error;
    }
};
export const getCartPlanDetails = async (planId) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        // Assuming structure is: users/{uid}/plans/{planId}
        const planRef = doc(db, "users", user.uid, "plans", planId);
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
            return { id: planSnap.id, ...planSnap.data() };
        } else {
            console.error("No such plan!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching plan details:", error);
        throw error;
    }
};

export const getAgencies = async () => {
    try {
        // Query users where role is 'agency'
        const q = query(collection(db, "users"), where("role", "==", "agency"));
        const querySnapshot = await getDocs(q);

        let agencies = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            agencies.push({
                id: doc.id,
                name: data.agencyName || data.fullName || "Unnamed Agency",
                status: data.status, // <--- CRITICAL FIX: Now retrieving status
            });
        });
        return agencies;
    } catch (error) {
        console.error("Error fetching agencies:", error);
        return [];
    }
};

export const getPlanList = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "plans"));
        const plans = [];
        querySnapshot.forEach((doc) => {
            plans.push({ id: doc.id, ...doc.data() });
        });
        return plans;
    } catch (error) {
        console.error("Error fetching plans: ", error);
        throw error;
    }
};

export const addPlanToCart = async (userId, planData) => {
    try {
        const cartRef = collection(db, "users", userId, "plans");
        await addDoc(cartRef, {
            ...planData,
            status: 'cart', // You can use this to filter items later
            createdAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error adding to cart: ", error);
        throw error;
    }
};

export const getPlanDetails = async (planId) => {
    try {
        const docRef = doc(db, "plans", planId); // Fetch from "plans", not "cart"
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such plan!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching plan details:", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const docRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        throw error;
    }
};

export const getUserOrders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // Query 'orders' collection where customerId matches current user
        const q = query(
            collection(db, "orders"),
            where("customerId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return orders;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const getAgencyOrders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // This assumes your 'orders' documents include an 'agencyId' field
        const q = query(
            collection(db, "orders"),
            where("agencyId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        return orders;
    } catch (error) {
        console.error("Error fetching agency orders:", error);
        throw error;
    }
};

export const getAllOrders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // This assumes your 'orders' documents include an 'agencyId' field
        const q = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching all orders:", error);
        throw error;
    }
};

export const getOrderDetails = async (orderId) => {
    try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const users = [];
        querySnapshot.forEach((doc) => {
            // 把 ID 和数据合并
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

// 2. 删除用户数据 (这就是 Option A)
export const deleteUserFromFirestore = async (userId) => {
    try {
        await deleteDoc(doc(db, "users", userId));
        return true;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

// 3. 管理员更新用户信息 (比如重置名字)
export const adminUpdateUser = async (userId, newData) => {
    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, newData);
        return true;
    } catch (error) {
        console.error("Error admin updating user:", error);
        throw error;
    }
};

export const updateEntertainment = async (entertainmentId, updatedData, newImageUri) => {
    try {
        let finalData = {
            ...updatedData,
            ticketPrice: parseFloat(updatedData.ticketPrice) || 0,
            transportCost: parseFloat(updatedData.transportCost) || 0,
            estimatedTotalExpenses: parseFloat(updatedData.estimatedTotalExpenses) || 0,
            rating: parseFloat(updatedData.rating) || 0,
        };

        // Upload new image if provided
        if (newImageUri) {
            const response = await fetch(newImageUri);
            const blob = await response.blob();
            const filename = `entertainments/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            finalData.imageUrl = await getDownloadURL(storageRef);
        }

        const entRef = doc(db, "entertainments", entertainmentId);
        await updateDoc(entRef, finalData);

        return true;
    } catch (error) {
        console.error("Error updating entertainment:", error);
        throw error;
    }
};

export const getTopAgencies = (orders, limit = 5) => {
    const map = {};
    orders.forEach(o => {
        const name = o.agencyName || "Unknown Agency";
        if (!map[name]) map[name] = { revenue: 0, orders: 0 };
        map[name].revenue += (Number(o.totalAmount) || 0);
        map[name].orders += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, limit);
};

export const getCategoryRevenue = (orders) => {
    const map = {};

    orders.forEach(o => {
        o.items?.forEach(item => {
            const category = item.category || item.type || 'Other';
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 1;

            map[category] = (map[category] || 0) + (price * qty);
        });
    });

    return map;
};

export const getTopSellingItems = (orders, limit = 5) => {
    const map = {};

    orders.forEach(o => {
        o.items?.forEach(item => {
            const title = item.title || "Unknown Item";
            if (!map[title]) {
                map[title] = { qty: 0, revenue: 0 };
            }
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 1;

            map[title].qty += qty;
            map[title].revenue += (price * qty);
        });
    });

    return Object.entries(map)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, limit);
export const toggleFavorite = async (item) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const favRef = doc(db, "users", user.uid, "favorites", item.id);
    const docSnap = await getDoc(favRef);

    if (docSnap.exists()) {
        // Remove if already exists
        await deleteDoc(favRef);
        return false; // Not favorite anymore
    } else {
        // Add to favorites
        await setDoc(favRef, {
            id: item.id,
            title: item.title,
            // Handle different image field names
            image: item.imageUrl || item.image || 'https://via.placeholder.com/150',
            price: parseFloat(item.price) || 0,
            type: item.type, // 'food', 'entertainment', 'plan'
            rating: item.rating || 0,
            locationURL: item.locationURL || "",
            createdAt: new Date().toISOString()
        });
        return true; // Is now favorite
    }
};

// 2. Check if Item is Favorite
export const checkFavoriteStatus = async (itemId) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        const favRef = doc(db, "users", user.uid, "favorites", itemId);
        const docSnap = await getDoc(favRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking favorite:", error);
        return false;
    }
};

// 3. Get All Favorites
export const getFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "favorites"));
        const list = [];
        querySnapshot.forEach((doc) => {
            list.push(doc.data());
        });
        return list;
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return [];
    }
};

export const submitItemRating = async (type, itemId, userRating) => {
    try {
        // 1. Determine Collection Name based on type
        // The type usually comes as 'food' or 'entertainment' (singular)
        // But your collections are 'foods' and 'entertainments' (plural)
        const collectionName = type === 'food' ? 'foods' : 'entertainments';
        
        const docRef = doc(db, collectionName, itemId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error("Item not found");
        }

        const data = docSnap.data();

        // 2. Get existing stats. 
        // If 'ratingCount' doesn't exist yet, we initialize logic:
        // - If current rating > 0, assume count is 1.
        // - If current rating is 0, assume count is 0.
        let currentRating = parseFloat(data.rating) || 0;
        let currentCount = parseInt(data.ratingCount) || (currentRating > 0 ? 1 : 0);

        // 3. Calculate New Average
        // Formula: (OldAvg * OldCount + NewRating) / (OldCount + 1)
        const newCount = currentCount + 1;
        const newAverage = ((currentRating * currentCount) + userRating) / newCount;

        // 4. Update Firestore
        await updateDoc(docRef, {
            rating: parseFloat(newAverage.toFixed(2)), // Keep 2 decimal places
            ratingCount: newCount
        });

        return true;
    } catch (error) {
        console.error("Error submitting rating:", error);
        throw error;
    }
};