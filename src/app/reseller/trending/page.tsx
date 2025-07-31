
"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, ShoppingCart, Info, PackageX, Plus, Minus, Flame, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  image: string;
  'data-ai-hint': string;
  stock: number;
  description?: string;
  totalSold?: number;
}

const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
}

function ProductDetailDialog({ product, children }: { product: Product, children: React.ReactNode }) {
    const stockAvailable = product.stock > 0;
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const { toast } = useToast();
    
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
        }
    }, [isOpen]);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= product.stock) {
            setQuantity(newQuantity);
        }
    }

    const handleAddToCartClick = () => {
        addToCart(product, quantity);
        toast({
            title: "Produk Ditambahkan",
            description: `${quantity}x ${product.name} telah ditambahkan ke keranjang.`,
        });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Image
                            src={product.image}
                            alt={product.name}
                            width={600}
                            height={600}
                            className="rounded-lg object-cover w-full h-auto aspect-square"
                            data-ai-hint={product['data-ai-hint'] || 'product image'}
                        />
                    </div>
                    <div className="flex flex-col space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold font-headline">{product.name}</DialogTitle>
                        </DialogHeader>
                        <div>
                             <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
                             <div className="mt-2">
                                {stockAvailable ? (
                                    <Badge variant="default">Stok Tersedia: {product.stock}</Badge>
                                ) : (
                                    <Badge variant="destructive">Stok Habis</Badge>
                                )}
                             </div>
                        </div>
                        <DialogDescription className="text-base text-muted-foreground flex-1">
                          {product.description || "Tidak ada deskripsi untuk produk ini."}
                        </DialogDescription>
                        
                        <div className="flex items-end gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="quantity">Jumlah</Label>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity - 1)} disabled={!stockAvailable || quantity <= 1}>
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                                        className="w-16 h-10 text-center"
                                        min={1}
                                        max={product.stock}
                                        disabled={!stockAvailable}
                                    />
                                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(quantity + 1)} disabled={!stockAvailable || quantity >= product.stock}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <Button onClick={handleAddToCartClick} disabled={!stockAvailable} size="lg" className="flex-1">
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {stockAvailable ? 'Tambah' : 'Stok Habis'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const renderProductCard = (product: Product) => {
    const stockAvailable = product.stock > 0;
    return (
      <Card key={product.id} className="overflow-hidden group">
          <CardContent className="p-0">
          <ProductDetailDialog product={product}>
              <div className="relative cursor-pointer">
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
              <p className="text-muted-foreground mt-1">{formatCurrency(product.price)}</p>
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


export default function TrendingProductsPage() {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    async function getTrendingData() {
        setLoading(true);
        try {
            const productsSnapshot = await getDocs(collection(db, "products"));
            const productsData = productsSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                stock: doc.data().stock || 0,
                description: doc.data().description || '',
            } as Product));

            const ordersQuery = query(collection(db, "orders"), where("status", "in", ["Delivered", "Shipped"]));
            const ordersSnapshot = await getDocs(ordersQuery);
            const salesCount = new Map<string, number>();
            ordersSnapshot.forEach(orderDoc => {
                const orderData = orderDoc.data();
                orderData.products?.forEach((p: { productId: string; quantity: number; }) => {
                    salesCount.set(p.productId, (salesCount.get(p.productId) || 0) + p.quantity);
                });
            });

            const trendingData = productsData
                .map(p => ({...p, totalSold: salesCount.get(p.id) || 0}))
                .filter(p => p.totalSold > 0) // Only show products that have been sold
                .sort((a, b) => b.totalSold - a.totalSold);
            
            setTrendingProducts(trendingData);

        } catch(error) {
            console.error("Failed to fetch trending products:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat halaman",
                description: "Tidak bisa mengambil data dari server."
            })
        } finally {
            setLoading(false);
        }
    }
    getTrendingData();
  }, [toast]);


  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Kembali</span>
            </Button>
            <div className="flex items-center gap-2">
                <Flame className="h-7 w-7 text-primary"/>
                <h1 className="text-3xl font-bold font-headline">Semua Produk Trending</h1>
            </div>
       </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          trendingProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {trendingProducts.map(renderProductCard)}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-lg border">
                <PackageX className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-6 text-xl font-semibold">Belum Ada Produk Trending</h2>
                <p className="mt-2 text-muted-foreground">
                    Belum ada produk yang terjual.
                </p>
            </div>
          )
      )}
    </div>
  )
}
