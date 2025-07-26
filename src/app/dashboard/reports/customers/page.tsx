import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CustomersReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Pelanggan</CardTitle>
        <CardDescription>
          Analisis data dan perilaku pelanggan. Fitur ini akan segera tersedia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            Konten laporan pelanggan akan ditampilkan di sini.
        </div>
      </CardContent>
    </Card>
  )
}
