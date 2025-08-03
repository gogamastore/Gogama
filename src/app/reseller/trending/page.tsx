
"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, ShoppingCart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ProductDetailDialog } from "../components/product-detail-dialog"

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  image: string;
  'data-ai-hint': string;
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


export default function TrendingProductsPage() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    async function fetchTrendingProducts() {
        setLoading(true);
        try {
            const productsSnapshot = await getDocs(collection(db, "products"));
            const productsMap = new Map<string, Product>();
            productsSnapshot.forEach(doc => {
                productsMap.set(doc.id, { 
                    id: doc.id, 
                    ...doc.data(),
                    stock: doc.data().stock || 0,
                    description: doc.data().description || ''
                } as Product);
            });
            
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

            const trendingSnapshot = await getDocs(collection(db, "trending_products"));
            const trendingProductIds = new Set(trendingSnapshot.docs.map(doc => doc.data().productId));
            
            const trendingList = Array.from(productsMap.values())
                .filter(p => trendingProductIds.has(p.id))
                .map(product => {
                     if (activePromos.has(product.id)) {
                        product.isPromo = true;
                        product.discountPrice = formatCurrency(activePromos.get(product.id)!.discountPrice);
                    }
                    return product;
                });

            setTrendingProducts(trendingList);
        } catch(error) {
            console.error("Failed to fetch trending products:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat produk",
            })
        } finally {
            setLoading(false);
        }
    }
    fetchTrendingProducts();
  }, [toast]);

  const renderProductCard = (product: Product) => {
    const stockAvailable = product.stock > 0;
    return (
      <Card key={product.id} className="overflow-hidden group">
          <CardContent className="p-0">
          <ProductDetailDialog product={product}>
              <div className="relative cursor-pointer">
                  {product.isPromo && <Badge className="absolute top-2 left-2 z-10" variant="destructive">Promo</Badge>}
                  <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="object-cover w-full h-auto aspect-square group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={product['data-ai-hint'] || 'product image'}
                  />
                  {!stockAvailable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="destructive">Stok Habis</Badge>
                  </div>
                  )}
              </div>
          </ProductDetailDialog>
          <div className="p-4">
              <ProductDetailDialog product={product}>
                  <h3 className="font-semibold text-lg truncate cursor-pointer hover:underline">{product.name}</h3>
              </ProductDetailDialog>
              {product.isPromo && product.discountPrice ? (
                  <div className="flex items-baseline gap-2">
                       <p className="text-muted-foreground mt-1 line-through">{formatCurrency(product.price)}</p>
                       <p className="text-red-600 font-bold">{formatCurrency(product.discountPrice)}</p>
                  </div>
              ) : (
                  <p className="text-muted-foreground mt-1">{formatCurrency(product.price)}</p>
              )}
              <ProductDetailDialog product={product}>
                    <Button className="w-full mt-4" variant="secondary" disabled={!stockAvailable}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Detail & Pesan
                    </Button>
              </ProductDetailDialog>
          </div>
          </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali</span>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Produk Trending</h1>
        </div>

        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(8)].map((_, i) => (
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingProducts.map(renderProductCard)}
            </div>
        )}
    </div>
  )
}
