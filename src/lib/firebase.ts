import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB0OnO52aS47BpRHcWfM9URCsHZ3eVa_tM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "catfisher-61185.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "catfisher-61185",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "catfisher-61185.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "46032951855",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:46032951855:web:dfe0993de0edfd9d1bc4da",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-Y7SX7RYB75",
};

// Prevent multiple initializations during Next.js hot-reloading
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export Auth, Google Provider, and Firestore for matchmaking & live chat
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const db = getFirestore(app);

// Safely initialize Analytics only in the browser
const analytics = typeof window !== "undefined" ? isSupported().then((yes) => (yes ? getAnalytics(app) : null)) : null;

export const isLiveFirebaseConfigured = true;
export const isFirebaseConfigured = true;

/**
 * Real Google Sign-In with popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { app, auth, googleProvider, db, analytics, signInWithPopup, signOut, onAuthStateChanged };
export type { User };
