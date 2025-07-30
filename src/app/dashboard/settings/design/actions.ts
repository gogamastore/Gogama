"use server";

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function getBanners() {
    try {
        const q = query(collection(db, 'banners'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const banners = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // The object is not serializable, so we need to convert it to a plain object
        return JSON.parse(JSON.stringify(banners));
    } catch (error) {
        console.error("Error fetching banners in server action: ", error);
        throw new Error("Could not fetch banners.");
    }
}
