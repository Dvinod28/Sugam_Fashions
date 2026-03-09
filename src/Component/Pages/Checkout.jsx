import { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { clear } from "../../Redux/Cart/CartSlice";
import { placeOrder } from "../../Redux/Order/OrderSlice";
import { useAuth } from "../../contexts/AuthContext";
import { createProductionEntry } from "../../firebase/production";
import { ROLES } from "../../data/roles";

const MEASUREMENT_FIELDS = [
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "shoulder", label: "Shoulder" },
  { key: "backNeck", label: "Back Neck" },
  { key: "bagal", label: "Bagal" },
  { key: "frontNeck", label: "Front Neck" },
  { key: "chest", label: "Chest" },
  { key: "handsLength", label: "Hands Length" },
  { key: "handsRound", label: "Hands Round" },
  { key: "bristLength", label: "Brist Length" },
  { key: "shoulderPatti", label: "Shoulder Patti" },
];

const createEmptyMeasurements = () =>
  MEASUREMENT_FIELDS.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});

function normalizeItemMeasurements(measurements) {
  return {
    ...createEmptyMeasurements(),
    ...(measurements && typeof measurements === "object" ? measurements : {}),
  };
}

function getCheckoutItemKey(item, index) {
  return [
    String(item?.id || `item-${index}`),
    String(item?.selectedColor || ""),
    String(item?.selectedSize || ""),
    String(index),
  ].join("::");
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function validateCustomerData(customer) {
  const errors = {};

  if (!customer.name || customer.name.trim().length < 2) {
    errors.name = "Full name is required (minimum 2 characters)";
  }

  if (!customer.phone || !/^[6-9]\d{9}$/.test(customer.phone.replace(/[^0-9]/g, ""))) {
    errors.phone = "Valid 10-digit phone number is required";
  }

  if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.email = "Valid email address is required";
  }

  if (!customer.address || customer.address.trim().length < 10) {
    errors.address = "Delivery address is required (minimum 10 characters)";
  }

  return errors;
}

function getDefaultDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().split("T")[0];
}

