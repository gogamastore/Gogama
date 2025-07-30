
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
import { ChevronLeft, ChevronRight, Search, ShoppingCart, Info, PackageX, Plus, Minus, Tags } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useEffect, useState, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  image: string;
  'data-ai-hint': string;
  stock: number;
  description?: string;
  // Promo fields
  isPromo?: boolean;
  discountPrice?: string;
}

interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
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
                             {product.isPromo && product.discountPrice ? (
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-bold text-primary">{formatCurrency(product.discountPrice)}</p>
                                    <p className="text-lg font-normal text-muted-foreground line-through">{formatCurrency(product.price)}</p>
                                </div>
                            ) : (
                                <p className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</p>
                            )}
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


export default function ResellerDashboard() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promotions, setPromotions] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const { toast } = useToast();

  useEffect(() => {
    async function getPageData() {
        setLoading(true);
        try {
            // Fetch Promotions
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

            // Fetch Products
            const productsSnapshot = await getDocs(collection(db, "products"));
            const productsData = productsSnapshot.docs.map(doc => {
                const product = { 
                    id: doc.id, 
                    ...doc.data(),
                    stock: doc.data().stock || 0,
                    description: doc.data().description || '',
                } as Product;
                
                if (activePromos.has(product.id)) {
                    product.isPromo = true;
                    product.discountPrice = formatCurrency(activePromos.get(product.id)!.discountPrice);
                }
                return product;
            });

            const promoProducts = productsData.filter(p => p.isPromo);
            setPromotions(promoProducts);

            setAllProducts(productsData);
            setFilteredProducts(productsData);

            // Fetch Banners
            const bannersQuery = query(collection(db, 'banners'), where('isActive', '==', true), orderBy('order', 'asc'));
            const bannersSnapshot = await getDocs(bannersQuery);
            const bannersData = bannersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
            setBanners(bannersData);

        } catch(error) {
            console.error("Failed to fetch page data:", error);
            toast({
                variant: "destructive",
                title: "Gagal memuat halaman",
                description: "Tidak bisa mengambil data dari server."
            })
        } finally {
            setLoading(false);
        }
    }
    getPageData();
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
    <div className="relative">
      <div className="container mx-auto px-4 py-8">
        <section className="mb-8">
            <Carousel 
                className="w-full"
                plugins={[
                    Autoplay({
                        delay: 4000,
                        stopOnInteraction: true,
                    })
                ]}
            >
                <CarouselContent>
                    {banners.length > 0 ? banners.map(banner => (
                        <CarouselItem key={banner.id}>
                            <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
                                <Image src={banner.imageUrl} alt={banner.title} fill style={{ objectFit: 'cover' }} />
                                <div className="absolute inset-0 bg-black/30 flex flex-col justify-center items-center text-white p-4 text-center">
                                    <h2 className="text-3xl md:text-5xl font-bold font-headline">{banner.title}</h2>
                                    <p className="mt-2 text-lg">{banner.description}</p>
                                    <Button asChild className="mt-4">
                                        <Link href={banner.buttonLink || '#'}>{banner.buttonText}</Link>
                                    </Button>
                                </div>
                            </div>
                        </CarouselItem>
                    )) : (
                         <CarouselItem>
                            <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg bg-muted animate-pulse">
                            </div>
                        </CarouselItem>
                    )}
                </CarouselContent>
                {banners.length > 1 && <>
                    <CarouselPrevious className="absolute left-4" />
                    <CarouselNext className="absolute right-4" />
                </>}
            </Carousel>
        </section>

        {promotions.length > 0 && (
            <section className="mb-12">
                 <div className="flex items-center gap-2 mb-4">
                    <Tags className="h-6 w-6 text-primary"/>
                    <h2 className="text-2xl font-bold font-headline">Produk Promo</h2>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                     {promotions.map(renderProductCard)}
                 </div>
            </section>
        )}

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
                    {paginatedProducts.map(renderProductCard)}
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
