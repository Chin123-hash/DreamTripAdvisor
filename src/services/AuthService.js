// src/services/AuthService.js
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    addDoc, arrayRemove, arrayUnion, collection,
    deleteDoc,
    doc, getDoc, getDocs, orderBy, // Changed from onSnapshot for simpler one-time fetch
    query, setDoc,

    updateDoc
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

        // 3. Save Data to Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            role: 'agency',
            agencyName: agencyData.agencyName,
            licenseNo: agencyData.licenseNo,
            companyUrl: agencyData.companyUrl,
            logoUrl: logoUrl, // We save the link, not the file!
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

        // Fetch their role (Traveller or Agency?)
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        return { user, role: userData?.role };
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
            suggestedTransport: data.suggestedTransport,
            transportCost: parseFloat(data.transportCost) || 0,
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
export const addItemToPlan = async (planId, itemData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const planRef = doc(db, "users", user.uid, "plans", planId);

        await updateDoc(planRef, {
            items: arrayUnion({
                itemId: itemData.id, // Ensure we use 'id'
                title: itemData.title,
                price: parseFloat(itemData.price), // Store as number
                image: itemData.imageUrl,
                type: 'entertainment',
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

export const deleteItemFromPlan = async (planId, itemId) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const planRef = doc(db, "users", user.uid, "plans", planId);
        await updateDoc(planRef, {
            items: arrayRemove({ itemId: itemId })
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
            priceRange: data.priceRange, // e.g., "RM 10 - RM 30"
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
        let finalData = { ...updatedData };

        if (newImageUri) {
            const response = await fetch(newImageUri);
            const blob = await response.blob();
            const filename = `foods/${new Date().getTime()}.jpg`;
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