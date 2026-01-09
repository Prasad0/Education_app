/**
 * Firebase configuration and initialization
 * 
 * IMPORTANT: You need to get your Firebase Web App configuration from Firebase Console:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select project: coaching-finder-f277f
 * 3. Project Settings > Your apps > Web app (or create one)
 * 4. Copy the config values and replace the placeholders below
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import Constants from 'expo-constants';

// Firebase configuration from your credentials
// TODO: Replace these with your actual Firebase Web App config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyReplaceWithReal", // Replace with your actual API key from Firebase Console
  authDomain: "coaching-finder-f277f.firebaseapp.com",
  projectId: "coaching-finder-f277f",
  storageBucket: "coaching-finder-f277f.appspot.com",
  messagingSenderId: "116596765582781485057",
  appId: "1:116596765582781485057:web:your-app-id", // Replace with your actual app ID from Firebase Console
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
};

export const getFirestoreDB = (): Firestore => {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = getFirestore(firebaseApp);
    
    // Only connect to emulator in development
    if (__DEV__ && Constants.expoConfig?.extra?.useFirestoreEmulator) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
      } catch (error) {
        // Emulator already connected
        console.log('Firestore emulator already connected');
      }
    }
  }
  return db;
};

export default {
  getFirebaseApp,
  getFirestoreDB,
};

