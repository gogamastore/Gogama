
"use client";

import { useState } from "react";
import HeroSection from "@/components/home/hero-section";
import ProductGrid from "@/components/home/product-grid";
import QuickAccessMenu from "@/components/home/quick-access-menu";
import FlashSaleSection from "@/components/home/flash-sale";
import TrendingSection from "@/components/home/trending-section";
import ProductFilters from "./components/product-filters";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  return (
    <div className="flex flex-col gap-4 animate-in fade-in-0 duration-500">
      <HeroSection />
      <QuickAccessMenu />
      <FlashSaleSection />
      <TrendingSection />
      <ProductFilters 
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <ProductGrid 
        searchTerm={searchTerm}
        category={selectedCategory}
        limit={24}
      />
    </div>
  );
}
