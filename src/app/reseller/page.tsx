
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Search, ShoppingCart, Info, PackageX } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  image: string;
  'data-ai-hint': string;
  stock: number;
  description?: string;
}

const formatCurrency = (value: string): string => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value.replace(/[^0-9]/g, '')));
}


function ProductDetailDialog({ product, onAddToCart, children }: { product: Product, onAddToCart: (product: Product) => void, children: React.ReactNode }) {
    const stockAvailable = product.stock > 0;
    const [isOpen, setIsOpen] = useState(false);
    
    const handleAddToCartClick = () => {
        onAddToCart(product);
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
                             <p className="text-3xl font-bold text-primary">{product.price}</p>
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
                        <Button onClick={handleAddToCartClick} disabled={!stockAvailable} size="lg">
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            {stockAvailable ? 'Tambah ke Keranjang' : 'Stok Habis'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function ResellerDashboard() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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
            setAllProducts(productsData);
            setFilteredProducts(productsData);
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

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const results = allProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
      const skuMatch = String(product.sku || '').toLowerCase().includes(lowercasedFilter);
      return nameMatch || skuMatch;
    });
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, allProducts]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, filteredProducts]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
             <h2 className="text-2xl font-bold font-headline">Galeri Produk</h2>
             <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari nama atau SKU produk..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
             paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {paginatedProducts.map((product) => {
                      const stockAvailable = product.stock > 0;
                      return (
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
                                {!stockAvailable && (
                                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                       <Badge variant="destructive">Stok Habis</Badge>
                                   </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                                <p className="text-muted-foreground mt-1">{product.price}</p>
                                <ProductDetailDialog product={product} onAddToCart={handleAddToCart}>
                                    <Button className="w-full mt-4" variant="secondary" disabled={!stockAvailable}>
                                        {stockAvailable ? <ShoppingCart className="mr-2 h-4 w-4" /> : <PackageX className="mr-2 h-4 w-4" />}
                                        {stockAvailable ? 'Tambah ke Keranjang' : 'Stok Habis'}
                                    </Button>
                                </ProductDetailDialog>
                            </div>
                            </CardContent>
                        </Card>
                      )
                    })}
                </div>
             ) : (
                <div className="text-center py-20 bg-card rounded-lg border">
                    <h2 className="mt-6 text-xl font-semibold">Produk Tidak Ditemukan</h2>
                    <p className="mt-2 text-muted-foreground">
                        Coba gunakan kata kunci pencarian yang berbeda.
                    </p>
                </div>
             )
          )}
        </section>

        {filteredProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between w-full text-sm text-muted-foreground mt-8">
                <div className="flex-1">
                    Menampilkan {paginatedProducts.length} dari {filteredProducts.length} produk.
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <p>Produk per halaman</p>
                        <Select
                            value={`${itemsPerPage}`}
                            onValueChange={(value) => {
                                setItemsPerPage(Number(value));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={itemsPerPage} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[12, 24, 48].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>Halaman {currentPage} dari {totalPages}</div>
                    <div className="flex items-center gap-2">
                        <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        >
                        <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        >
                        <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  )
}
