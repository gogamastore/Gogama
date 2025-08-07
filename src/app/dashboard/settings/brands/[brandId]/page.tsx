
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, collection, getDocs, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlusCircle, Search, Trash2, Loader2, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  logoUrl: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  image: string;
  brandId?: string;
}

function AddProductDialog({ brand, onProductsAdded }: { brand: Brand, onProductsAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch products that do not have this brandId
            const q = query(collection(db, 'products'), where('brandId', '!=', brand.id));
            const snapshot = await getDocs(q);
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            // Further client-side filtering for products with no brandId at all.
            const unbrandedProducts = productsData.filter(p => !p.brandId);
            setAllProducts(unbrandedProducts);
        } catch (error) {
            console.error(error);
            // This query is complex and might fail if index is not set. Provide helpful error.
             toast({ variant: 'destructive', title: 'Gagal Memuat Produk', description: 'Pastikan Anda telah membuat index komposit untuk "products" pada field "brandId" di Firestore.' });
        } finally {
            setLoading(false);
        }
    }, [brand.id, toast]);

    useEffect(() => {
        if(isOpen) fetchProducts();
    }, [isOpen, fetchProducts]);

    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allProducts, searchTerm]);

    const handleToggleSelection = (productId: string) => {
        setSelectedProductIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        if (selectedProductIds.size === 0) {
            toast({ variant: "destructive", title: "Tidak ada produk dipilih" });
            return;
        }
        setIsSubmitting(true);
        try {
            const batch = writeBatch(db);
            selectedProductIds.forEach(productId => {
                const productRef = doc(db, 'products', productId);
                batch.update(productRef, { brandId: brand.id });
            });
            await batch.commit();
            toast({ title: `${selectedProductIds.size} produk berhasil ditambahkan ke brand.` });
            onProductsAdded();
            setIsOpen(false);
            setSelectedProductIds(new Set());
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Gagal menambahkan produk" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Tambah Produk</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Tambah Produk ke Brand: {brand.name}</DialogTitle>
                    <DialogDescription>Pilih satu atau lebih produk untuk dimasukkan ke dalam brand ini.</DialogDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Cari produk..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>Produk</TableHead>
                                <TableHead>SKU</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={3} className="h-24 text-center">Memuat produk...</TableCell></TableRow> : 
                            filteredProducts.map(p => (
                                <TableRow key={p.id} onClick={() => handleToggleSelection(p.id)} className="cursor-pointer" data-state={selectedProductIds.has(p.id) ? 'selected' : ''}>
                                    <TableCell>
                                        <input type="checkbox" checked={selectedProductIds.has(p.id)} readOnly/>
                                    </TableCell>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Image src={p.image} alt={p.name} width={40} height={40} className="rounded-md object-cover"/>
                                        {p.name}
                                    </TableCell>
                                    <TableCell>{p.sku}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
                    <Button onClick={handleSave} disabled={isSubmitting || selectedProductIds.size === 0}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Tambah ({selectedProductIds.size}) Produk
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ManageBrandProductsPage({ params }: { params: { brandId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrandAndProducts = useCallback(async () => {
    setLoading(true);
    try {
        const brandDocRef = doc(db, 'brands', params.brandId);
        const brandDoc = await getDoc(brandDocRef);
        if (!brandDoc.exists()) {
            toast({ variant: 'destructive', title: 'Brand tidak ditemukan.' });
            router.push('/dashboard/settings/brands');
            return;
        }
        setBrand({ id: brandDoc.id, ...brandDoc.data() } as Brand);
        
        const productsQuery = query(collection(db, 'products'), where('brandId', '==', params.brandId));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Gagal memuat data.' });
    } finally {
        setLoading(false);
    }
  }, [params.brandId, router, toast]);

  useEffect(() => {
    fetchBrandAndProducts();
  }, [fetchBrandAndProducts]);

  const handleRemoveProductFromBrand = async (productId: string) => {
    try {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, { brandId: null });
        toast({ title: 'Produk berhasil dihapus dari brand.' });
        fetchBrandAndProducts(); // Refresh list
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Gagal menghapus produk.' });
    }
  }

  if (loading || !brand) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/settings/brands')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <CardTitle>Kelola Produk Brand: {brand.name}</CardTitle>
                <CardDescription>
                  Tambahkan atau hapus produk yang masuk dalam brand ini.
                </CardDescription>
            </div>
        </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Produk dalam Brand</CardTitle>
            <AddProductDialog brand={brand} onProductsAdded={fetchBrandAndProducts} />
        </CardHeader>
        <CardContent>
             <div className="overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produk</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={3} className="h-24 text-center">Memuat...</TableCell></TableRow> : 
                        products.length > 0 ? products.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Image src={p.image} alt={p.name} width={40} height={40} className="rounded-md object-cover"/>
                                    {p.name}
                                </TableCell>
                                <TableCell>{p.sku}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Hapus</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini akan menghapus produk <span className="font-bold">{p.name}</span> dari brand <span className="font-bold">{brand.name}</span>.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRemoveProductFromBrand(p.id)} className="bg-destructive hover:bg-destructive/90">Ya, Hapus</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : 
                        <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground"><Package className="mx-auto h-8 w-8 mb-2"/>Belum ada produk di brand ini.</TableCell></TableRow>}
                    </TableBody>
                </Table>
             </div>
        </CardContent>
      </Card>
    </div>
  );
}
