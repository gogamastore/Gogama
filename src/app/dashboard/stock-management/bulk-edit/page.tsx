
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BulkEditStockPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Kembali ke Manajemen Stok</span>
                </Button>
                <div>
                    <CardTitle>Import / Export Stok</CardTitle>
                    <CardDescription>
                        Sesuaikan stok produk secara massal dengan mengunggah file.
                    </CardDescription>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Fitur dalam Pengembangan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Halaman untuk mengelola stok secara massal akan segera tersedia.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
