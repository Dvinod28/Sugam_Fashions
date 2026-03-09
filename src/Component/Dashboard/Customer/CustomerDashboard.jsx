import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../Layout/DashboardLayout";
import StatCard from "../Shared/StatCard";
import DataTable from "../Shared/DataTable";
import {
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyOrders } from "../../../Redux/Order/OrderSlice";
import { toggleWishlist } from "../../../Redux/Wishlist/WishlistSlice";
import { MdOutlineDeleteForever } from "react-icons/md";
import ProductCartAction from "../../Common/ProductCartAction";
import { ROLES } from "../../../data/roles";

const HIDDEN_VALUE = "Hidden";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/&/g, "");
}

export default function CustomerDashboard() {
  const [active, setActive] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const wishlist = useSelector((s) => s.wishlist || []);
  const user = useSelector((s) => s.user?.currentUser);
  const orders = useSelector((s) => s.order?.data || []);
  const orderLoading = useSelector((s) => s.order?.loading || false);
  const orderError = useSelector((s) => s.order?.error || null);
  const dispatch = useDispatch();

  const normalizedRole = normalizeRole(user?.role);
  const hidePriceFields =
    normalizedRole === ROLES.THREAD_WORK ||
    normalizedRole === ROLES.RD_DEPARTMENT ||
    normalizedRole === "rddepartment";

  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.uid) {
        setIsLoading(true);
        setError(null);
        try {
          await dispatch(fetchMyOrders(user.uid));
        } catch (loadError) {
          console.error("Failed to fetch orders:", loadError);
          setError(loadError.message || "Failed to load orders");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [dispatch, user?.uid]);

  const menu = [
    { key: "overview", label: "Overview", icon: HiOutlineShoppingBag },
    { key: "orders", label: "Orders", icon: HiOutlineCreditCard },
    { key: "completed", label: "Completed Orders", icon: HiOutlineCheckCircle },
    { key: "wishlist", label: "Wishlist", icon: HiOutlineHeart },
  ];

  const columns = useMemo(() => {
    const baseColumns = [
      { key: "id", title: "Order #" },
      { key: "createdAt", title: "Date" },
      { key: "status", title: "Status" },
      { key: "deliveryDate", title: "Delivery Date" },
    ];

    if (!hidePriceFields) {
      baseColumns.push({ key: "subtotal", title: "Total" });
    }

    return baseColumns;
  }, [hidePriceFields]);

  const formatDeliveryDate = (order) => {
    const source = order.deliveryDate || order.customer?.deliveryDate || order.deliveryDays;
    if (!source) return "—";
    if (typeof source === "number") {
      return `${source} days`;
    }
    try {
      return new Date(source).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return source;
    }
  };

  const formattedOrders = useMemo(() => {
    return (orders || []).map((o) => ({
      id: o.id,
      createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : "—",
      status: o.status || "placed",
      deliveryDate: formatDeliveryDate(o),
      ...(hidePriceFields
        ? {}
        : { subtotal: `\u20B9${Number(o.subtotal || 0).toFixed(2)}` }),
    }));
  }, [orders, hidePriceFields]);

  const completedOrders = useMemo(() => {
    return (orders || [])
      .filter((o) => (o.status || "") === "delivered" || (o.status || "") === "done")
      .map((o) => ({
        id: o.id,
        createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : "—",
        status: o.status || "delivered",
        deliveryDate: formatDeliveryDate(o),
        ...(hidePriceFields
          ? {}
          : { subtotal: `\u20B9${Number(o.subtotal || 0).toFixed(2)}` }),
      }));
  }, [orders, hidePriceFields]);

  const totalSpent = useMemo(
    () =>
      (orders || [])
        .filter((o) => (o.status || "") === "done" || (o.status || "") === "delivered")
        .reduce((sum, o) => sum + Number(o.subtotal || 0), 0),
    [orders]
  );

  const recentOrders = useMemo(() => {
    return formattedOrders.slice(0, 5);
  }, [formattedOrders]);

  if (isLoading || orderLoading) {
    return (
      <DashboardLayout
        title="My Dashboard"
        menu={menu}
        activeKey={active}
        onChange={setActive}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || orderError) {
    return (
      <DashboardLayout
        title="My Dashboard"
        menu={menu}
        activeKey={active}
        onChange={setActive}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load orders</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || orderError}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard icon={HiOutlineShoppingBag} label="Orders" value="—" />
          <StatCard icon={HiOutlineHeart} label="Wishlist" value={wishlist.length} />
          <StatCard
            icon={HiOutlineCreditCard}
            label="Spent"
            value={hidePriceFields ? HIDDEN_VALUE : "\u20B90.00"}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="My Dashboard"
      menu={menu}
      activeKey={active}
      onChange={setActive}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={HiOutlineShoppingBag}
          label="Orders"
          value={orders.length}
          trend={{ positive: true, value: 0 }}
        />
        <StatCard icon={HiOutlineHeart} label="Wishlist" value={wishlist.length} />
        <StatCard
          icon={HiOutlineCreditCard}
          label="Spent"
          value={hidePriceFields ? HIDDEN_VALUE : `\u20B9${totalSpent.toFixed(2)}`}
        />
      </div>

      {active === "overview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            {orders.length > 5 && (
              <button
                onClick={() => setActive("orders")}
                className="text-pink-600 hover:text-pink-800 text-sm font-medium"
              >
                View All →
              </button>
            )}
          </div>
          {recentOrders.length > 0 ? (
            <DataTable columns={columns} data={recentOrders} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent orders found. Start shopping to see your orders here!
            </div>
          )}
        </div>
      )}

      {active === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">My Orders</h2>
            <span className="text-sm text-gray-500">
              {orders.length} total order{orders.length !== 1 ? "s" : ""}
            </span>
          </div>
          {formattedOrders.length > 0 ? (
            <DataTable columns={columns} data={formattedOrders} />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No orders found</div>
              <p className="text-sm text-gray-400">
                Your orders will appear here once you make a purchase.
              </p>
            </div>
          )}
        </div>
      )}

      {active === "completed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Completed Orders</h2>
            <span className="text-sm text-gray-500">
              {completedOrders.length} delivered order{completedOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
          {completedOrders.length > 0 ? (
            <DataTable columns={columns} data={completedOrders} />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No completed orders found</div>
              <p className="text-sm text-gray-400">Your delivered orders will appear here.</p>
            </div>
          )}
        </div>
      )}

      {active === "wishlist" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">My Wishlist</h2>
          {!wishlist || wishlist.length === 0 ? (
            <div className="text-gray-500">Your wishlist is empty.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map((item) => {
                const images = Array.isArray(item.images)
                  ? item.images
                  : [item?.images || item?.image].filter(Boolean);
                const img = images[0] || "/images/img-1.jpg";
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-300 rounded-lg p-3 flex flex-col"
                  >
                    <img
                      src={img}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-50 object-cover rounded mb-3"
                      onError={(e) => {
                        e.currentTarget.src = "/images/img-1.jpg";
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 line-clamp-1">{item.title}</div>
                      <div className="text-pink-600 font-semibold">
                        {hidePriceFields
                          ? HIDDEN_VALUE
                          : `\u20B9${Number(item.price || 0).toFixed(2)}`}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <ProductCartAction
                        product={{
                          id: item.id,
                          title: item.title,
                          price: item.price,
                          images,
                          description: item.description,
                        }}
                        openDrawerOnAdd={false}
                        addLabel="Add to Cart"
                        addButtonClassName="flex-1 px-3 py-2 rounded-md text-sm md:text-base font-semibold"
                        controlsWrapperClassName="flex-1 flex-wrap"
                      />
                      <button
                        onClick={() => dispatch(toggleWishlist(item))}
                        className="px-3 py-2 rounded-md border border-red-500 text-red-500 hover:bg-red-100 hover:cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <MdOutlineDeleteForever className="text-2xl" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
