
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { collection, getDocs, addDoc, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Search, ShoppingCart, Trash2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string; // This is selling price, we need purchase price
  stock: number;
  image: string;
  purchasePrice?: number;
}

interface CartItem extends Product {
  purchasePrice: number;
  quantity: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

function AddToCartDialog({ product, onAddToCart }: { product: Product, onAddToCart: (quantity: number, purchasePrice: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice || 0);

  const handleSave = () => {
    onAddToCart(quantity, purchasePrice);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah ke Keranjang Pembelian</DialogTitle>
          <DialogDescription>
            Masukkan jumlah dan harga beli untuk produk: <strong>{product.name}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Jumlah
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase-price" className="text-right">
              Harga Beli (satuan)
            </Label>
            <Input
              id="purchase-price"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="col-span-3"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function PurchaseTransactionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchProducts = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const productsData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setProducts(productsData);
      setFilteredProducts(productsData);
      setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const results = products.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const skuMatch = product.sku ? product.sku.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        return nameMatch || skuMatch;
    });
    setFilteredProducts(results);
  }, [searchTerm, products]);
  
  const handleAddToCart = (product: Product, quantity: number, purchasePrice: number) => {
    setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === product.id);
        if (existingItem) {
            // Update quantity and price of existing item
            return prevCart.map(item => 
                item.id === product.id 
                ? { ...item, quantity: item.quantity + quantity, purchasePrice: purchasePrice } 
                : item
            );
        }
        // Add new item
        return [...prevCart, { ...product, quantity, purchasePrice }];
    });
     toast({
        title: "Produk Ditambahkan",
        description: `${product.name} telah ditambahkan ke keranjang.`,
    });
  };
  
  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };
  
  const handleClearCart = () => {
    setCart([]);
  }

  const totalPurchase = useMemo(() => {
    return cart.reduce((total, item) => total + (item.purchasePrice * item.quantity), 0);
  }, [cart]);

  const handleProcessTransaction = async () => {
    if (cart.length === 0) {
        toast({ variant: "destructive", title: "Keranjang Kosong", description: "Tambahkan produk terlebih dahulu." });
        return;
    }
    setIsProcessing(true);
    const batch = writeBatch(db);

    try {
        // 1. Create a new purchase transaction document
        const purchaseTransactionRef = doc(collection(db, "purchase_transactions"));
        batch.set(purchaseTransactionRef, {
            date: serverTimestamp(),
            totalAmount: totalPurchase,
            items: cart.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                purchasePrice: item.purchasePrice,
            })),
            supplier: "Supplier Umum", // Placeholder
        });

        // 2. Update stock for each product in the cart
        for (const item of cart) {
            const productRef = doc(db, "products", item.id);
            const newStock = item.stock + item.quantity;
            batch.update(productRef, { stock: newStock, purchasePrice: item.purchasePrice });
        }

        // 3. Commit the batch
        await batch.commit();

        toast({
            title: "Transaksi Berhasil",
            description: "Transaksi pembelian telah disimpan dan stok produk telah diperbarui.",
        });

        // 4. Clear cart and refresh product list
        setCart([]);
        fetchProducts();

    } catch (error) {
        console.error("Error processing transaction:", error);
        toast({
            variant: "destructive",
            title: "Transaksi Gagal",
            description: "Terjadi kesalahan saat menyimpan transaksi.",
        });
    } finally {
        setIsProcessing(false);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Product List */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
            <CardDescription>Cari dan pilih produk untuk ditambahkan ke keranjang pembelian.</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk berdasarkan nama atau SKU..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[80px] sm:table-cell">Gambar</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Stok Saat Ini</TableHead>
                            <TableHead className="text-right w-[120px]">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Memuat produk...</TableCell>
                            </TableRow>
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={product.image || "https://placehold.co/64x64.png"}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell className="text-right">
                                        <AddToCartDialog 
                                            product={product} 
                                            onAddToCart={(quantity, purchasePrice) => handleAddToCart(product, quantity, purchasePrice)} 
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Produk tidak ditemukan.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Cart */}
      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Keranjang Pembelian</CardTitle>
                    <CardDescription>Daftar produk yang akan dibeli.</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" onClick={handleClearCart} disabled={cart.length === 0}>
                    <XCircle className="h-5 w-5" />
                    <span className="sr-only">Kosongkan Keranjang</span>
                 </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {cart.length > 0 ? (
                <div className="overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produk</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                                <TableHead className="w-[40px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.quantity} x {formatCurrency(item.purchasePrice)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(item.quantity * item.purchasePrice)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    <ShoppingCart className="mx-auto h-12 w-12" />
                    <p className="mt-4">Keranjang masih kosong</p>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 mt-4">
            <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(totalPurchase)}</span>
            </div>
            <Button onClick={handleProcessTransaction} disabled={cart.length === 0 || isProcessing}>
                {isProcessing ? "Memproses..." : "Proses Transaksi Pembelian"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
