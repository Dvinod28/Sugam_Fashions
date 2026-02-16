import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../Layout/DashboardLayout";
import StatCard from "../Shared/StatCard";
import DataTable from "../Shared/DataTable";
import OrderDetailsModal from "../Shared/OrderDetailsModal";
import ProductManager from "./ProductManager";
import BannerManager from "./BannerManager";
import ProductionTracker from "./ProductionTracker";
import ProductionDashboard from "../Production/ProductionDashboard";
import { ROLES } from "../../../data/roles";
import UserManagement from "./UserManagement";
import OfflineBilling from "./OfflineBilling";
import Accounts from "./Accounts";
import CalendarView from "./CalendarView";
import Purchase from "./Purchase";
import { HiOutlineCalendar } from "react-icons/hi";

// Helper: filter and search orders
function filterAndSearchOrders(orders, search, status, canceledOnly, statusFilter) {
  let filtered = (orders || []).filter((o) => {
    const isCanceled = (o.status || "") === "canceled";
    const isDelivered = (o.status || "") === "delivered";

    if (canceledOnly) {
      if (statusFilter === "delivered") {
        if (!isDelivered) return false;
      } else {
        if (!isCanceled) return false;
      }
    } else {
      if (isCanceled || isDelivered) return false;
    }

    if (status && status !== "all" && o.status !== status) return false;
    return true;
  });
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((o) => {
      const customer = o.customer?.name || o.customer?.email || "";
      const id = o.id || "";
      const items = Array.isArray(o.items)
        ? o.items.map((i) => i.title || i.name || "").join(" ")
        : "";
      return (
        customer.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q) ||
        items.toLowerCase().includes(q)
      );
    });
  }
  return filtered;
}

