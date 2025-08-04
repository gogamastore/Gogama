
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  "projectId": "orderflow-r7jsk",
  "appId": "1:954515661623:web:cde7b76e569ebab32ef0b2",
  "storageBucket": "orderflow-r7jsk.firebasestorage.app",
  "apiKey": "AIzaSyAoSTtdMU938EgQ0KoaHpCKXMVUOebU0I8",
  "authDomain": "orderflow-r7jsk.firebaseapp.com",
  "messagingSenderId": "954515661623"
};

// Initialize Firebase using a singleton pattern
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
