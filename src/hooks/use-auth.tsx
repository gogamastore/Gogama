
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
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

interface GoogleSignInResult {
    user: User;
    isNewUser: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isProcessingRedirect: boolean; // This might be obsolete now, but keep for safety
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  createUser: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<User | null>;
  registerWithGoogle: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true); // Kept for safety
  const router = useRouter();

   useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setIsProcessingRedirect(false); // Stop processing once we have a user state
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

  const signInWithGoogle = async (): Promise<User | null> => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // IMPORTANT: We only log in existing users. We check if they exist in Auth.
        // Firebase signInWithPopup already handles this, if the user doesn't exist it throws an error or requires linking.
        // A more robust check is to see if they have a document in Firestore.
        const userDocRef = doc(db, 'user', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // User exists in Auth but not in our Firestore DB (edge case) or is new.
            // For this flow, we log them out and ask them to register.
            await firebaseSignOut(auth);
            return null;
        }
        
        // User exists, now redirect based on role
         const userData = userDoc.data();
         if (userData.role === 'reseller') {
             router.push('/reseller');
         } else {
             router.push('/dashboard');
         }
        return user;

      } catch (error) {
          console.error("Google Sign-In failed", error);
          return null;
      }
  };

  const registerWithGoogle = async(): Promise<User | null> => {
       const provider = new GoogleAuthProvider();
       try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, 'user', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // User is already registered.
                await firebaseSignOut(auth); // Log them out to force login
                return null; // Indicate failure due to existing user
            }

            // New user, create Firestore document
            await setDoc(userDocRef, {
                name: user.displayName || 'Reseller Baru',
                email: user.email,
                whatsapp: user.phoneNumber || '',
                role: 'reseller'
            });

            router.push('/reseller/profile'); // Redirect to profile to complete details
            return user;

       } catch (error) {
           console.error("Google Registration failed", error);
           return null;
       }
  }

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
