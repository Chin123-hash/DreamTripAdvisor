// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAFMhGpNlrox_YKuaIKaI_zwKvanfINk0Y",
    authDomain: "dream-trip-advisor.firebaseapp.com",
    databaseURL: "https://dream-trip-advisor-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dream-trip-advisor",
    storageBucket: "dream-trip-advisor.firebasestorage.app",
    messagingSenderId: "344342252128",
    appId: "1:344342252128:web:4544e3c73f8c4a78e45105",
    measurementId: "G-N20M9ESJ05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services & Export them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
