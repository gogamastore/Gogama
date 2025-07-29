import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAQevbEKAkQfOSPF0VvdO6sSaCZynGGE1s",
  authDomain: "gogama-store.firebaseapp.com",
  databaseURL: "https://gogama-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gogama-store",
  storageBucket: "gogama-store.firebasestorage.app",
  messagingSenderId: "1033847699277",
  appId: "1:1033847699277:web:2b9aa64ead8673ba01a904",
  measurementId: "G-9FNSHP53EK"
};

// Inisialisasi Firebase hanya sekali
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
