// src/services/AuthService.js
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
