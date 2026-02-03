import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/config";
import DataTable from "../Shared/DataTable";
import OrderDetailsModal from "../Shared/OrderDetailsModal";
import { getOrderById } from "../../../api/orders";
import { ROLES } from "../../../data/roles";
import {
  getReminderDateForRole,
  toDateSafe,
} from "../../../utils/productionDates";

const ProductionTracker = () => {
  const [productionData, setProductionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const orders = useSelector((s) => s.order?.data || []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "production"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setProductionData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const orderLookup = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      if (order?.id) {
        map[order.id] = order;
      }
    });
    return map;
  }, [orders]);

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      if (typeof value.toDate === "function") {
        return value.toDate().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value?.toString() || "—";
    }
  };

  const formatDateOnly = (value) => {
    if (!value) return "—";
    try {
      if (typeof value.toDate === "function") {
        return value.toDate().toLocaleDateString("en-IN");
      }
      return new Date(value).toLocaleDateString("en-IN");
    } catch {
      return value?.toString() || "—";
    }
  };

  const enrichedData = useMemo(() => {
    return productionData.map((entry) => {
      const order = orderLookup[entry.orderId] || {};
      const customer = order.customer || {};
      const entryCustomerName = entry.customerName || customer.name || "N/A";
      const entryCustomerPhone = entry.customerPhone || customer.phone || "N/A";
      const entryDeliverySource =
        entry.deliveryDate ||
        entry.customerDeliveryDate ||
        order.deliveryDate ||
        customer.deliveryDate ||
        null;
      const deliveryDateObj = toDateSafe(entryDeliverySource);
      const reminderDateObj = getReminderDateForRole(
        deliveryDateObj,
        entry.department
      );
      const entryBookingSource =
        entry.bookingDate ||
        entry.createdAt ||
        order.createdAt ||
        null;
      const formattedReminderDate =
        formatDateOnly(reminderDateObj || deliveryDateObj) || "—";
      const formattedDeliveryDate = formatDateOnly(deliveryDateObj) || "—";
      return {
        ...entry,
        customerName: entryCustomerName,
        customerPhone: entryCustomerPhone,
        bookingDate: formatDateOnly(entryBookingSource),
        deliveryDate: formattedReminderDate,
        productionDeliveryDate: reminderDateObj || deliveryDateObj || null,
        actualDeliveryDate: formattedDeliveryDate,
        createdAtFormatted: formatDate(entry.createdAt),
        source: entry.isOffline || order.isOffline ? "Offline" : "Online",
      };
    });
  }, [productionData, orderLookup]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return enrichedData;
    const term = search.toLowerCase();
    return enrichedData.filter((entry) => {
      return (
        entry.orderId?.toLowerCase().includes(term) ||
        entry.productId?.toLowerCase().includes(term) ||
        entry.department?.toLowerCase().includes(term) ||
        entry.customerName?.toLowerCase().includes(term) ||
        entry.customerPhone?.toLowerCase().includes(term)
      );
    });
  }, [enrichedData, search]);

  const handleOrderClick = async (orderId, rowMeta) => {
    if (!orderId) return;
    setDetailsError("");
    setDetailsLoading(true);
    setDetailsOpen(true);
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        setSelectedOrder({
          id: orderId,
          productionDeliveryDate: rowMeta?.productionDeliveryDate || rowMeta?.deliveryDate,
        });
        setDetailsError("Order not found.");
      } else {
        setSelectedOrder({
          raw: order,
          ...order,
          productionDeliveryDate: rowMeta?.productionDeliveryDate || rowMeta?.deliveryDate,
        });
      }
    } catch (err) {
      setDetailsError("Unable to load order details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const columns = [
    {
      title: "Order #",
      key: "orderId",
      render: (val, row) =>
        val ? (
          <button
            className="text-pink-600 font-semibold hover:underline"
            onClick={() => handleOrderClick(val, row)}
          >
            #{val}
          </button>
        ) : (
          "—"
        ),
    },
    { title: "Customer", key: "customerName" },
    { title: "Phone", key: "customerPhone" },
    { title: "Booking Date", key: "bookingDate" },
    { title: "Delivery Date", key: "deliveryDate" },
    { title: "Product", key: "productId" },
    { title: "Department", key: "department" },
    { title: "Status", key: "status" },
    { title: "Source", key: "source" },
    {
      title: "Created At",
      key: "createdAtFormatted",
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">Production Tracker</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order, customer, phone..."
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-80"
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable columns={columns} data={filteredData} />
      )}
      <OrderDetailsModal
        open={detailsOpen}
        order={selectedOrder}
        loading={detailsLoading}
        error={detailsError}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedOrder(null);
          setDetailsError("");
        }}
      />
    </div>
  );
};

export default ProductionTracker;