
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, Upload, FileUp, CheckCircle, Loader2, XCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category: string;
}

interface ProductCategory {
  id: string;
  name: string;
}

const ProductSelectionDialog = ({ onSelect, selectedIds }: { onSelect: (selected: string[]) => void, selectedIds: string[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

    const fetchProducts = async () => {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "products"));
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchProducts();
    }, [isOpen]);
    
    const handleCheckboxChange = (id: string, checked: boolean) => {
        setLocalSelected(prev => checked ? [...prev, id] : prev.filter(pId => pId !== id));
    };
    
    const handleSaveSelection = () => {
        onSelect(localSelected);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">Pilih Baris Tertentu</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Pilih Produk</DialogTitle>
                    <DialogDescription>Pilih produk yang ingin Anda ekspor untuk diedit stoknya.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96 border rounded-md">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Produk</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <TableRow><TableCell colSpan={2} className="text-center">Memuat...</TableCell></TableRow> : products.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <Checkbox checked={localSelected.includes(p.id)} onCheckedChange={(checked) => handleCheckboxChange(p.id, !!checked)}/>
                                    </TableCell>
                                    <TableCell>{p.name}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={handleSaveSelection}>Simpan Pilihan ({localSelected.length})</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const CategorySelectionDialog = ({ onSelect, selectedCategories }: { onSelect: (selected: string[]) => void, selectedCategories: string[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [localSelected, setLocalSelected] = useState<string[]>(selectedCategories);
    
    const fetchCategories = async () => {
        setLoading(true);
        const snapshot = await getDocs(collection(db, "product_categories"));
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory)));
        setLoading(false);
    };

    useEffect(() => {
        if(isOpen) fetchCategories();
    }, [isOpen]);
    
    const handleCheckboxChange = (name: string, checked: boolean) => {
        setLocalSelected(prev => checked ? [...prev, name] : prev.filter(cat => cat !== name));
    };

    const handleSaveSelection = () => {
        onSelect(localSelected);
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button type="button" variant="outline">Pilih Kategori Tertentu</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Pilih Kategori</DialogTitle></DialogHeader>
                 <ScrollArea className="h-72 border rounded-md p-4 space-y-2">
                     {loading ? <p>Memuat...</p> : categories.map(cat => (
                         <div key={cat.id} className="flex items-center space-x-2">
                             <Checkbox id={cat.id} checked={localSelected.includes(cat.name)} onCheckedChange={(checked) => handleCheckboxChange(cat.name, !!checked)}/>
                             <Label htmlFor={cat.id}>{cat.name}</Label>
                         </div>
                     ))}
                 </ScrollArea>
                <DialogFooter>
                    <Button onClick={handleSaveSelection}>Simpan Pilihan ({localSelected.length})</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function BulkEditStockPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [exportType, setExportType] = useState('specific'); // 'specific' or 'category'
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("Tidak ada file terpilih!");

    const filterDescription = useMemo(() => {
        if (exportType === 'specific' && selectedProductIds.length > 0) {
            return `${selectedProductIds.length} produk dipilih.`;
        }
        if (exportType === 'category' && selectedCategories.length > 0) {
            return `Kategori: ${selectedCategories.join(', ')}.`;
        }
        return "Belum ada filter yang dipilih!";
    }, [exportType, selectedProductIds, selectedCategories]);

    const canExport = useMemo(() => {
        return (exportType === 'specific' && selectedProductIds.length > 0) || (exportType === 'category' && selectedCategories.length > 0);
    }, [exportType, selectedProductIds, selectedCategories]);

    const handleExport = async () => {
        setIsProcessing(true);
        try {
            let productsQuery;
            if (exportType === 'specific') {
                productsQuery = query(collection(db, "products"), where('__name__', 'in', selectedProductIds));
            } else { // category
                productsQuery = query(collection(db, "products"), where('category', 'in', selectedCategories));
            }

            const snapshot = await getDocs(productsQuery);
            if (snapshot.empty) {
                toast({ variant: "destructive", title: "Tidak ada produk untuk diekspor" });
                return;
            }

            const productsToExport = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                sku: doc.data().sku,
                stock: doc.data().stock,
            }));

            const worksheet = XLSX.utils.json_to_sheet(productsToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Produk");
            XLSX.writeFile(workbook, "update_stok_produk.xlsx");

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Gagal mengekspor data" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && selectedFile.type !== 'application/vnd.ms-excel') {
                toast({ variant: 'destructive', title: "Format File Salah", description: "Harap unggah file .xlsx atau .xls" });
                return;
            }
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast({ variant: 'destructive', title: "Tidak ada file untuk diunggah" });
            return;
        }
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0 || !json[0].id || json[0].stock === undefined) {
                    throw new Error("Format file salah atau kolom 'id' dan 'stock' tidak ditemukan.");
                }
                
                const batch = writeBatch(db);
                json.forEach(row => {
                    const { id, stock } = row;
                    if (id && typeof stock === 'number') {
                        const productRef = doc(db, "products", String(id));
                        batch.update(productRef, { stock: stock });
                    }
                });
                
                await batch.commit();
                toast({ title: "Stok Berhasil Diperbarui", description: `${json.length} produk telah diperbarui stoknya.` });
                setFile(null);
                setFileName("Tidak ada file terpilih!");

            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: "Gagal memproses file", description: "Pastikan format file Anda sudah benar." });
            } finally {
                setIsProcessing(false);
            }
        }
        reader.readAsArrayBuffer(file);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Kembali ke Manajemen Stok</span>
                </Button>
                <div>
                    <CardTitle>Import / Export Edit Stok</CardTitle>
                    <CardDescription>
                        Sesuaikan stok produk secara massal dengan mengunggah file.
                    </CardDescription>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Alur Kerja Pembaruan Stok Massal</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload}>
                        <ol className="list-decimal list-inside space-y-8 font-medium">
                            {/* Step 1: Export */}
                            <li>
                                <span>Export Barang (.xlsx)</span>
                                <Card className="p-4 mt-2">
                                    <p className="text-sm font-normal text-muted-foreground">Pilih produk yang ingin diubah stoknya.</p>
                                    <RadioGroup value={exportType} onValueChange={setExportType} className="my-4">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="specific" id="specific" />
                                            <Label htmlFor="specific">Pilih produk satu per satu</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="category" id="category" />
                                            <Label htmlFor="category">Pilih berdasarkan kategori</Label>
                                        </div>
                                    </RadioGroup>
                                    
                                    <div className="flex gap-4">
                                        <ProductSelectionDialog onSelect={setSelectedProductIds} selectedIds={selectedProductIds}/>
                                        <CategorySelectionDialog onSelect={setSelectedCategories} selectedCategories={selectedCategories}/>
                                    </div>

                                    <p className="text-sm mt-4">
                                        <span className="font-semibold">Filter terpilih:</span> {filterDescription}
                                    </p>
                                </Card>
                                <Button type="button" onClick={handleExport} disabled={!canExport || isProcessing} className="mt-4">
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                    Export Barang
                                </Button>
                            </li>
                            {/* Step 2: Instructions */}
                             <li>
                                <span>Ubah Data Barang Anda</span>
                                <ul className="list-disc list-inside space-y-2 font-normal text-sm text-muted-foreground mt-2 pl-4">
                                    <li>Buka file Excel yang sudah diekspor, ubah hanya nilai di kolom <strong>stock</strong>.</li>
                                    <li>Jangan mengubah nilai pada kolom lain, terutama kolom <strong>id</strong>.</li>
                                    <li>Setelah selesai, simpan file tersebut.</li>
                                    <li>Maksimal menampung <strong>500 data barang</strong> per file.</li>
                                </ul>
                            </li>
                            {/* Step 3: Upload */}
                            <li>
                                <span>Pilih File yang telah anda edit di sini</span>
                                 <ul className="list-disc list-inside space-y-2 font-normal text-sm text-muted-foreground mt-2 pl-4 mb-4">
                                    <li>Pastikan file dalam format .xlsx.</li>
                                    <li>Ukuran File Maksimal 10 MB.</li>
                                </ul>
                                <Card className="p-4 max-w-md">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <FileUp className="w-12 h-12 text-muted-foreground" />
                                        <Label htmlFor="file-upload" className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-semibold">
                                            Pilih File
                                        </Label>
                                        <Input id="file-upload" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange}/>
                                        <p className="text-xs text-muted-foreground">{fileName}</p>
                                    </div>
                                </Card>
                            </li>
                            {/* Step 4: Submit */}
                             <li>
                                <span>Klik Submit untuk unggah Excel</span>
                                <div className="mt-2">
                                    <Button type="submit" disabled={!file || isProcessing}>
                                         {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                                        Submit File
                                    </Button>
                                </div>
                            </li>
                        </ol>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

