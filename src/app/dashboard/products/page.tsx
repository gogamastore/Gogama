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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, Edit, Settings, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
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
  description?: string;
}

function ProductForm({ product, onSave, onOpenChange }: { product?: Product, onSave: () => void, onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: product?.name || "",
        sku: product?.sku || "",
        purchasePrice: product?.purchasePrice || 0,
        price: product ? parseFloat(product.price.replace(/[^0-9]/g, '')) : 0,
        stock: product?.stock || 0,
        category: product?.category || "Umum",
        description: product?.description || "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const numericFields = ['purchasePrice', 'price', 'stock'];
        setFormData(prev => ({ ...prev, [id]: numericFields.includes(id) ? Number(value) : value }));
    };

    const handleSaveProduct = async () => {
        if (!formData.name || !formData.sku || formData.price <= 0) {
            toast({
                variant: "destructive",
                title: "Data Tidak Lengkap",
                description: "Nama produk, SKU, dan harga jual harus diisi.",
            });
            return;
        }
        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                price: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }).format(formData.price),
            };

            if (product) { // Editing existing product
                const productRef = doc(db, "products", product.id);
                await updateDoc(productRef, dataToSave);
                toast({
                    title: "Produk Berhasil Diperbarui",
                    description: `${formData.name} telah diperbarui.`,
                });
            } else { // Adding new product
                await addDoc(collection(db, "products"), {
                    ...dataToSave,
                    image: `https://placehold.co/400x400.png`,
                    'data-ai-hint': 'product item',
                    createdAt: serverTimestamp(),
                });
                toast({
                    title: "Produk Berhasil Ditambahkan",
                    description: `${formData.name} telah ditambahkan ke daftar produk.`,
                });
            }
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving product:", error);
            toast({
                variant: "destructive",
                title: `Gagal ${product ? 'Memperbarui' : 'Menambahkan'} Produk`,
                description: "Terjadi kesalahan saat menyimpan data ke server.",
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <>
            <SheetHeader>
                <SheetTitle>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</SheetTitle>
                <SheetDescription>
                    {product ? 'Ubah detail produk yang sudah ada.' : 'Isi detail produk baru yang akan ditambahkan ke toko Anda.'}
                </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nama Produk</Label>
                    <Input id="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sku" className="text-right">SKU</Label>
                    <Input id="sku" value={formData.sku} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="purchasePrice" className="text-right">Harga Beli</Label>
                    <Input id="purchasePrice" type="number" value={formData.purchasePrice} onChange={handleInputChange} className="col-span-3" placeholder="Harga modal produk" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">Harga Jual</Label>
                    <Input id="price" type="number" value={formData.price} onChange={handleInputChange} className="col-span-3" placeholder="Harga yang akan tampil di toko" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="stock" className="text-right">Stok</Label>
                    <Input id="stock" type="number" value={formData.stock} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Deskripsi</Label>
                    <Textarea id="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveProduct} disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Produk"}
                </Button>
            </div>
        </>
    )
}

function ProductSheet({ onProductAdded }: { onProductAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
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
        <ProductForm onSave={onProductAdded} onOpenChange={setIsOpen} />
      </SheetContent>
    </Sheet>
  )
}

