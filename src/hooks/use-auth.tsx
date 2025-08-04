
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
    fetchSignInMethodsForEmail,
    signInWithRedirect,
    getRedirectResult
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
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        setLoading(false);
    });

    // Check for redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // This is the return from a Google redirect
          const user = result.user;
          const userDocRef = doc(db, 'user', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
              // Existing user, log them in and redirect
              const userData = userDoc.data();
              if (userData.role === 'reseller') {
                  router.push('/reseller');
              } else {
                  router.push('/dashboard');
              }
          } else {
              // New user from registration flow
              await setDoc(userDocRef, {
                  name: user.displayName || 'Reseller Baru',
                  email: user.email,
                  whatsapp: user.phoneNumber || '',
                  role: 'reseller'
              });
              router.push('/reseller/profile'); // Redirect new users to complete profile
          }
        }
      })
      .catch((error) => {
        // Handle Errors here.
        console.error("Error getting redirect result", error);
      })
      .finally(() => {
          setIsProcessingRedirect(false);
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
      // Before redirecting, check if user is already registered in our DB
      const userEmail = await promptForEmailIfNecessary(); // This is a conceptual function
      if (!userEmail) { // User cancelled
          // In a real app, you might get the email from a pre-filled form or another method.
          // For simplicity, we'll assume we can't check without a popup, so we just redirect.
      }
      // Since we can't easily check Firestore without knowing the user's email before the redirect,
      // we'll handle the "user not registered" case after they return.
      // The logic in onAuthStateChanged and getRedirectResult will handle this.
      await signInWithRedirect(auth, provider);
  };

  const registerWithGoogle = async(): Promise<void> => {
       const provider = new GoogleAuthProvider();
       // The logic to differentiate between login/register will happen
       // in the getRedirectResult handler. We just initiate the flow here.
       await signInWithRedirect(auth, provider);
  }

  // A conceptual helper function. In a real scenario, you would have a way to get the user's email
  // before initiating a sign-in, perhaps from an input field.
  const promptForEmailIfNecessary = async (): Promise<string | null> => {
      // This is a placeholder. Without a UI element to get the email, we can't check if the user
      // exists in Firestore before the redirect. The check must happen after.
      return 'user-is-about-to-sign-in';
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
