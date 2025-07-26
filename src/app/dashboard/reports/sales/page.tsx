import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SalesReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Penjualan</CardTitle>
        <CardDescription>
          Analisis detail penjualan produk Anda. Fitur ini akan segera tersedia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            Konten laporan penjualan akan ditampilkan di sini.
        </div>
      </CardContent>
    </Card>
  )
}
