
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
    signInWithRedirect,
    getRedirectResult
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
  isProcessingRedirect: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  createUser: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This effect handles the result of a redirect sign-in.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User has successfully signed in via redirect.
          const user = result.user;
          const userDocRef = doc(db, 'user', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            // This is a new user
            await setDoc(userDocRef, {
              name: user.displayName,
              email: user.email,
              whatsapp: user.phoneNumber || '',
              role: 'reseller'
            });
            // Redirect new users to their profile to complete it.
            router.push('/reseller/profile');
          } else {
            // Existing user, redirect based on role
            const userData = userDoc.data();
            if (userData.role === 'reseller') {
              router.push('/reseller');
            } else {
              router.push('/dashboard');
            }
          }
          setUser(user);
        }
      })
      .catch((error) => {
        console.error("Error during redirect result handling:", error);
      })
      .finally(() => {
        setIsProcessingRedirect(false);
      });

    // This listener handles all other auth state changes (manual login, logout, session persistence).
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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

  const signInWithGoogle = async (): Promise<void> => {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isProcessingRedirect, signIn, signOut, reauthenticate, changePassword, sendPasswordReset, createUser, signInWithGoogle }}>
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
