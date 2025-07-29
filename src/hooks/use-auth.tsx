
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
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  createUser: (email: string, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, reauthenticate, changePassword, sendPasswordReset, createUser }}>
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
