
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
  purchasePrice: number;
  quantity: number;
}

interface PurchaseCartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity: number }) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPurchase: number;
}

const PurchaseCartContext = createContext<PurchaseCartContextType | undefined>(undefined);

export const usePurchaseCart = (): PurchaseCartContextType => {
  const context = useContext(PurchaseCartContext);
  if (context === undefined) {
    throw new Error('usePurchaseCart must be used within a PurchaseCartProvider');
  }
  return context;
};

// The PurchaseCartProvider component has been moved to src/app/dashboard/layout.tsx
// to resolve the build error caused by JSX in a .ts file.
