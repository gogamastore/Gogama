import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PurchasesReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Transaksi Pembelian</CardTitle>
        <CardDescription>
          Lacak semua transaksi pembelian stok. Fitur ini akan segera tersedia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            Konten laporan transaksi pembelian akan ditampilkan di sini.
        </div>
      </CardContent>
    </Card>
  )
}