function AdjustStockDialog({ product, onStockAdjusted }: { product: Product, onStockAdjusted: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [adjustment, setAdjustment] = useState({
        type: 'in', // 'in' or 'out'
        quantity: 0,
        reason: ''
    });
    const { toast } = useToast();

    const handleAdjustStock = async () => {
        if (adjustment.quantity <= 0 || !adjustment.reason) {
            toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Jumlah dan alasan harus diisi.' });
            return;
        }
        if (adjustment.type === 'out' && adjustment.quantity > product.stock) {
            toast({ variant: 'destructive', title: 'Stok Tidak Cukup', description: 'Jumlah penarikan stok melebihi stok yang tersedia.' });
            return;
        }

        setLoading(true);
        const batch = writeBatch(db);

        try {
            // 1. Update product stock
            const productRef = doc(db, "products", product.id);
            const newStock = adjustment.type === 'in'
                ? product.stock + adjustment.quantity
                : product.stock - adjustment.quantity;
            batch.update(productRef, { stock: newStock });

            // 2. Create stock adjustment log
            const logRef = doc(collection(db, "stock_adjustments"));
            batch.set(logRef, {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                type: adjustment.type, // 'in' or 'out'
                quantity: adjustment.quantity,
                reason: adjustment.reason,
                previousStock: product.stock,
                newStock: newStock,
                createdAt: serverTimestamp()
            });
            
            await batch.commit();

            toast({ title: 'Stok Berhasil Disesuaikan', description: `Stok untuk ${product.name} telah diperbarui.` });
            onStockAdjusted();
            setIsOpen(false);
            setAdjustment({ type: 'in', quantity: 0, reason: '' }); // Reset form
        } catch (error) {
            console.error("Error adjusting stock:", error);
            toast({ variant: 'destructive', title: 'Gagal Menyesuaikan Stok' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Sesuaikan Stok</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Penyesuaian Stok: {product.name}</DialogTitle>
                    <DialogDescription>Stok saat ini: <span className="font-bold">{product.stock}</span></DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <RadioGroup defaultValue="in" onValueChange={(value) => setAdjustment(p => ({ ...p, type: value }))}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="in" id="in" />
                            <Label htmlFor="in" className="flex items-center gap-2"><ArrowUp className="h-4 w-4 text-green-500" /> Stok Masuk</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="out" id="out" />
                            <Label htmlFor="out" className="flex items-center gap-2"><ArrowDown className="h-4 w-4 text-red-500" /> Stok Keluar</Label>
                        </div>
                    </RadioGroup>
                    <div className="space-y-1">
                        <Label htmlFor="quantity">Jumlah</Label>
                        <Input id="quantity" type="number" value={adjustment.quantity} onChange={e => setAdjustment(p => ({ ...p, quantity: Number(e.target.value) }))} min="1" />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="reason">Alasan Penyesuaian</Label>
                        <Textarea id="reason" placeholder="Contoh: Stok opname, barang rusak, retur..." value={adjustment.reason} onChange={e => setAdjustment(p => ({ ...p, reason: e.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button onClick={handleAdjustStock} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
    } catch (error) {
        console.error("Error fetching products:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };
  
  const handleSheetOpenChange = (open: boolean) => {
      setIsSheetOpen(open);
      if (!open) {
          setEditingProduct(undefined);
      }
  }

  return (
    <>
    <Tabs defaultValue="all">
        <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="all">Daftar Produk</TabsTrigger>
                <TabsTrigger value="stock">Manajemen Stok</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm">Impor Massal</Button>
                <ProductSheet onProductAdded={fetchProducts} />
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
                            <TableHead>Stok</TableHead>
                            <TableHead className="text-right">Harga Beli</TableHead>
                            <TableHead className="text-right">Harga Jual</TableHead>
                            <TableHead className="w-[50px] text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Memuat produk...</TableCell>
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
                                <TableCell>
                                  <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.purchasePrice || 0)}</TableCell>
                                <TableCell className="text-right">{product.price}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => handleEditClick(product)}>
                                                <Edit className="mr-2 h-4 w-4"/>
                                                Edit Produk
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
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
                        Lakukan penyesuaian stok untuk produk Anda dan lihat riwayat perubahan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Produk</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-center">Stok Saat Ini</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Memuat produk...</TableCell>
                                </TableRow>
                            ) : products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell className="text-center font-bold">{product.stock}</TableCell>
                                    <TableCell className="text-right">
                                        <AdjustStockDialog product={product} onStockAdjusted={fetchProducts} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>

     <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent>
            {editingProduct && <ProductForm product={editingProduct} onSave={fetchProducts} onOpenChange={handleSheetOpenChange} />}
        </SheetContent>
    </Sheet>
    </>
  )
}
