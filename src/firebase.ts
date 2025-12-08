import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Support both Vite (import.meta.env) and Next.js (process.env)
const getEnvVar = (viteKey: string, nextKey: string) => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[viteKey];
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env[nextKey];
    }
    return undefined;
};

const firebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID'),
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
