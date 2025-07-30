"use server";

import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
}

interface PromotionDocument {
    productId: string;
    discountPrice: number;
    startDate: Timestamp;
    endDate: Timestamp;
    // other fields...
}

interface Promotion extends Product {
    promoId: string;
    discountPrice: number;
    startDate: string; // Store as ISO string for serialization
    endDate: string; // Store as ISO string
}


export async function getPromotionsAndProducts(): Promise<{promotions: Promotion[], products: Product[]}> {
    try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        const promoSnapshot = await getDocs(query(collection(db, 'promotions'), orderBy('endDate', 'desc')));
        const promoData = promoSnapshot.docs.map(doc => {
            const data = doc.data() as PromotionDocument;
            const product = productsData.find(p => p.id === data.productId);
            if (!product) return null;
            
            return {
                ...product,
                promoId: doc.id,
                discountPrice: data.discountPrice,
                startDate: data.startDate.toDate().toISOString(),
                endDate: data.endDate.toDate().toISOString()
            } as Promotion;
        }).filter(p => p !== null) as Promotion[];

        return JSON.parse(JSON.stringify({ promotions: promoData, products: productsData }));

    } catch (error) {
        console.error("Error fetching promotions and products in server action: ", error);
        throw new Error("Could not fetch data.");
    }
}
