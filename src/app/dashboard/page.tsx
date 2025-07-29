
"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { id as dateFnsLocaleId } from "date-fns/locale";

interface Order {
    id: string;
    customer: string;
    total: string;
    status: string;
}
interface SalesData {
    name: string;
    sales: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};


export default function Dashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        salesCount: 0,
        newCustomers: 0,
        productsInStock: 0,
        lowStockCount: 0
    });
    const [salesData, setSalesData] = useState<SalesData[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);
            try {
                // --- Fetch orders for revenue and sales count ---
                const ordersQuery = query(collection(db, "orders"), where("status", "==", "Delivered"));
                const ordersSnapshot = await getDocs(ordersQuery);
                let totalRevenue = 0;
                ordersSnapshot.forEach(doc => {
                    const totalString = doc.data().total?.toString().replace(/[^0-9]/g, '') || '0';
                    totalRevenue += parseFloat(totalString);
                });

                // --- Fetch users for new customers count ---
                const usersQuery = query(collection(db, "user"), where("role", "==", "reseller"));
                const usersSnapshot = await getDocs(usersQuery);

                // --- Fetch products for stock counts ---
                const productsSnapshot = await getDocs(collection(db, "products"));
                let lowStockCount = 0;
                productsSnapshot.forEach(doc => {
                    if ((doc.data().stock || 0) <= 5) {
                        lowStockCount++;
                    }
                });
                
                setStats({
                    totalRevenue: totalRevenue,
                    salesCount: ordersSnapshot.size,
                    newCustomers: usersSnapshot.size,
                    productsInStock: productsSnapshot.size,
                    lowStockCount: lowStockCount
                });

                // --- Fetch last 6 months sales data ---
                const monthlySales: { [key: string]: number } = {};
                const monthLabels: string[] = [];
                const now = new Date();

                for (let i = 5; i >= 0; i--) {
                    const targetMonth = subMonths(now, i);
                    const monthKey = format(targetMonth, "yyyy-MM");
                    const monthName = format(targetMonth, "MMM", { locale: dateFnsLocaleId });
                    
                    monthLabels.push(monthName);
                    monthlySales[monthKey] = 0;
                }

                ordersSnapshot.docs.forEach(doc => {
                    const orderData = doc.data();
                    if(orderData.date && orderData.date.toDate) {
                        const orderDate = orderData.date.toDate();
                        const monthKey = format(orderDate, "yyyy-MM");
                        if(monthlySales.hasOwnProperty(monthKey)) {
                             const totalString = orderData.total?.toString().replace(/[^0-9]/g, '') || '0';
                             monthlySales[monthKey] += parseFloat(totalString);
                        }
                    }
                });

                const chartData = Object.keys(monthlySales).map(key => ({
                    name: format(new Date(key), "MMM", { locale: dateFnsLocaleId }),
                    sales: monthlySales[key]
                }));
                setSalesData(chartData);


                // --- Fetch recent orders ---
                const recentOrdersQuery = query(collection(db, "orders"), orderBy("date", "desc"), limit(5));
                const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
                const recentOrdersData = recentOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                setRecentOrders(recentOrdersData);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total dari pesanan yang selesai
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{loading ? '...' : stats.salesCount}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah pesanan yang selesai
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{loading ? '...' : stats.newCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Total reseller terdaftar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products in Stock
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.productsInStock}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lowStockCount} produk stok menipis
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>An overview of sales performance in the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value as number)} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "hsl(var(--card-foreground))" }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="space-y-4">
            <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>A list of the most recent orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                        ) : recentOrders.map(order => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.customer}</TableCell>
                            <TableCell>{order.total}</TableCell>
                            <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
