
"use server";

import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getBanners() {
    try {
        const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const banners = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Handle non-serializable Timestamp
            if (data.createdAt && data.createdAt instanceof Timestamp) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            return {
                id: doc.id,
                ...data
            };
        });
        // The object should now be serializable
        return JSON.parse(JSON.stringify(banners));
    } catch (error) {
        console.error("Error fetching banners in server action: ", error);
        throw new Error("Could not fetch banners.");
    }
}
