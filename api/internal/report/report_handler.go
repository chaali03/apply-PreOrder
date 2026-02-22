package report

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type ReportHandler struct {
	DB *sql.DB
}

type ProductSales struct {
	ProductID     string  `json:"product_id"`
	ProductName   string  `json:"product_name"`
	TotalQuantity int     `json:"total_quantity"`
	TotalRevenue  float64 `json:"total_revenue"`
	OrderCount    int     `json:"order_count"`
}

type DailySales struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
	Orders  int     `json:"orders"`
}

type ReportData struct {
	TotalRevenue       float64        `json:"total_revenue"`
	TotalOrders        int            `json:"total_orders"`
	TotalProductsSold  int            `json:"total_products_sold"`
	AverageOrderValue  float64        `json:"average_order_value"`
	ProductSales       []ProductSales `json:"product_sales"`
	DailySales         []DailySales   `json:"daily_sales"`
}

func NewReportHandler(db *sql.DB) *ReportHandler {
	return &ReportHandler{DB: db}
}

func (h *ReportHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	if startDate == "" {
		startDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	report := ReportData{}

	// Get total revenue and orders
	query := `
		SELECT 
			COALESCE(SUM(total_price), 0) as total_revenue,
			COUNT(*) as total_orders
		FROM orders 
		WHERE status IN ('completed', 'delivered')
		AND DATE(created_at) BETWEEN $1 AND $2
	`
	err := h.DB.QueryRow(query, startDate, endDate).Scan(&report.TotalRevenue, &report.TotalOrders)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get total products sold
	query = `
		SELECT COALESCE(SUM(oi.quantity), 0)
		FROM order_items oi
		JOIN orders o ON oi.order_id = o.id
		WHERE o.status IN ('completed', 'delivered')
		AND DATE(o.created_at) BETWEEN $1 AND $2
	`
	err = h.DB.QueryRow(query, startDate, endDate).Scan(&report.TotalProductsSold)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Calculate average order value
	if report.TotalOrders > 0 {
		report.AverageOrderValue = report.TotalRevenue / float64(report.TotalOrders)
	}

	// Get product sales
	query = `
		SELECT 
			p.id,
			p.name,
			COALESCE(SUM(oi.quantity), 0) as total_quantity,
			COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
			COUNT(DISTINCT o.id) as order_count
		FROM products p
		LEFT JOIN order_items oi ON p.id = oi.product_id
		LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('completed', 'delivered')
			AND DATE(o.created_at) BETWEEN $1 AND $2
		GROUP BY p.id, p.name
		HAVING COALESCE(SUM(oi.quantity), 0) > 0
		ORDER BY total_revenue DESC
	`
	rows, err := h.DB.Query(query, startDate, endDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	report.ProductSales = []ProductSales{}
	for rows.Next() {
		var ps ProductSales
		err := rows.Scan(&ps.ProductID, &ps.ProductName, &ps.TotalQuantity, &ps.TotalRevenue, &ps.OrderCount)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		report.ProductSales = append(report.ProductSales, ps)
	}

	// Get daily sales
	query = `
		SELECT 
			DATE(created_at) as date,
			COALESCE(SUM(total_price), 0) as revenue,
			COUNT(*) as orders
		FROM orders
		WHERE status IN ('completed', 'delivered')
		AND DATE(created_at) BETWEEN $1 AND $2
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`
	rows, err = h.DB.Query(query, startDate, endDate)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	report.DailySales = []DailySales{}
	for rows.Next() {
		var ds DailySales
		var date time.Time
		err := rows.Scan(&date, &ds.Revenue, &ds.Orders)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		ds.Date = date.Format("2006-01-02")
		report.DailySales = append(report.DailySales, ds)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}
 