
"use client";

import { useState } from "react";
import ProductFilters from "../components/product-filters";
import ProductGrid from "@/components/home/product-grid";

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  return (
    <div className="flex flex-col gap-4 animate-in fade-in-0 duration-500">
      <ProductFilters 
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
      />
      <ProductGrid 
        searchTerm={searchTerm}
        category={selectedCategory}
      />
    </div>
  );
}
