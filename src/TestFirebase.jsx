import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";

export default function TestFirebase() {
    const [status, setStatus] = useState("Checking...");

    useEffect(() => {
        try {
            const firebaseConfig = {
                apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
                authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
                projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
                storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
                messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
                appId: import.meta.env.VITE_FIREBASE_APP_ID,
            };

            initializeApp(firebaseConfig);
            setStatus("✅ Firebase initialized successfully!");
        } catch (err) {
            setStatus("❌ Firebase initialization failed: " + err);
        }
    }, []);

    return (
        <div style={{ padding: 20, fontSize: 20 }}>
            <p>{status}</p>
        </div>
    );
}
