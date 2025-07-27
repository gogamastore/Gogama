import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function OperationalExpensesReportPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Beban Operasional</CardTitle>
        <CardDescription>
          Lacak semua pengeluaran operasional bisnis Anda. Fitur ini akan segera tersedia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            Konten laporan beban operasional akan ditampilkan di sini.
        </div>
      </CardContent>
    </Card>
  )
}
