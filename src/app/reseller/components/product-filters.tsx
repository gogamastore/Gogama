
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProductCategory {
    id: string;
    name: string;
}

interface ProductFiltersProps {
    onSearchChange: (term: string) => void;
    onCategoryChange: (category: string) => void;
}

export default function ProductFilters({ onSearchChange, onCategoryChange }: ProductFiltersProps) {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "product_categories"), orderBy("name", "asc"));
                const querySnapshot = await getDocs(q);
                const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    return (
        <section className="w-full py-6">
            <div className="container max-w-screen-2xl">
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <div className="relative w-full md:max-w-lg">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari produk berdasarkan nama atau SKU..."
                            className="w-full pl-8"
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-[250px]">
                        <Select onValueChange={onCategoryChange} defaultValue="Semua">
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Semua">Semua Kategori</SelectItem>
                                {loading ? (
                                    <SelectItem value="loading" disabled>Memuat...</SelectItem>
                                ) : (
                                    categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </section>
    );
}
