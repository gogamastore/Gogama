"use client";

import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string;
  purchasePrice?: number;
  stock: number;
  image: string;
  'data-ai-hint': string;
}

function AddProductSheet({ onProductAdded }: { onProductAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    purchasePrice: 0,
    price: 0,
    stock: 0,
    category: "Umum",
    description: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewProduct(prev => ({ ...prev, [id]: id === 'name' || id === 'sku' || id === 'category' || id === 'description' ? value : Number(value) }));
  };
  
  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.sku || newProduct.price <= 0) {
        toast({
            variant: "destructive",
            title: "Data Tidak Lengkap",
            description: "Nama produk, SKU, dan harga jual harus diisi.",
        });
        return;
    }
    setLoading(true);
    try {
        await addDoc(collection(db, "products"), {
            ...newProduct,
            price: new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(newProduct.price),
            image: `https://placehold.co/400x400.png`, // Placeholder image
            'data-ai-hint': 'product item',
            createdAt: serverTimestamp(),
        });

        toast({
            title: "Produk Berhasil Ditambahkan",
            description: `${newProduct.name} telah ditambahkan ke daftar produk.`,
        });

        onProductAdded(); // Callback to refresh product list
        setIsOpen(false); // Close the sheet
        // Reset form
        setNewProduct({
            name: "",
            sku: "",
            purchasePrice: 0,
            price: 0,
            stock: 0,
            category: "Umum",
            description: "",
        });

    } catch (error) {
        console.error("Error adding product:", error);
        toast({
            variant: "destructive",
            title: "Gagal Menambahkan Produk",
            description: "Terjadi kesalahan saat menyimpan data ke server.",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Tambah Produk
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tambah Produk Baru</SheetTitle>
          <SheetDescription>
            Isi detail produk baru yang akan ditambahkan ke toko Anda.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nama Produk
            </Label>
            <Input id="name" value={newProduct.name} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right">
              SKU
            </Label>
            <Input id="sku" value={newProduct.sku} onChange={handleInputChange} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchasePrice" className="text-right">
              Harga Beli
            </Label>
            <Input id="purchasePrice" type="number" value={newProduct.purchasePrice} onChange={handleInputChange} className="col-span-3" placeholder="Harga modal produk" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Harga Jual
            </Label>
            <Input id="price" type="number" value={newProduct.price} onChange={handleInputChange} className="col-span-3" placeholder="Harga yang akan tampil di toko" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Stok Awal
            </Label>
            <Input id="stock" type="number" value={newProduct.stock} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Deskripsi
            </Label>
            <Textarea id="description" value={newProduct.description} onChange={handleInputChange} className="col-span-3" />
          </div>
        </div>
        <div className="flex justify-end">
            <Button onClick={handleSaveProduct} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Produk"}
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "products"));
    const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    setProducts(productsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <Tabs defaultValue="all">
        <div className="flex items-center">
            <TabsList>
            <TabsTrigger value="all">Daftar Produk</TabsTrigger>
            <TabsTrigger value="stock">Manajemen Stok</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm">Impor Massal</Button>
                <AddProductSheet onProductAdded={fetchProducts} />
            </div>
        </div>
        <TabsContent value="all">
            <Card>
                <CardHeader>
                    <CardTitle>Produk</CardTitle>
                    <CardDescription>
                        Kelola produk Anda dan lihat performa penjualannya.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="hidden md:table-cell">Kategori</TableHead>
                            <TableHead>Stok</TableHead>
                            <TableHead className="text-right">Harga Jual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Memuat produk...</TableCell>
                                </TableRow>
                            ) : products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="hidden sm:table-cell">
                                <Image
                                    alt="Product image"
                                    className="aspect-square rounded-md object-cover"
                                    height="64"
                                    src={product.image || 'https://placehold.co/64x64.png'}
                                    width="64"
                                    data-ai-hint={product['data-ai-hint']}
                                />
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.sku}</TableCell>
                                <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                                <TableCell>
                                  <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{product.price}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stock">
            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Stok</CardTitle>
                    <CardDescription>
                        Lakukan penyesuaian stok untuk produk Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Fitur manajemen stok akan tersedia di sini.</p>
                    <div className="flex gap-2">
                        <Button>Stok Masuk</Button>
                        <Button variant="secondary">Stok Keluar</Button>
                        <Button variant="outline">Stock Opname</Button>
                        <Button variant="outline">Transfer Stok</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  )
}
