
import HeroSection from "@/components/home/hero-section";
import ProductGrid from "@/components/home/product-grid";
import QuickAccessMenu from "@/components/home/quick-access-menu";
import FlashSaleSection from "@/components/home/flash-sale";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in-0 duration-500">
      <HeroSection />
      <QuickAccessMenu />
      <FlashSaleSection />
      <ProductGrid />
    </div>
  );
}
