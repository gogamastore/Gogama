
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  'data-ai-hint': string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, ''));
}


export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useAuth();

  const getCartKey = useCallback((uid: string | null | undefined) => {
      if (!uid) return null;
      return `reseller-cart-${uid}`;
  }, []);
  

  // Load cart from localStorage when user state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const cartKey = getCartKey(user?.uid);
        if (cartKey) {
            try {
                const savedCart = window.localStorage.getItem(cartKey);
                if (savedCart) {
                    setCart(JSON.parse(savedCart));
                } else {
                    setCart([]); // Reset cart for new user login
                }
            } catch (error) {
                console.error('Failed to parse cart from localStorage', error);
                setCart([]);
            }
        } else {
            // If no user, clear the cart
            setCart([]);
        }
        setIsHydrated(true);
    }
  }, [user, getCartKey]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
        const cartKey = getCartKey(user?.uid);
        if (cartKey) {
            try {
                window.localStorage.setItem(cartKey, JSON.stringify(cart));
            } catch (error) {
                console.error('Failed to save cart to localStorage', error);
            }
        }
    }
  }, [cart, isHydrated, user, getCartKey]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      // Remove item if quantity is less than 1
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setCart([]);
  }

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cart.reduce((total, item) => total + (parseCurrency(item.price) * item.quantity), 0);
  
  const value = {
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems: isHydrated && user ? totalItems : 0, // Return 0 on server / before hydration or if no user
      totalAmount: isHydrated && user ? totalAmount : 0,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
