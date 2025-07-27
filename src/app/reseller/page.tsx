"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { MessageSquare, ShoppingCart } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  'data-ai-hint': string;
}

export default function ResellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    async function getProducts() {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const productsData = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            } as Product));
            setProducts(productsData);
        } catch(error) {
            console.error("Failed to fetch products:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat produk",
                description: "Tidak bisa mengambil data produk dari server."
            })
        } finally {
            setLoading(false);
        }
    }
    getProducts();
  }, [toast]);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({
        title: "Produk Ditambahkan",
        description: `${product.name} telah ditambahkan ke keranjang.`,
    });
  };

  return (
    <div className="relative">
      <div className="container mx-auto px-4 py-8">
        <section className="mb-8">
            <Carousel className="w-full">
                <CarouselContent>
                    <CarouselItem>
                        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
                            <Image src="https://placehold.co/1200x400.png" alt="Banner 1" fill style={{ objectFit: 'cover' }} data-ai-hint="fashion sale" />
                            <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white p-4 text-center">
                                <h2 className="text-3xl md:text-5xl font-bold font-headline">Koleksi Terbaru</h2>
                                <p className="mt-2 text-lg">Diskon hingga 30% untuk member baru!</p>
                                <Button className="mt-4">Belanja Sekarang</Button>
                            </div>
                        </div>
                    </CarouselItem>
                     <CarouselItem>
                        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
                            <Image src="https://placehold.co/1200x400.png" alt="Banner 2" fill style={{ objectFit: 'cover' }} data-ai-hint="new arrivals" />
                             <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white p-4 text-center">
                                <h2 className="text-3xl md:text-5xl font-bold font-headline">Produk Terlaris</h2>
                                <p className="mt-2 text-lg">Jangan sampai kehabisan stok favoritmu.</p>
                                <Button className="mt-4">Lihat Produk</Button>
                            </div>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="absolute left-4" />
                <CarouselNext className="absolute right-4" />
            </Carousel>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 font-headline">Galeri Produk</h2>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                <Card key={product.id} className="overflow-hidden group">
                    <CardContent className="p-0">
                    <div className="relative">
                        <Image
                        src={product.image}
                        alt={product.name}
                        width={400}
                        height={400}
                        className="object-cover w-full h-auto aspect-square group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint={product['data-ai-hint'] || 'product image'}
                        />
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-muted-foreground mt-1">{product.price}</p>
                        <Button className="w-full mt-4" variant="secondary" onClick={() => handleAddToCart(product)}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Tambah ke Keranjang
                        </Button>
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          )}
        </section>
      </div>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <MessageSquare className="h-7 w-7" />
        <span className="sr-only">Chat</span>
      </Button>
    </div>
  )
}
