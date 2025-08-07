
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard from "../product-card";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  'data-ai-hint'?: string;
  stock: number;
  description?: string;
  isPromo?: boolean;
  discountPrice?: string;
}

interface Promotion {
    productId: string;
    discountPrice: number;
    startDate: Timestamp;
    endDate: Timestamp;
}

const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
}

export default function ProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                const productsSnapshot = await getDocs(collection(db, "products"));
                const productsData = productsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    stock: doc.data().stock || 0,
                    description: doc.data().description || ''
                } as Product));

                // Check for active promotions
                const now = new Date();
                const promoQuery = query(collection(db, "promotions"), where("endDate", ">", now));
                const promoSnapshot = await getDocs(promoQuery);
                const activePromos = new Map<string, { discountPrice: number }>();
                promoSnapshot.forEach(doc => {
                    const data = doc.data() as Promotion;
                    if (data.startDate.toDate() <= now) {
                        activePromos.set(data.productId, { discountPrice: data.discountPrice });
                    }
                });

                const finalProducts = productsData.map(product => {
                    if (activePromos.has(product.id)) {
                        product.isPromo = true;
                        product.discountPrice = formatCurrency(activePromos.get(product.id)!.discountPrice);
                    }
                    return product;
                });

                setProducts(finalProducts);

            } catch (error) {
                console.error("Failed to fetch products:", error);
                toast({
                    variant: "destructive",
                    title: "Gagal memuat produk",
                });
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [toast]);

    return (
        <section className="w-full py-6 md:py-10">
            <div className="container max-w-screen-2xl">
                <h2 className="text-2xl font-bold font-headline mb-6 text-center">Untuk Anda</h2>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                        {[...Array(10)].map((_, i) => (
                            <Card key={i} className="overflow-hidden group">
                                <div className="bg-muted aspect-square w-full animate-pulse"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                                    <div className="h-10 w-full bg-muted rounded animate-pulse mt-4"></div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
