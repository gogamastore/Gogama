export const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4500 },
  { name: 'May', sales: 6000 },
  { name: 'Jun', sales: 5500 },
];

export const recentOrders = [
  { id: 'ORD001', customer: 'Budi Santoso', amount: 'Rp 1.250.000', status: 'Shipped' },
  { id: 'ORD002', customer: 'Citra Lestari', amount: 'Rp 850.000', status: 'Processing' },
  { id: 'ORD003', customer: 'Dewi Anggraini', amount: 'Rp 2.100.000', status: 'Delivered' },
  { id: 'ORD004', customer: 'Eko Prasetyo', amount: 'Rp 450.000', status: 'Pending' },
];

export const topProducts = [
  { name: 'Kemeja Batik Modern', sold: 120 },
  { name: 'Gamis Brokat Pesta', sold: 98 },
  { name: 'Celana Kulot Linen', sold: 75 },
  { name: 'Tas Selempang Kulit', sold: 60 },
];

export const lowStockProducts = [
    { name: 'Kemeja Batik Modern', stock: 5 },
    { name: 'Celana Kulot Linen', stock: 3 },
    { name: 'Sepatu Sneakers Putih', stock: 2 },
];

export const allOrders = [
    { id: "ORD001", customer: "Budi Santoso", status: "Shipped", total: "Rp 1,250,000", date: "2023-10-01" },
    { id: "ORD002", customer: "Citra Lestari", status: "Processing", total: "Rp 850,000", date: "2023-10-02" },
    { id: "ORD003", customer: "Dewi Anggraini", status: "Delivered", total: "Rp 2,100,000", date: "2023-10-02" },
    { id: "ORD004", customer: "Eko Prasetyo", status: "Pending", total: "Rp 450,000", date: "2023-10-03" },
    { id: "ORD005", customer: "Fitri Handayani", status: "Shipped", total: "Rp 1,750,000", date: "2023-10-04" },
]

export const allProducts = [
  { id: 'PROD001', name: 'Kemeja Batik Modern', sku: 'BTM-01-L', category: 'Pakaian Pria', price: 'Rp 250.000', stock: 5, image: 'https://placehold.co/64x64.png', 'data-ai-hint': 'modern shirt' },
  { id: 'PROD002', name: 'Gamis Brokat Pesta', sku: 'GMS-02-XL', category: 'Pakaian Wanita', price: 'Rp 450.000', stock: 12, image: 'https://placehold.co/64x64.png', 'data-ai-hint': 'woman dress' },
  { id: 'PROD003', name: 'Celana Kulot Linen', sku: 'CLN-03-M', category: 'Pakaian Wanita', price: 'Rp 180.000', stock: 3, image: 'https://placehold.co/64x64.png', 'data-ai-hint': 'linen pants' },
  { id: 'PROD004', name: 'Tas Selempang Kulit', sku: 'TAS-04-N', category: 'Aksesoris', price: 'Rp 320.000', stock: 25, image: 'https://placehold.co/64x64.png', 'data-ai-hint': 'leather bag' },
  { id: 'PROD005', name: 'Sepatu Sneakers Putih', sku: 'SPT-05-42', category: 'Sepatu', price: 'Rp 400.000', stock: 2, image: 'https://placehold.co/64x64.png', 'data-ai-hint': 'white sneakers' },
];

export const resellerProducts = [
  { id: '1', name: 'Kemeja Batik Modern', price: 'Rp 250.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'modern shirt' },
  { id: '2', name: 'Gamis Brokat Pesta', price: 'Rp 450.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'woman dress' },
  { id: '3', name: 'Celana Kulot Linen', price: 'Rp 180.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'linen pants' },
  { id: '4', name: 'Tas Selempang Kulit', price: 'Rp 320.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'leather bag' },
  { id: '5', name: 'Sepatu Sneakers Putih', price: 'Rp 400.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'white sneakers' },
  { id: '6', name: 'Jam Tangan Analog', price: 'Rp 550.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'analog watch' },
  { id: '7', name: 'Topi Baseball Polos', price: 'Rp 75.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'baseball cap' },
  { id: '8', name: 'Dompet Kulit Pria', price: 'Rp 210.000', image: 'https://placehold.co/400x400.png', 'data-ai-hint': 'leather wallet' },
]

export const sampleOrderHistory = JSON.stringify([
    {"product_id": "PROD001", "quantity": 2, "order_date": "2023-10-01"},
    {"product_id": "PROD002", "quantity": 1, "order_date": "2023-10-01"},
    {"product_id": "PROD001", "quantity": 1, "order_date": "2023-10-03"},
    {"product_id": "PROD003", "quantity": 3, "order_date": "2023-10-04"},
    {"product_id": "PROD004", "quantity": 1, "order_date": "2023-10-05"},
    {"product_id": "PROD001", "quantity": 3, "order_date": "2023-10-08"},
    {"product_id": "PROD002", "quantity": 2, "order_date": "2023-10-08"}
], null, 2);

export const sampleProductDetails = JSON.stringify([
    {"product_id": "PROD001", "name": "Kemeja Batik Modern"},
    {"product_id": "PROD002", "name": "Gamis Brokat Pesta"},
    {"product_id": "PROD003", "name": "Celana Kulot Linen"},
    {"product_id": "PROD004", "name": "Tas Selempang Kulit"},
    {"product_id": "PROD005", "name": "Sepatu Sneakers Putih"}
], null, 2);
