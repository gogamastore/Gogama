import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NetIncomeReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Pendapatan Bersih</CardTitle>
        <CardDescription>
          Lihat pendapatan bersih setelah semua biaya. Fitur ini akan segera tersedia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            Konten laporan pendapatan bersih akan ditampilkan di sini.
        </div>
      </CardContent>
    </Card>
  )
}
