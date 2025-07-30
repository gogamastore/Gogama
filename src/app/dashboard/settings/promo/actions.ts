
"use server";

import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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
            
            // Safety check for Timestamp objects before converting
            const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : null;
            const endDate = data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : null;

            if (!startDate || !endDate) {
                 console.warn(`Skipping promotion ${doc.id} due to invalid date format.`);
                return null;
            }

            return {
                ...product,
                promoId: doc.id,
                discountPrice: data.discountPrice,
                startDate: startDate,
                endDate: endDate
            } as Promotion;
        }).filter(p => p !== null) as Promotion[];

        return { promotions: promoData, products: productsData };

    } catch (error) {
        console.error("Error fetching promotions and products in server action: ", error);
        throw new Error("Could not fetch data.");
    }
}
