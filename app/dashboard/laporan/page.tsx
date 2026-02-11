"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { Spinner } from "../../../components/ui/ios-spinner";
import "../dashboard-new.css";
import "./laporan.css";

interface ProductSales {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
}

interface ReportData {
  total_revenue: number;
  total_orders: number;
  total_products_sold: number;
  average_order_value: number;
  product_sales: ProductSales[];
  daily_sales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const COLORS = ["#bff000", "#FA5209", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

export default function LaporanPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/reports?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      const data = await response.json();
      
      // Ensure arrays are initialized
      if (data) {
        data.product_sales = data.product_sales || [];
        data.daily_sales = data.daily_sales || [];
      }
      
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
      // Set empty data on error
      setReportData({
        total_revenue: 0,
        total_orders: 0,
        total_products_sold: 0,
        average_order_value: 0,
        product_sales: [],
        daily_sales: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["LAPORAN KEUANGAN"],
      ["Periode", `${dateRange.start} s/d ${dateRange.end}`],
      [""],
      ["Total Revenue", `Rp ${reportData.total_revenue.toLocaleString("id-ID")}`],
      ["Total Orders", reportData.total_orders],
      ["Total Produk Terjual", reportData.total_products_sold],
      ["Rata-rata Nilai Order", `Rp ${reportData.average_order_value.toLocaleString("id-ID")}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    // Product Sales Sheet
    const productData = [
      ["Nama Produk", "Jumlah Terjual", "Total Revenue", "Jumlah Order"],
      ...(reportData.product_sales || []).map((p) => [
        p.product_name,
        p.total_quantity,
        p.total_revenue,
        p.order_count,
      ]),
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(productData);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Penjualan Produk");

    // Daily Sales Sheet
    const dailyData = [
      ["Tanggal", "Revenue", "Jumlah Order"],
      ...(reportData.daily_sales || []).map((d) => [d.date, d.revenue, d.orders]),
    ];
    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, "Penjualan Harian");

    XLSX.writeFile(wb, `Laporan_Keuangan_${dateRange.start}_${dateRange.end}.xlsx`);
  };

  const exportToWord = () => {
    if (!reportData) return;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Keuangan</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; text-align: center; }
          .summary { margin: 20px 0; }
          .summary-item { margin: 10px 0; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>LAPORAN KEUANGAN</h1>
        <p style="text-align: center;">Periode: ${dateRange.start} s/d ${dateRange.end}</p>
        
        <div class="summary">
          <h2>Ringkasan</h2>
          <div class="summary-item"><strong>Total Revenue:</strong> Rp ${reportData.total_revenue.toLocaleString("id-ID")}</div>
          <div class="summary-item"><strong>Total Orders:</strong> ${reportData.total_orders}</div>
          <div class="summary-item"><strong>Total Produk Terjual:</strong> ${reportData.total_products_sold}</div>
          <div class="summary-item"><strong>Rata-rata Nilai Order:</strong> Rp ${reportData.average_order_value.toLocaleString("id-ID")}</div>
        </div>

        <h2>Penjualan Per Produk</h2>
        <table>
          <thead>
            <tr>
              <th>Nama Produk</th>
              <th>Jumlah Terjual</th>
              <th>Total Revenue</th>
              <th>Jumlah Order</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData.product_sales || []).map((p) => `
              <tr>
                <td>${p.product_name}</td>
                <td>${p.total_quantity}</td>
                <td>Rp ${p.total_revenue.toLocaleString("id-ID")}</td>
                <td>${p.order_count}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2>Penjualan Harian</h2>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Revenue</th>
              <th>Jumlah Order</th>
            </tr>
          </thead>
          <tbody>
            ${(reportData.daily_sales || []).map((d) => `
              <tr>
                <td>${d.date}</td>
                <td>Rp ${d.revenue.toLocaleString("id-ID")}</td>
                <td>${d.orders}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    saveAs(blob, `Laporan_Keuangan_${dateRange.start}_${dateRange.end}.doc`);
  };

  const downloadChart = async (chartId: string) => {
    const element = document.getElementById(chartId);
    if (!element) return;

    const canvas = await html2canvas(element);
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${chartId}_${new Date().getTime()}.png`);
      }
    });
  };

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-main">
          <div className="loading-container">
            <Spinner size="lg" />
            <p>Memuat laporan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="dash-container">
        <div className="dash-main">
          <div className="error-container">Gagal memuat data laporan</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-container">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="dash-sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar-open' : ''}`}>
        <div className="dash-sidebar-header">
          <div className="dash-logo-text">SCAFF*FOOD</div>
          <button 
            className="dash-sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="dash-sidebar-nav">
          <a href="/dashboard" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </a>

          <a href="/dashboard/orders" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>Pesanan</span>
          </a>

          <a href="/dashboard/menu" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span>Menu</span>
          </a>

          <a href="/dashboard/laporan" className="dash-nav-item dash-nav-item-active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Laporan</span>
          </a>
        </nav>

        <div className="dash-sidebar-footer">
          <a href="/" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Ke Home</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <button 
              className="dash-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="dash-title">Laporan Keuangan</h1>
          </div>
        </header>

        {/* Content */}
        <div className="dash-content">
          <div className="laporan-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="laporan-header"
      >
        <h1>Laporan Keuangan</h1>
        
        <div className="date-filter">
          <div className="date-input-group">
            <label>Dari:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="date-input-group">
            <label>Sampai:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>

        <div className="export-buttons">
          <button onClick={exportToExcel} className="export-btn excel">
            Export Excel
          </button>
          <button onClick={exportToWord} className="export-btn word">
            Export Word
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">Rp</div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <p className="card-value">Rp {reportData.total_revenue.toLocaleString("id-ID")}</p>
          </div>
        </motion.div>

        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">#</div>
          <div className="card-content">
            <h3>Total Orders</h3>
            <p className="card-value">{reportData.total_orders}</p>
          </div>
        </motion.div>

        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">Qty</div>
          <div className="card-content">
            <h3>Produk Terjual</h3>
            <p className="card-value">{reportData.total_products_sold}</p>
          </div>
        </motion.div>

        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">Avg</div>
          <div className="card-content">
            <h3>Rata-rata Order</h3>
            <p className="card-value">Rp {reportData.average_order_value.toLocaleString("id-ID")}</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Bar Chart - Product Sales */}
        <motion.div
          className="chart-container"
          id="product-sales-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="chart-header">
            <h2>Penjualan Per Produk</h2>
            <button onClick={() => downloadChart("product-sales-chart")} className="download-chart-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={reportData.product_sales || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#bff000" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#bff000" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FA5209" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FA5209" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="product_name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="total_revenue" 
                fill="url(#colorRevenue)" 
                name="Revenue"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
              <Bar 
                dataKey="total_quantity" 
                fill="url(#colorQuantity)" 
                name="Jumlah Terjual"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart - Revenue Distribution */}
        <motion.div
          className="chart-container"
          id="revenue-distribution-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="chart-header">
            <h2>Distribusi Revenue Per Produk</h2>
            <button onClick={() => downloadChart("revenue-distribution-chart")} className="download-chart-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <defs>
                <filter id="shadow" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              <Pie
                data={reportData.product_sales || []}
                dataKey="total_revenue"
                nameKey="product_name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={130}
                paddingAngle={2}
                label={({ product_name, percent }) => `${product_name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                animationDuration={1000}
                style={{ filter: 'url(#shadow)' }}
              >
                {(reportData.product_sales || []).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Line Chart - Daily Sales */}
        <motion.div
          className="chart-container full-width"
          id="daily-sales-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="chart-header">
            <h2>Tren Penjualan Harian</h2>
            <button onClick={() => downloadChart("daily-sales-chart")} className="download-chart-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart 
              data={reportData.daily_sales || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorRevenueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrdersArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "Revenue") {
                    return `Rp ${value.toLocaleString("id-ID")}`;
                  }
                  return value;
                }}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Revenue"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                animationDuration={1000}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Jumlah Order"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Table Section */}
      <motion.div
        className="table-container"
        ref={tableRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2>Detail Penjualan Per Produk</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Produk</th>
              <th>Jumlah Terjual</th>
              <th>Total Revenue</th>
              <th>Jumlah Order</th>
              <th>Rata-rata per Order</th>
            </tr>
          </thead>
          <tbody>
            {(reportData.product_sales || []).map((product, index) => (
              <tr key={product.product_id}>
                <td>{index + 1}</td>
                <td>{product.product_name}</td>
                <td>{product.total_quantity}</td>
                <td>Rp {product.total_revenue.toLocaleString("id-ID")}</td>
                <td>{product.order_count}</td>
                <td>Rp {(product.total_revenue / product.order_count).toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2}><strong>TOTAL</strong></td>
              <td><strong>{reportData.total_products_sold}</strong></td>
              <td><strong>Rp {reportData.total_revenue.toLocaleString("id-ID")}</strong></td>
              <td><strong>{reportData.total_orders}</strong></td>
              <td><strong>Rp {reportData.average_order_value.toLocaleString("id-ID")}</strong></td>
            </tr>
          </tfoot>
        </table>
      </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
