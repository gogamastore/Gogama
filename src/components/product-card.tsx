
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart } from 'lucide-react';
import { Progress } from './ui/progress';

interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    promotion?: 'Flash Sale' | 'Best Seller';
    image: string;
    hint: string;
    sold?: number;
    stock?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProductCard({ product, showStockProgress }: { product: Product, showStockProgress?: boolean }) {
    const stockProgress = (product.sold && product.stock) ? (product.sold / (product.sold + product.stock)) * 100 : 0;
    
    return (
        <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg">
            <Link href={`/product/${product.id}`} className="group">
                <CardContent className="p-0">
                    <div className="relative">
                         {product.promotion && (
                            <Badge variant="destructive" className="absolute top-2 left-2 z-10 font-headline">
                                {product.promotion}
                            </Badge>
                         )}
                        <Image
                            src={product.image}
                            alt={product.name}
                            width={300}
                            height={300}
                            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={product.hint}
                        />
                    </div>
                    <div className="p-3 space-y-2">
                        <h3 className="font-headline text-sm font-semibold leading-snug truncate group-hover:text-primary">
                            {product.name}
                        </h3>
                        <div>
                            <span className="text-base font-bold text-primary">{formatCurrency(product.price)}</span>
                             {product.originalPrice && (
                                <span className="ml-2 text-xs text-muted-foreground line-through">
                                    {formatCurrency(product.originalPrice)}
                                </span>
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
        </Card>
    );
}
