
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart } from 'lucide-react';
import { Progress } from './ui/progress';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    price: string; // Keep as string as it comes from DB
    originalPrice?: number;
    promotion?: 'Flash Sale' | 'Best Seller';
    image: string;
    'data-ai-hint'?: string;
    sold?: number;
    stock: number;
    description?: string;
    isPromo?: boolean;
    discountPrice?: string;
}

const formatCurrency = (value: string | number): string => {
    const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : value;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
}

export default function ProductCard({ product, showStockProgress }: { product: Product, showStockProgress?: boolean }) {
    const stockAvailable = product.stock > 0;
    const stockProgress = (product.sold && product.stock) ? (product.sold / (product.sold + product.stock)) * 100 : 0;
    const { addToCart } = useCart();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAdding(true);
        try {
            await addToCart(product, 1);
        } catch (error) {
            // Error toast is handled in the hook
        } finally {
            setIsAdding(false);
        }
    };
    
    return (
        <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg group">
             <Link href={`/reseller/products/${product.id}`} className="block cursor-pointer">
                <CardContent className="p-0">
                    <div className="relative">
                         {product.isPromo && (
                            <Badge variant="destructive" className="absolute top-2 left-2 z-10 font-headline">
                                Promo
                            </Badge>
                         )}
                        <Image
                            src={product.image}
                            alt={product.name}
                            width={300}
                            height={300}
                            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={product['data-ai-hint'] || 'product image'}
                        />
                         {!stockAvailable && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Badge variant="destructive">Stok Habis</Badge>
                            </div>
                        )}
                    </div>
                    <div className="p-3 space-y-2">
                        <h3 className="font-headline text-sm font-semibold leading-snug truncate">
                            {product.name}
                        </h3>
                         <div>
                            {product.isPromo && product.discountPrice ? (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base font-bold text-primary">{formatCurrency(product.discountPrice)}</span>
                                    <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                                </div>
                            ) : (
                                <span className="text-base font-bold text-primary">{formatCurrency(product.price)}</span>
                            )}
                        </div>
                        {showStockProgress && product.sold && (
                           <div className="space-y-1">
                             <Progress value={stockProgress} className="h-2" />
                             <p className="text-xs text-muted-foreground">{product.sold} Terjual</p>
                           </div>
                        )}
                    </div>
                </CardContent>
            </Link>
             <div className="px-3 pb-3">
                 <Button className="w-full" variant="secondary" size="sm" disabled={!stockAvailable || isAdding} onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {isAdding ? 'Menambahkan...' : 'Tambah'}
                </Button>
            </div>
        </Card>
    );
}
