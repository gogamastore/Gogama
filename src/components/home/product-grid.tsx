
import { products } from "@/lib/data";
import ProductCard from "../product-card";

export default function ProductGrid() {
    return (
        <section className="w-full py-6 md:py-10">
            <div className="container max-w-screen-2xl">
                <h2 className="text-2xl font-bold font-headline mb-6 text-center">Untuk Anda</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    )
}
