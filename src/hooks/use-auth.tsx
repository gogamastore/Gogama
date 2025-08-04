
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    User,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isProcessingRedirect: boolean; 
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  createUser: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  registerWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isProcessingRedirect = false; 
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const reauthenticate = (password: string) => {
    if (!user) {
        throw new Error("User not authenticated");
    }
    const credential = EmailAuthProvider.credential(user.email!, password);
    return reauthenticateWithCredential(user, credential);
  };

  const changePassword = (password: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      return updatePassword(user, password);
  };

  const sendPasswordReset = (email: string) => {
      return sendPasswordResetEmail(auth, email);
  }
  
  const createUser = (email: string, password: string) => {
      return createUserWithEmailAndPassword(auth, email, password);
  }

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userDocRef = doc(db, 'user', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            // User exists, log them in and redirect
            const userData = userDoc.data();
            if (userData.role === 'reseller') {
                router.push('/reseller');
            } else {
                router.push('/dashboard');
            }
        } else {
            // New user, create document in Firestore and treat as a reseller registration
            await setDoc(userDocRef, {
                name: user.displayName || 'Reseller Baru',
                email: user.email,
                whatsapp: user.phoneNumber || '',
                role: 'reseller'
            });
            router.push('/reseller'); 
        }
    } catch (error: any) {
        // Handle specific auth errors if needed, otherwise re-throw
        console.error("Google Auth failed:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
          throw error;
        }
    }
  };

  // Both sign-in and register now use the same robust logic
  const signInWithGoogle = () => handleGoogleAuth();
  const registerWithGoogle = () => handleGoogleAuth();
  

  return (
    <AuthContext.Provider value={{ user, loading, isProcessingRedirect, signIn, signOut, reauthenticate, changePassword, sendPasswordReset, createUser, signInWithGoogle, registerWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