function formatDateLike(value) {
  if (!value) return null;
  try {
    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatDeliveryInfo(order) {
  if (!order) return "—";
  const dateValue =
    order.deliveryDate ||
    order.customer?.deliveryDate ||
    order.raw?.deliveryDate ||
    order.raw?.customer?.deliveryDate;
  const formattedDate = formatDateLike(dateValue);
  if (formattedDate) return formattedDate;
  const days =
    order.deliveryDays ||
    order.raw?.deliveryDays;
  if (days) return `${days} days`;
  return "—";
}

function getOrderDateValue(order) {
  if (!order) return null;
  const source =
    order.createdAt ||
    order.raw?.createdAt;
  if (!source) return null;
  try {
    if (typeof source.toDate === "function") {
      return source.toDate();
    }
    return new Date(source);
  } catch {
    return null;
  }
}

const CSV_HEADERS = [
  "Order ID",
  "Customer Name",
  "Phone",
  "Email",
  "Subtotal",
  "Status",
  "Payment Method",
  "Delivery Date",
  "Source",
  "Created At",
];

function escapeCsvValue(value) {
  const str = value === null || value === undefined ? "" : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

import {
  HiOutlineUsers,
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineCube,
  HiOutlineCalculator,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineArchive,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { TbCancel } from "react-icons/tb";
import { MdOutlineFeedback } from "react-icons/md";
import { HiOutlinePhotograph } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomers } from "../../../Redux/User/UserSlice";
import { getProduct } from "../../../Redux/Product/ProductSlice";
import {
  fetchOrders,
  updateOrderStatus,
} from "../../../Redux/Order/OrderSlice";
import { db } from "../../../firebase/config";
import {
  doc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import AreaChart from "../Shared/AreaChart";
import BarChart from "../Shared/BarChart";
import { IoClose } from "react-icons/io5";

// Search/filter bar component
function OrderSearchFilter({
  search,
  setSearch,
  status,
  setStatus,
  statusFilter,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-2 items-center">
      <input
        type="text"
        placeholder="Search by customer, order #, or product..."
        className="border border-gray-400 focus:outline-none px-3 py-2 rounded w-full md:w-64"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className="border border-gray-400 focus:outline-none px-2 py-2 rounded"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="done">Done</option>
        {statusFilter === "canceled" && (
          <option value="canceled">Canceled</option>
        )}
      </select>
    </div>
  );
}

export default function AdminDashboard() {
  const [active, setActive] = useState("overview");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [cancelSearch, setCancelSearch] = useState("");
  const [cancelStatus, setCancelStatus] = useState("all");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const dispatch = useDispatch();
  const customers = useSelector((s) => s.user?.customers || []);
  const products = useSelector((s) => s.product?.data || []);
  const orders = useSelector((s) => s.order?.data || []);
  const [feedbacks, setFeedbacks] = useState([]);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportError, setReportError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Normalize Indian phone numbers for WhatsApp links
  const normalizePhone = (raw) => {
    if (!raw) return "";
    let digits = String(raw).replace(/[^0-9]/g, "");
    // drop leading zeros
    digits = digits.replace(/^0+/, "");
    // if 10-digit local number, prepend India country code
    if (digits.length === 10) return `91${digits}`;
    // if already starts with 91 and has 12 digits, keep
    if (digits.startsWith("91") && digits.length === 12) return digits;
    // fallback: return digits as-is
    return digits;
  };

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(getProduct());
    dispatch(fetchOrders());
    // subscribe to feedback and inquiries collections for admin view
    try {
      const qFeedback = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc")
      );
      const qInquiries = query(
        collection(db, "inquiries"),
        orderBy("createdAt", "desc")
      );
      const unsubF = onSnapshot(qFeedback, (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFeedbacks(arr);
      });
      const unsubI = onSnapshot(qInquiries, (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setInquiries(arr);
      });
      return () => {
        try {
          unsubF();
        } catch (e) {}
        try {
          unsubI();
        } catch (e) {}
      };
    } catch (e) {
      // ignore
    }
  }, [dispatch]);

  const currentMonthOrders = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    return (orders || []).filter((order) => {
      const date = getOrderDateValue(order);
      return date && date.getMonth() === month && date.getFullYear() === year;
    });
  }, [orders]);

  const filterOrdersByRange = (startDate, endDate) => {
    return (orders || []).filter((order) => {
      const date = getOrderDateValue(order);
      if (!date) return false;
      return date >= startDate && date <= endDate;
    });
  };

  const downloadOrdersCsv = (data, label) => {
    if (!data.length) {
      setReportError(`No orders found for the selected ${label} range.`);
      return;
    }
    setReportError("");
    const rows = data.map((order) => {
      const customer = order.customer || {};
      const payment =
        order.paymentMethod ||
        order.raw?.paymentMethod ||
        "";
      const formattedPayment =
        typeof payment === "string" ? payment.toUpperCase() : payment;
      return [
        order.id,
        customer.name || "N/A",
        customer.phone || "N/A",
        customer.email || "N/A",
        Number(order.subtotal || 0).toFixed(2),
        order.status || "pending",
        formattedPayment || "—",
        formatDeliveryInfo(order),
        order.isOffline ? "Offline" : "Online",
        formatDateLike(order.createdAt || order.raw?.createdAt) || "",
      ];
    });
    const csvString = [
      CSV_HEADERS.join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleQuickDownload = async (type) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(endDate);
      if (type === "week") {
        startDate.setDate(startDate.getDate() - 6);
      } else {
        startDate.setDate(1);
      }
      startDate.setHours(0, 0, 0, 0);
      const filtered = filterOrdersByRange(startDate, endDate);
      downloadOrdersCsv(filtered, type === "week" ? "weekly" : "monthly");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCustomDownload = async () => {
    if (isDownloading) return;
    if (!customStartDate || !customEndDate) {
      setReportError("Please select both start and end dates for the report.");
      return;
    }
    const startDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    if (startDate > endDate) {
      setReportError("Start date cannot be later than end date.");
      return;
    }
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    setIsDownloading(true);
    try {
      const filtered = filterOrdersByRange(startDate, endDate);
      downloadOrdersCsv(filtered, `custom-${customStartDate}_to_${customEndDate}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const menu = [
    { key: "overview", label: "Overview", icon: HiOutlineChartBar },
    { key: "orders", label: "Orders", icon: HiOutlineCash },
    { key: "products", label: "Products", icon: HiOutlineArchive },
    { key: "layout", label: "Layout / Banners", icon: HiOutlinePhotograph },
    { key: "production", label: "Production", icon: HiOutlineClipboardList },
    { key: "thread", label: "Thread", icon: HiOutlineCube },
    { key: "r&d", label: "R&D", icon: HiOutlineChartBar },
    { key: "offline-billing", label: "Offline Billing", icon: HiOutlineCalculator },
    { key: "accounts", label: "Accounts", icon: HiOutlineCurrencyDollar },
    { key: "purchase", label: "Purchase", icon: HiOutlineClipboardList },
    { key: "users", label: "Users", icon: HiOutlineUsers },
    { key: "canceled", label: "Canceled Orders", icon: TbCancel },
    { key: "completed", label: "Completed Orders", icon: HiOutlineCheckCircle },
    {
      key: "inquiries",
      label: "Messages / Inquiries",
      icon: MdOutlineFeedback,
    },
    { key: "feedback", label: "Feedback", icon: MdOutlineFeedback },
    { key: "calendar", label: "Calendar", icon: HiOutlineCalendar },
  ];

  // Low stock table (overview)
  const columns = [
    { key: "sku", title: "SKU" },
    { key: "name", title: "Product" },
    { key: "stock", title: "Stock" },
    { key: "price", title: "Price" },
  ];

  const lowStock = useMemo(() => {
    return (products || [])
      .filter((p) => Number(p.stock || p.quantity || 0) <= 10)
      .slice(0, 10)
      .map((p) => {
        const sku = p.sku || p.id;
        const shortSku = typeof sku === 'string' && sku.length > 10 ? sku.substring(0, 8) + '...' : sku;
        return {
          sku: shortSku,
          name: p.name || p.title || "Product",
          stock: p.stock ?? p.quantity ?? 0,
          price:
            typeof p.price === "number"
              ? `₹${p.price.toFixed(2)}`
              : p.price || "—",
        };
      });
  }, [products]);

  const sales = useMemo(() => {
    // Compute from orders marked as done
    return (orders || [])
      .filter((o) => (o.status || "") === "done")
      .map((o) => ({
        createdAt: o.createdAt || null,
        amount: Number(o.subtotal || 0),
      }));
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return (currentMonthOrders || [])
      .filter((o) => {
        const status = (o.status || "").toLowerCase();
        return status === "done" || status === "delivered";
      })
      .reduce((sum, o) => sum + Number(o.subtotal || 0), 0);
  }, [currentMonthOrders]);

  const totalOrders = currentMonthOrders.length;

  return (
    <>
      <DashboardLayout
        title="Admin Dashboard"
        menu={menu}
        activeKey={active}
        onChange={setActive}
      >
        {active === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={HiOutlineCash}
                label="Revenue"
                value={`₹${totalRevenue.toFixed(2)}`}
                trend={{ positive: true, value: 0 }}
              />
              <StatCard
                icon={HiOutlineUsers}
                label="Customers"
                value={customers.length}
                trend={{ positive: true, value: 0 }}
              />
              <StatCard
                icon={HiOutlineCube}
                label="Products"
                value={products.length}
              />
              <StatCard
                icon={HiOutlineChartBar}
                label="Orders"
              value={totalOrders}
              />
            </div>
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Reports & Downloads</h3>
                <p className="text-sm text-gray-500">
                  Export order reports for this week, this month, or any custom date range.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickDownload("week")}
                  disabled={isDownloading}
                  className={`px-4 py-2 rounded-md text-white ${
                    isDownloading ? "bg-pink-300 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"
                  }`}
                >
                  Download This Week
                </button>
                <button
                  onClick={() => handleQuickDownload("month")}
                  disabled={isDownloading}
                  className={`px-4 py-2 rounded-md border ${
                    isDownloading
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-pink-200 text-pink-700 hover:bg-pink-50"
                  }`}
                >
                  Download This Month
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || undefined}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setReportError("");
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate || undefined}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setReportError("");
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCustomDownload}
                  disabled={isDownloading}
                  className={`w-full px-4 py-2 rounded-md ${
                    isDownloading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  Download Custom Range
                </button>
              </div>
            </div>
            {reportError && (
              <p className="text-sm text-red-600 mt-2">
                {reportError}
              </p>
            )}
          </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Low Stock Products</h2>
                <DataTable columns={columns} data={lowStock} />
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Growth Overview</h2>
                <AreaChart
                  width={600}
                  height={280}
                  months={12}
                  title="Last 12 months"
                  subtitle="Customers & Products"
                  series={[
                    {
                      name: "Customers",
                      color: "#ec4899",
                      items: customers.map((c) => ({
                        createdAt: c.createdAt || c.lastLoginAt || null,
                      })),
                    },
                    {
                      name: "Products",
                      color: "#06b6d4",
                      items: products.map((p) => ({
                        createdAt: p.createdAt || null,
                      })),
                    },
                  ]}
                />
              </div>

              <div className="space-y-4 xl:col-span-2">
                <h2 className="text-lg font-semibold">Sales Overview</h2>
                <BarChart
                  width={600}
                  height={250}
                  months={12}
                  title="Last 12 months"
                  subtitle="Sales"
                  color="#10b981"
                  currency="₹"
                  items={sales}
                />
              </div>
            </div>
          </>
        )}
        {active === "products" && <ProductManager />}
        {active === "layout" && <BannerManager />}
        {active === "production" && <ProductionTracker />}
        {active === "thread" && <ProductionDashboard userRole={ROLES.THREAD_WORK} />}
        {active === "r&d" && <ProductionDashboard userRole={ROLES.RD_DEPARTMENT} />}
        {active === "offline-billing" && <OfflineBilling />}
        {active === "accounts" && <Accounts />}
        {active === "purchase" && <Purchase />}
        {active === "orders" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Orders</h2>
              <OrderSearchFilter
                search={orderSearch}
                setSearch={setOrderSearch}
                status={orderStatus}
                setStatus={setOrderStatus}
                statusFilter="not-canceled"
              />
            </div>
            <DataTable
              columns={[
                { key: "createdAt", title: "Date" },
                {
                  key: "orderId",
                  title: "Order ID",
                  render: (val, row) =>
                    val ? (
                      <button
                        className="text-pink-600 font-semibold hover:underline"
                        onClick={() => {
                          setSelectedOrder(row);
                          setDetailsOpen(true);
                        }}
                      >
                        #{val}
                      </button>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "customer",
                  title: "Customer",
                  render: (val, row) => (
                    <button
                      className="text-left text-pink-600 font-semibold hover:underline"
                      onClick={() => {
                        setSelectedOrder(row);
                        setDetailsOpen(true);
                      }}
                    >
                      {val}
                    </button>
                  ),
                },
                { key: "phone", title: "Phone" },
                { key: "items", title: "Items" },
                { key: "subtotal", title: "Subtotal" },
                { key: "deliveryDate", title: "Delivery Date" },
                {
                  key: "status",
                  title: "Status",
                  render: (val, row) => (
                    <select
                      className="border rounded px-2 py-1"
                      value={row.status}
                      onChange={(e) =>
                        dispatch(updateOrderStatus(row.id, e.target.value))
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="canceled">Canceled</option>
                      <option value="done">Done</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  ),
                },
                {
                  key: "actions",
                  title: "",
                  render: (_, row) => (
                    <button
                      className="px-3 py-1.5 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        const reason = window.prompt(
                          "Provide reason to cancel this order:"
                        );
                        if (!reason) return;
                        // 1. Update order status and save reason in Firestore
                        await updateDoc(doc(db, "orders", row.id), {
                          status: "canceled",
                          cancelReason: reason,
                        });
                        dispatch(fetchOrders());
                        // 2. Send WhatsApp message to customer
                        const phone = normalizePhone(row.customerPhone || "");
                        if (phone && phone.length >= 12) {
                          // Compose detailed order info
                          let orderItems = "";
                          if (row.items && Array.isArray(row.items)) {
                            orderItems = row.items
                              .map(
                                (item, idx) =>
                                  `  ${idx + 1}. ${
                                    item.title || item.name || "Item"
                                  } - ₹${item.price} x ${item.quantity || 1}`
                              )
                              .join("\n");
                          } else if (typeof row.items === "number") {
                            orderItems = `Total items: ${row.items}`;
                          } else {
                            orderItems = "(No item details)";
                          }
                          const msg = `Your order #${row.id} has been canceled.\n\nOrder Details:\n- Customer: ${row.customer}\n- Items:\n${orderItems}\n- Subtotal: ${row.subtotal}\n\nReason: ${reason}`;
                          const url = `https://wa.me/${phone}?text=${encodeURIComponent(
                            msg
                          )}`;
                          window.open(url, "_blank");
                        }
                      }}
                      disabled={row.status === "canceled"}
                    >
                      Cancel Order
                    </button>
                  ),
                },
              ]}
              data={filterAndSearchOrders(
                orders,
                orderSearch,
                orderStatus,
                false
              ).map((o) => ({
                id: o.id,
                raw: o,
                orderId: o.id,
                createdAt: o.createdAt
                  ? new Date(o.createdAt).toLocaleString()
                  : "—",
                customer: o.customer?.name || o.customer?.email || "—",
                phone: o.customer?.phone || o.customerPhone || "—",
                items: Array.isArray(o.items) ? o.items.length : 0,
                subtotal: `₹${Number(o.subtotal || 0).toFixed(2)}`,
                deliveryDate: formatDeliveryInfo(o),
                status: o.status || "pending",
                customerPhone: o.customer?.phone || "",
              }))}
            />
          </div>
        )}
        {active === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Completed Orders</h2>
              <OrderSearchFilter
                search={cancelSearch}
                setSearch={setCancelSearch}
                status={cancelStatus}
                setStatus={setCancelStatus}
                statusFilter="delivered"
              />
            </div>
            <DataTable
              columns={[
                { key: "createdAt", title: "Date" },
                {
                  key: "orderId",
                  title: "Order ID",
                  render: (val, row) =>
                    val ? (
                      <button
                        className="text-pink-600 font-semibold hover:underline"
                        onClick={() => {
                          setSelectedOrder(row);
                          setDetailsOpen(true);
                        }}
                      >
                        #{val}
                      </button>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "customer",
                  title: "Customer",
                  render: (val, row) => (
                    <button
                      className="text-left text-pink-600 font-semibold hover:underline"
                      onClick={() => {
                        setSelectedOrder(row);
                        setDetailsOpen(true);
                      }}
                    >
                      {val}
                    </button>
                  ),
                },
                { key: "phone", title: "Phone" },
                { key: "items", title: "Items" },
                { key: "subtotal", title: "Subtotal" },
                { key: "deliveryDate", title: "Delivery Date" },
                { key: "status", title: "Status" },
              ]}
              data={filterAndSearchOrders(
                orders,
                cancelSearch,
                cancelStatus,
                true,
                "delivered"
              ).map((o) => ({
                id: o.id,
                raw: o,
                orderId: o.id,
                createdAt: o.createdAt
                  ? new Date(o.createdAt).toLocaleString()
                  : "—",
                customer: o.customer?.name || o.customer?.email || "—",
                phone: o.customer?.phone || o.customerPhone || "—",
                items: Array.isArray(o.items) ? o.items.length : 0,
                subtotal: `₹${Number(o.subtotal || 0).toFixed(2)}`,
                deliveryDate: formatDeliveryInfo(o),
                status: o.status || "delivered",
              }))}
            />
          </div>
        )}
        {active === "canceled" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Canceled Orders</h2>
              <OrderSearchFilter
                search={cancelSearch}
                setSearch={setCancelSearch}
                status={cancelStatus}
                setStatus={setCancelStatus}
                statusFilter="canceled"
              />
            </div>
            <DataTable
              columns={[
                { key: "createdAt", title: "Date" },
                {
                  key: "orderId",
                  title: "Order ID",
                  render: (val, row) =>
                    val ? (
                      <button
                        className="text-pink-600 font-semibold hover:underline"
                        onClick={() => {
                          setSelectedOrder(row);
                          setDetailsOpen(true);
                        }}
                      >
                        #{val}
                      </button>
                    ) : (
                      "—"
                    ),
                },
                {
                  key: "customer",
                  title: "Customer",
                  render: (val, row) => (
                    <button
                      className="text-left text-pink-600 font-semibold hover:underline"
                      onClick={() => {
                        setSelectedOrder(row);
                        setDetailsOpen(true);
                      }}
                    >
                      {val}
                    </button>
                  ),
                },
                { key: "phone", title: "Phone" },
                { key: "items", title: "Items" },
                { key: "subtotal", title: "Subtotal" },
                { key: "deliveryDate", title: "Delivery Date" },
                { key: "status", title: "Status" },
                { key: "cancelReason", title: "Cancel Reason" },
              ]}
              data={filterAndSearchOrders(
                orders,
                cancelSearch,
                cancelStatus,
                true
              ).map((o) => ({
                id: o.id,
                raw: o,
                orderId: o.id,
                createdAt: o.createdAt
                  ? new Date(o.createdAt).toLocaleString()
                  : "—",
                customer: o.customer?.name || o.customer?.email || "—",
                phone: o.customer?.phone || o.customerPhone || "—",
                items: Array.isArray(o.items) ? o.items.length : 0,
                subtotal: `₹${Number(o.subtotal || 0).toFixed(2)}`,
                deliveryDate: formatDeliveryInfo(o),
                status: o.status || "canceled",
                cancelReason: o.cancelReason || "—",
              }))}
            />
          </div>
        )}
        {active === "users" && <UserManagement />}
        {active === "feedback" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Feedback</h2>
            <DataTable
              columns={[
                { key: "createdAt", title: "Date" },
                { key: "name", title: "Name" },
                { key: "phone", title: "Phone" },
                {
                  key: "message",
                  title: "Feedback",
                  render: (val) => (
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {val}
                    </div>
                  ),
                },
              ]}
              data={(feedbacks || []).map((f) => ({
                id: f.id,
                createdAt:
                  f.createdAt && f.createdAt.toDate
                    ? f.createdAt.toDate().toLocaleString()
                    : "—",
                name: f.user?.displayName || "Unknown",
                phone: f.user?.phone || "—",
                message: f.message || "",
              }))}
            />
          </div>
        )}
        {active === "inquiries" && ( 
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Messages / Inquiries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(inquiries || []).map((inq) => (
                <div
                  key={inq.id}
                  className="p-4 border border-pink-200 rounded-md shadow-sm hover:shadow-md cursor-pointer"
                  onClick={() => {
                    setSelectedInquiry(inq);
                    setInquiryOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-pink-600">
                        {inq.name || inq.user?.displayName || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {inq.phone || inq.user?.phone || "—"}
                      </div>
                    </div>
                    <div className=" mb-4 text-xs text-gray-400">
                      {inq.createdAt && inq.createdAt.toDate
                        ? inq.createdAt.toDate().toLocaleString()
                        : "—"}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-20 overflow-hidden">
                    {inq.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {active === "calendar" && <CalendarView />}
      </DashboardLayout>
      {/* Inquiry modal */}
      {inquiryOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setInquiryOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Message</h3>
              <button
                onClick={() => setInquiryOpen(false)}
                className="text-red-500 bg-pink-100 p-1 rounded hover:text-red-100 hover:bg-pink-500 cursor-pointer transition-colors duration-300"
              >
                <IoClose className="text-xl" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">From</div>
                <div className="font-semibold">
                  {selectedInquiry.name ||
                    selectedInquiry.user?.displayName ||
                    "Unknown"}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedInquiry.email || selectedInquiry.user?.email || "—"}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedInquiry.phone || selectedInquiry.user?.phone || "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Subject</div>
                <div className="font-medium">
                  {selectedInquiry.subject || "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Message</div>
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedInquiry.message}
                </div>
              </div>
              <div className="text-sm text-gray-400">
                {selectedInquiry.createdAt && selectedInquiry.createdAt.toDate
                  ? selectedInquiry.createdAt.toDate().toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Order details modal (mounted here so it overlays dashboard) */}
      <OrderDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </>
  );
}
