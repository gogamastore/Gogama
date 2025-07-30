
"use server";

import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getBanners() {
    try {
        const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const banners = querySnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Firestore Timestamps are not serializable, so we convert them to strings
            // for the client component.
            const serializedData: { [key: string]: any } = { ...data };
            if (data.createdAt instanceof Timestamp) {
                serializedData.createdAt = data.createdAt.toDate().toISOString();
            }

            return {
                id: doc.id,
                ...serializedData
            };
        });
        
        return banners;
    } catch (error) {
        console.error("Error fetching banners in server action: ", error);
        throw new Error("Could not fetch banners.");
    }
}
