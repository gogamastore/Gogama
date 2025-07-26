import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ProfitLossReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Laba-Rugi</CardTitle>
        <CardDescription>
          Pahami keuntungan dan kerugian bisnis. Fitur ini akan segera tersedia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            Konten laporan laba-rugi akan ditampilkan di sini.
        </div>
      </CardContent>
    </Card>
  )
}