function formatDeliveryDateForDisplay(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAuthenticated } = useAuth();
  const cart = useSelector((s) => s.cart || []);

  const [buyNowItem] = useState(() => {
    try {
      const raw = sessionStorage.getItem("buyNowItem");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [deliveryDate, setDeliveryDate] = useState(() => getDefaultDeliveryDate());
  const [deliveryDateError, setDeliveryDateError] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemMeasurements, setItemMeasurements] = useState({});

  const buyNowItems =
    buyNowItem && Array.isArray(buyNowItem.items) ? buyNowItem.items : [];
  const isBuyNowFlow = Boolean(location.state?.fromBuyNow);
  const shouldUseBuyNow =
    isBuyNowFlow || (cart.length === 0 && buyNowItems.length > 0);
  const items = shouldUseBuyNow ? buyNowItems : cart;

  const { subtotal } = useMemo(() => {
    const subtotalCalc = items.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.quantity || 1),
      0
    );
    return { subtotal: subtotalCalc };
  }, [items]);

  useEffect(() => {
    if (currentUser) {
      setCustomer((prev) => ({
        ...prev,
        name: currentUser.displayName || prev.name,
        email: currentUser.email || prev.email,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    setItemMeasurements((prev) => {
      const next = {};
      items.forEach((item, index) => {
        const itemKey = getCheckoutItemKey(item, index);
        next[itemKey] = {
          ...normalizeItemMeasurements(item?.measurements),
          ...(prev[itemKey] || {}),
        };
      });
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (!shouldUseBuyNow && buyNowItems.length > 0) {
      try {
        sessionStorage.removeItem("buyNowItem");
      } catch {
        void 0;
      }
    }
  }, [shouldUseBuyNow, buyNowItems.length]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!items.length && !orderPlaced) return <Navigate to="/cart" replace />;

  const handleInputChange = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleMeasurementChange = (itemKey, fieldKey, value) => {
    setItemMeasurements((prev) => ({
      ...prev,
      [itemKey]: {
        ...normalizeItemMeasurements(prev[itemKey]),
        [fieldKey]: value,
      },
    }));
  };

  const handlePlaceOrder = async () => {
    try {
      const validationErrors = validateCustomerData(customer);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstErrorField = Object.keys(validationErrors)[0];
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          errorElement.focus();
        }
        return;
      }

      if (!deliveryDate) {
        setDeliveryDateError("Delivery date is required");
        return;
      }

      setDeliveryDateError("");
      setIsSubmitting(true);

      const adminPhone = import.meta.env.VITE_ADMIN_WHATSAPP || "";
      if (!adminPhone) {
        alert("Admin WhatsApp number is not set!");
        setIsSubmitting(false);
        return;
      }

      const orderItems = items.map((item, index) => {
        const itemKey = getCheckoutItemKey(item, index);
        const images = Array.isArray(item.images)
          ? item.images
          : [item?.images || item?.image].filter(Boolean);

        return {
          id: item.id,
          title: item.title || item.name || "Product",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          images,
          selectedColor: item.selectedColor || "",
          selectedSize: item.selectedSize || "",
          measurements:
            itemMeasurements[itemKey] || normalizeItemMeasurements(item?.measurements),
        };
      });

      const orderResult = await dispatch(
        placeOrder({
          user: currentUser,
          items: orderItems,
          totals: { subtotal },
          customer: { ...customer, deliveryDate },
        })
      );

      if (orderResult && orderResult.id) {
        const orderId = orderResult.id;
        const productionMeta = {
          customerName: customer.name,
          customerPhone: customer.phone,
          customerDeliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : null,
          bookingDate: new Date().toISOString(),
          isOffline: false,
          paymentMethod: "online",
        };

        for (const item of orderItems) {
          await createProductionEntry(orderId, item.id, ROLES.THREAD_WORK, productionMeta);
          await createProductionEntry(orderId, item.id, ROLES.RD_DEPARTMENT, productionMeta);
        }
      }

      const message = `
New Order Placed!

Name: ${customer?.name}
Phone: ${customer?.phone}
Address: ${customer?.address}
Delivery Date: ${formatDeliveryDateForDisplay(deliveryDate)}

Items:
${orderItems
  .map((i) => `- ${i.title} x ${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}`)
  .join("\n")}

Total: ₹${subtotal.toFixed(2)}

Please confirm the order.
      `.trim();

      const phone = adminPhone.replace(/[^0-9]/g, "");
      const encodedMsg = encodeURIComponent(message);
      const appUrl = `whatsapp://send?phone=${phone}&text=${encodedMsg}`;
      const webUrl = `https://wa.me/${phone}?text=${encodedMsg}`;
      const isMobile = isMobileDevice();

      if (isMobile) {
        window.location.href = appUrl;
        setTimeout(() => {
          window.open(webUrl, "_blank");
        }, 1500);
      } else {
        const desktopAppUrl = `whatsapp://send?phone=${phone}&text=${encodedMsg}`;
        const desktopWebUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`;

        const hiddenIframe = document.createElement("iframe");
        hiddenIframe.style.display = "none";
        hiddenIframe.src = desktopAppUrl;
        document.body.appendChild(hiddenIframe);

        setTimeout(() => {
          window.open(desktopWebUrl, "_blank");
          document.body.removeChild(hiddenIframe);
        }, 1500);
      }

      if (typeof window !== "undefined" && typeof window.closeCartDrawer === "function") {
        try {
          window.closeCartDrawer();
        } catch {
          void 0;
        }
      }

      setOrderPlaced(true);
      navigate("/thank-you", { replace: true });

      if (shouldUseBuyNow) {
        try {
          sessionStorage.removeItem("buyNowItem");
        } catch {
          void 0;
        }
      } else {
        dispatch(clear());
      }
    } catch (err) {
      console.error("Order placement failed:", err);
      alert("Something went wrong while placing your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-200 to-pink-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-pink-800 mb-6">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/90 border border-pink-300/60 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Delivery Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <input
                    name="name"
                    className={`border rounded-md px-3 py-2 w-full ${
                      errors.name ? "border-red-500 text-red-700" : "border-gray-300 text-pink-500"
                    }`}
                    placeholder="Full Name *"
                    value={customer.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div className="md:col-span-1">
                  <input
                    name="phone"
                    className={`border rounded-md px-3 py-2 w-full ${
                      errors.phone ? "border-red-500 text-red-700" : "border-gray-300 text-pink-500"
                    }`}
                    placeholder="Phone Number *"
                    value={customer.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <input
                    name="email"
                    className={`border rounded-md px-3 py-2 w-full ${
                      errors.email ? "border-red-500 text-red-700" : "border-gray-300 text-pink-500"
                    }`}
                    placeholder="Email Address *"
                    value={customer.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <textarea
                    name="address"
                    className={`border rounded-md px-3 py-2 w-full resize-none ${
                      errors.address ? "border-red-500 text-red-700" : "border-gray-300 text-pink-500"
                    }`}
                    placeholder="Delivery Address * (Minimum 10 characters)"
                    rows={3}
                    value={customer.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date *</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    className={`border rounded-md px-3 py-2 w-full ${
                      deliveryDateError
                        ? "border-red-500 text-red-700"
                        : "border-gray-300 text-pink-500"
                    }`}
                    value={deliveryDate}
                    min={getDefaultDeliveryDate()}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value);
                      setDeliveryDateError("");
                    }}
                  />
                  {deliveryDateError ? (
                    <p className="mt-1 text-sm text-red-600">{deliveryDateError}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Select a date at least 2 days from today for product preparation.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/90 border border-pink-300/60 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Items to Purchase</h2>
              <div className="space-y-3">
                {items.map((item, index) => {
                  const itemKey = getCheckoutItemKey(item, index);
                  const measurements =
                    itemMeasurements[itemKey] || normalizeItemMeasurements(item?.measurements);

                  return (
                    <div key={itemKey} className="border border-pink-100 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.images?.[0] || "/images/img-1.jpg"}
                          alt={item.title || item.name || "Product"}
                          className="w-16 h-16 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = "/images/img-1.jpg";
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.title || item.name || "Product"}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          {(item.selectedColor || item.selectedSize) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.selectedColor ? `Color: ${item.selectedColor}` : ""}
                              {item.selectedColor && item.selectedSize ? " | " : ""}
                              {item.selectedSize ? `Size: ${item.selectedSize}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="font-semibold text-gray-800">
                          ₹{(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Measurements (optional)</p>
                        <div className="grid gap-2 md:grid-cols-3">
                          {MEASUREMENT_FIELDS.map((field) => (
                            <div key={`${itemKey}-${field.key}`}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {field.label}
                              </label>
                              <input
                                type="text"
                                value={measurements[field.key] || ""}
                                onChange={(e) =>
                                  handleMeasurementChange(itemKey, field.key, e.target.value)
                                }
                                className="w-full border rounded px-2 py-1 text-sm"
                                placeholder={field.label}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/90 border border-pink-300/60 rounded-xl p-4">
              <h3 className="text-lg font-bold text-pink-800">Order Summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-pink-200 my-2"></div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                className={`mt-5 w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl transition ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Order...
                  </div>
                ) : (
                  "Place Order & Send to WhatsApp"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
