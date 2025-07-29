
"use client";

import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { PlusCircle, MoreHorizontal, Edit, Settings, ArrowUp, ArrowDown, Upload, FileDown, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


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
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.image || null);
    
    const [formData, setFormData] = useState({
        name: product?.name || "",
        sku: product?.sku || "",
        purchasePrice: product?.purchasePrice || 0,
        price: product ? parseFloat(product.price.replace(/[^0-9]/g, '')) : 0,
        stock: product?.stock || 0,
        category: product?.category || "Umum",
        description: product?.description || "",
        image: product?.image || "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        const numericFields = ['purchasePrice', 'price', 'stock'];
        setFormData(prev => ({ ...prev, [id]: numericFields.includes(id) ? Number(value) : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
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
            let imageUrl = formData.image;

            if (imageFile) {
                const storage = getStorage();
                const storageRef = ref(storage, `product_images/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }
            
            const dataToSave: any = {
                ...formData,
                price: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                }).format(formData.price),
                image: imageUrl,
            };

            if (!dataToSave.image) {
                dataToSave.image = `https://placehold.co/400x400.png`;
                dataToSave['data-ai-hint'] = 'product item';
            }


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
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="image" className="text-right pt-2">Gambar</Label>
                    <div className="col-span-3 space-y-2">
                        {imagePreview && <Image src={imagePreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />}
                        <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
                    </div>
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

function BulkImportDialog({ onImportSuccess }: { onImportSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([
            ["name", "sku", "price", "purchasePrice", "stock", "category", "description"],
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Produk");
        XLSX.writeFile(workbook, "template_produk.xlsx");
    };

    const handleProcessImport = async () => {
        if (!file) {
            toast({ variant: 'destructive', title: 'File tidak ditemukan', description: 'Silakan pilih file Excel terlebih dahulu.' });
            return;
        }

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);
                
                if (json.length === 0) throw new Error("File Excel kosong atau format salah.");

                const batch = writeBatch(db);
                json.forEach((row) => {
                    if (!row.name || !row.sku || !row.price) {
                        // Skip rows with missing required fields
                        return;
                    }
                    const productRef = doc(collection(db, "products"));
                    batch.set(productRef, {
                        name: row.name,
                        sku: row.sku,
                        price: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(row.price || 0),
                        purchasePrice: Number(row.purchasePrice) || 0,
                        stock: Number(row.stock) || 0,
                        category: row.category || "Umum",
                        description: row.description || "",
                        image: 'https://placehold.co/400x400.png',
                        'data-ai-hint': 'product item',
                        createdAt: serverTimestamp(),
                    });
                });
                
                await batch.commit();

                toast({ title: 'Impor Berhasil', description: `${json.length} produk telah berhasil ditambahkan.` });
                onImportSuccess();
                setIsOpen(false);
                setFile(null);

            } catch (error) {
                console.error("Error importing products:", error);
                toast({ variant: 'destructive', title: 'Gagal Mengimpor', description: "Terjadi kesalahan saat memproses file. Pastikan format sudah benar." });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Impor Massal</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Impor Produk Massal</DialogTitle>
                    <DialogDescription>
                        Tambah banyak produk sekaligus menggunakan file Excel. Ikuti langkah-langkah di bawah ini.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label>Langkah 1: Download Template</Label>
                        <p className="text-sm text-muted-foreground mb-2">Gunakan template ini untuk memastikan format data Anda benar.</p>
                        <Button variant="secondary" onClick={handleDownloadTemplate}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="excel-file">Langkah 2: Upload File</Label>
                        <p className="text-sm text-muted-foreground mb-2">Pilih file Excel (.xlsx) yang sudah Anda isi.</p>
                        <Input id="excel-file" type="file" accept=".xlsx" onChange={handleFileChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button onClick={handleProcessImport} disabled={isProcessing || !file}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Proses Impor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
        
        const lowStockQuery = query(collection(db, "products"), where("stock", "<=", 5));
        const lowStockSnapshot = await getDocs(lowStockQuery);
        const lowStockData = lowStockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setLowStockProducts(lowStockData);
    } catch (error) {
        console.error("Error fetching products:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const results = products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
      const skuMatch = String(product.sku || '').toLowerCase().includes(lowercasedFilter);
      return nameMatch || skuMatch;
    });
    setFilteredProducts(results);
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, products]);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage, filteredProducts]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);


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
                <TabsTrigger value="low-stock">Stok Menipis</TabsTrigger>
                <TabsTrigger value="stock-management">Manajemen Stok</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
                <BulkImportDialog onImportSuccess={fetchProducts} />
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
                     <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari produk berdasarkan nama atau SKU..."
                            className="w-full pl-8 sm:w-1/2 md:w-1/3"
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
                                ) : paginatedProducts.map((product) => (
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
                    </div>
                </CardContent>
                 <CardFooter>
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                       <div className="flex-1">
                           Menampilkan {paginatedProducts.length} dari {filteredProducts.length} produk.
                       </div>
                       <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2">
                               <p>Baris per halaman</p>
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
                                       {[20, 50, 100].map((pageSize) => (
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
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="low-stock">
            <Card>
                <CardHeader>
                    <CardTitle>Produk Stok Menipis</CardTitle>
                    <CardDescription>
                        Produk dengan jumlah stok 5 atau kurang. Segera restock!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Produk</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Stok Tersisa</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Memuat produk...</TableCell>
                                    </TableRow>
                                ) : lowStockProducts.length > 0 ? lowStockProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell className="text-right">
                                          <Badge variant="destructive">{product.stock}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AdjustStockDialog product={product} onStockAdjusted={fetchProducts} />
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">Tidak ada produk dengan stok menipis.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                     </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="stock-management">
            <Card>
                <CardHeader>
                    <CardTitle>Manajemen Stok</CardTitle>
                    <CardDescription>
                        Lakukan penyesuaian stok untuk produk Anda dan lihat riwayat perubahan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="relative w-full overflow-auto">
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
                     </div>
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
