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
  
  // Filter and sort states
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"revenue" | "quantity" | "orders">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reports?start_date=${dateRange.start}&end_date=${dateRange.end}`
      );
      const data = await response.json();
      
      // Ensure arrays are initialized
      if (data) {
        data.product_sales = data.product_sales || [];
        data.daily_sales = data.daily_sales || [];
        
        // Extract unique product names for filter
        const products = data.product_sales.map((p: ProductSales) => p.product_name);
        setAvailableProducts(products);
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
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort product sales data
  const getFilteredAndSortedData = () => {
    if (!reportData) return [];
    
    let filtered = [...reportData.product_sales];
    
    // Apply product filter
    if (selectedProduct !== "all") {
      filtered = filtered.filter(p => p.product_name === selectedProduct);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case "revenue":
          compareValue = a.total_revenue - b.total_revenue;
          break;
        case "quantity":
          compareValue = a.total_quantity - b.total_quantity;
          break;
        case "orders":
          compareValue = a.order_count - b.order_count;
          break;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });
    
    return filtered;
  };

  // Calculate filtered totals
  const getFilteredTotals = () => {
    const filtered = getFilteredAndSortedData();
    
    return {
      total_revenue: filtered.reduce((sum, p) => sum + p.total_revenue, 0),
      total_quantity: filtered.reduce((sum, p) => sum + p.total_quantity, 0),
      total_orders: filtered.reduce((sum, p) => sum + p.order_count, 0),
      average_order_value: filtered.length > 0 
        ? filtered.reduce((sum, p) => sum + p.total_revenue, 0) / filtered.reduce((sum, p) => sum + p.order_count, 0)
        : 0
    };
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const filteredData = getFilteredAndSortedData();
    const filteredTotals = getFilteredTotals();

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["LAPORAN KEUANGAN"],
      ["Periode", `${dateRange.start} s/d ${dateRange.end}`],
      selectedProduct !== "all" ? ["Filter Produk", selectedProduct] : [],
      [""],
      ["Total Revenue", `Rp ${filteredTotals.total_revenue.toLocaleString("id-ID")}`],
      ["Total Orders", filteredTotals.total_orders],
      ["Total Produk Terjual", filteredTotals.total_quantity],
      ["Rata-rata Nilai Order", `Rp ${filteredTotals.average_order_value.toLocaleString("id-ID")}`],
    ].filter(row => row.length > 0);
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

    // Product Sales Sheet
    const productData = [
      ["Nama Produk", "Jumlah Terjual", "Total Revenue", "Jumlah Order"],
      ...filteredData.map((p) => [
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

    const filename = selectedProduct !== "all" 
      ? `Laporan_${selectedProduct}_${dateRange.start}_${dateRange.end}.xlsx`
      : `Laporan_Keuangan_${dateRange.start}_${dateRange.end}.xlsx`;
    
    XLSX.writeFile(wb, filename);
  };

  const exportToWord = () => {
    if (!reportData) return;

    const filteredData = getFilteredAndSortedData();
    const filteredTotals = getFilteredTotals();

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
          .filter-info { background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <h1>LAPORAN KEUANGAN</h1>
        <p style="text-align: center;">Periode: ${dateRange.start} s/d ${dateRange.end}</p>
        ${selectedProduct !== "all" ? `<div class="filter-info"><strong>Filter Produk:</strong> ${selectedProduct}</div>` : ''}
        
        <div class="summary">
          <h2>Ringkasan</h2>
          <div class="summary-item"><strong>Total Revenue:</strong> Rp ${filteredTotals.total_revenue.toLocaleString("id-ID")}</div>
          <div class="summary-item"><strong>Total Orders:</strong> ${filteredTotals.total_orders}</div>
          <div class="summary-item"><strong>Total Produk Terjual:</strong> ${filteredTotals.total_quantity}</div>
          <div class="summary-item"><strong>Rata-rata Nilai Order:</strong> Rp ${filteredTotals.average_order_value.toLocaleString("id-ID")}</div>
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
            ${filteredData.map((p) => `
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
    const filename = selectedProduct !== "all" 
      ? `Laporan_${selectedProduct}_${dateRange.start}_${dateRange.end}.doc`
      : `Laporan_Keuangan_${dateRange.start}_${dateRange.end}.doc`;
    
    saveAs(blob, filename);
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

          <a href="/dashboard/qris" className="dash-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>QRIS</span>
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

      {/* Filter and Sort Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'white',
          border: '2px solid #1a1a1a',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          {/* Product Filter */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 700, 
              marginBottom: '8px',
              color: '#1a1a1a'
            }}>
              Filter Produk
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #1a1a1a',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">Semua Produk</option>
              {availableProducts.map((product, idx) => (
                <option key={idx} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 700, 
              marginBottom: '8px',
              color: '#1a1a1a'
            }}>
              Urutkan Berdasarkan
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "revenue" | "quantity" | "orders")}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #1a1a1a',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="revenue">Total Revenue</option>
              <option value="quantity">Jumlah Terjual</option>
              <option value="orders">Jumlah Order</option>
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 700, 
              marginBottom: '8px',
              color: '#1a1a1a'
            }}>
              Urutan
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #1a1a1a',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 600,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="desc">Tertinggi ke Terendah</option>
              <option value="asc">Terendah ke Tertinggi</option>
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => {
              setSelectedProduct("all");
              setSortBy("revenue");
              setSortOrder("desc");
            }}
            style={{
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: '2px solid #1a1a1a',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Reset Filter
          </button>
        </div>

        {/* Filter Info */}
        {selectedProduct !== "all" && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              Filter aktif: Menampilkan data untuk produk "{selectedProduct}"
            </span>
          </div>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">Rp</div>
          <div className="card-content">
            <h3>Total Revenue {selectedProduct !== "all" && "(Filtered)"}</h3>
            <p className="card-value">Rp {getFilteredTotals().total_revenue.toLocaleString("id-ID")}</p>
            {selectedProduct !== "all" && (
              <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Dari semua: Rp {reportData.total_revenue.toLocaleString("id-ID")}
              </small>
            )}
          </div>
        </motion.div>

        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">#</div>
          <div className="card-content">
            <h3>Total Orders {selectedProduct !== "all" && "(Filtered)"}</h3>
            <p className="card-value">{getFilteredTotals().total_orders}</p>
            {selectedProduct !== "all" && (
              <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Dari semua: {reportData.total_orders}
              </small>
            )}
          </div>
        </motion.div>

        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">Qty</div>
          <div className="card-content">
            <h3>Produk Terjual {selectedProduct !== "all" && "(Filtered)"}</h3>
            <p className="card-value">{getFilteredTotals().total_quantity}</p>
            {selectedProduct !== "all" && (
              <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Dari semua: {reportData.total_products_sold}
              </small>
            )}
          </div>
        </motion.div>

        <motion.div className="summary-card" whileHover={{ scale: 1.05 }}>
          <div className="card-icon">Avg</div>
          <div className="card-content">
            <h3>Rata-rata Order {selectedProduct !== "all" && "(Filtered)"}</h3>
            <p className="card-value">Rp {getFilteredTotals().average_order_value.toLocaleString("id-ID")}</p>
            {selectedProduct !== "all" && (
              <small style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                Dari semua: Rp {reportData.average_order_value.toLocaleString("id-ID")}
              </small>
            )}
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
              data={getFilteredAndSortedData()}
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
                data={getFilteredAndSortedData()}
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
                {getFilteredAndSortedData().map((entry, index) => (
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
            {getFilteredAndSortedData().map((product, index) => (
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
              <td colSpan={2}><strong>TOTAL {selectedProduct !== "all" ? "(FILTERED)" : ""}</strong></td>
              <td><strong>{getFilteredTotals().total_quantity}</strong></td>
              <td><strong>Rp {getFilteredTotals().total_revenue.toLocaleString("id-ID")}</strong></td>
              <td><strong>{getFilteredTotals().total_orders}</strong></td>
              <td><strong>Rp {getFilteredTotals().average_order_value.toLocaleString("id-ID")}</strong></td>
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
