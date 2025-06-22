import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// You'll need to replace this with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBLvkzSUFm0PT6bDX4dYJgLeSbW8D4aoGk",
    authDomain: "pf2encounterbuilder.firebaseapp.com",
    projectId: "pf2encounterbuilder",
    storageBucket: "pf2encounterbuilder.firebasestorage.app",
    messagingSenderId: "160170958271",
    appId: "1:160170958271:web:87ae48795ad87d33a0550a",
    measurementId: "G-MKWBS4770S"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app; 