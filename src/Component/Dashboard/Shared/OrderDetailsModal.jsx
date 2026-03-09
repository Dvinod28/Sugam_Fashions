import { IoClose } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROLES } from "../../../data/roles";

const PRIVATE_VIEW_ROLES = new Set([ROLES.THREAD_WORK, ROLES.RD_DEPARTMENT]);

const MEASUREMENT_LABELS = {
  length: "Length",
  width: "Width",
  shoulder: "Shoulder",
  backNeck: "Back Neck",
  bagal: "Bagal",
  frontNeck: "Front Neck",
  chest: "Chest",
  handsLength: "Hands Length",
  handsRound: "Hands Round",
  bristLength: "Brist Length",
  shoulderPatti: "Shoulder Patti",
  size: "Size",
};

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/&/g, "");
}

function isPrivateViewRole(role) {
  const normalized = normalizeRole(role);
  if (PRIVATE_VIEW_ROLES.has(normalized)) return true;
  return normalized === "rddepartment";
}

function formatMeasurementLabel(key) {
  if (MEASUREMENT_LABELS[key]) return MEASUREMENT_LABELS[key];
  return String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getMeasurementEntries(item) {
  if (!item || typeof item !== "object") return [];
  const measurementSource =
    item.measurements && typeof item.measurements === "object"
      ? item.measurements
      : {};

  const entries = Object.entries(measurementSource)
    .filter(
      ([, value]) =>
        value !== undefined && value !== null && String(value).trim() !== ""
    )
    .map(([key, value]) => ({
      key,
      label: formatMeasurementLabel(key),
      value: String(value),
    }));

  const sizeValue = item.selectedSize || item.size;
  if (
    sizeValue !== undefined &&
    sizeValue !== null &&
    String(sizeValue).trim() !== ""
  ) {
    entries.push({
      key: "size",
      label: "Size",
      value: String(sizeValue),
    });
  }

  return entries;
}

function formatDateLike(value) {
  if (!value) return "—";
  try {
    const date =
      typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const date =
      typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDeliveryInfo(order) {
  if (!order) return "—";
  const overrideDate =
    order.productionDeliveryDate ||
    order.departmentDeliveryDate ||
    order.productionReminderDate ||
    order.reminderDate;
  if (overrideDate) {
    const formattedOverride = formatDateLike(overrideDate);
    if (formattedOverride !== "—") {
      return formattedOverride;
    }
    if (typeof overrideDate === "string") {
      return overrideDate;
    }
  }
  const dateValue =
    order.deliveryDate ||
    order.customer?.deliveryDate ||
    order.raw?.deliveryDate ||
    order.raw?.customer?.deliveryDate;
  const formattedDate = formatDateLike(dateValue);
  if (formattedDate !== "—") return formattedDate;
  const days = order.deliveryDays || order.raw?.deliveryDays;
  if (days) return `${days} days`;
  return "—";
}

export default function OrderDetailsModal({
  open,
  onClose,
  order,
  loading = false,
  error = "",
}) {
  const currentUser = useSelector((state) => state.user?.currentUser);
  if (!open) return null;

  const sourceOrder = order?.raw || order;
  const hidePrivateFields = isPrivateViewRole(currentUser?.role);
  const description =
    sourceOrder?.description || order?.raw?.description || order?.raw?.notes || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
            {sourceOrder?.id && (
              <p className="text-sm text-gray-500">Order : {sourceOrder.id}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-red-500 bg-pink-100 p-1 rounded hover:text-red-100 hover:bg-pink-500 cursor-pointer transition-colors duration-300"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-600">Loading order details...</div>
        ) : error ? (
          <div className="py-6 text-center text-red-600">{error}</div>
        ) : !sourceOrder ? (
          <div className="py-6 text-center text-gray-600">
            No details available for this order.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600">Customer</h4>
                <p className="text-lg font-semibold text-pink-600">
                  {sourceOrder.customer?.name || sourceOrder.customer || "—"}
                </p>
                {hidePrivateFields ? (
                  <p className="text-sm text-gray-500">
                    Contact details hidden for your role.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-700">
                      Email:{" "}
                      <span className="text-black">{sourceOrder.customer?.email || "—"}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Phone:{" "}
                      <span className="text-black">
                        {sourceOrder.customer?.phone || sourceOrder.phone || "—"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Address:{" "}
                      <span className="text-black">
                        {sourceOrder.customer?.address ||
                          sourceOrder.raw?.shippingAddress ||
                          "—"}
                      </span>
                    </p>
                  </>
                )}
                {sourceOrder.raw?.cancelReason && (
                  <p className="text-sm text-red-600 mt-2">
                    Cancel Reason: {sourceOrder.raw.cancelReason}
                  </p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">Order Info</h4>
                <p className="text-sm text-gray-700">
                  Placed: {formatDateTime(sourceOrder.createdAt || order?.raw?.createdAt)}
                </p>
                <p className="text-sm text-gray-700">
                  Status: <span className="font-semibold">{sourceOrder.status || "—"}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Subtotal:{" "}
                  <span className="font-semibold">
                    {hidePrivateFields
                      ? "Hidden"
                      : typeof sourceOrder.subtotal === "number"
                        ? `\u20B9${sourceOrder.subtotal.toFixed(2)}`
                        : sourceOrder.subtotal || "—"}
                  </span>
                </p>
                <p className="text-sm text-gray-700">
                  Delivery Date:{" "}
                  <span className="font-semibold">{formatDeliveryInfo(order)}</span>
                </p>
              </div>
            </div>

            {description ? (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-1">
                  Description / Notes
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
              </div>
            ) : null}

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Items</h4>
              <div className="space-y-3 max-h-72 overflow-auto pr-2">
                {Array.isArray(sourceOrder.items) && sourceOrder.items.length > 0 ? (
                  sourceOrder.items.map((it, idx) => {
                    const productId = it?.id || it?.productId;
                    const canNavigate = Boolean(productId);
                    const measurementEntries = getMeasurementEntries(it);
                    return (
                      <Link
                        key={`${productId || idx}-${idx}`}
                        to={canNavigate ? `/product/${productId}` : "#"}
                        target={canNavigate ? "_blank" : undefined}
                        rel={canNavigate ? "noopener noreferrer" : undefined}
                        className={`flex items-start gap-3 p-2 rounded border transition ${
                          canNavigate
                            ? "hover:bg-pink-50 cursor-pointer"
                            : "cursor-default"
                        }`}
                        onClick={(e) => {
                          if (!canNavigate) e.preventDefault();
                        }}
                      >
                        <img
                          src={it.images?.[0] || "/images/empty cart.png"}
                          alt={it.title || it.name || "Product"}
                          loading="lazy"
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/images/empty cart.png";
                            e.currentTarget.alt = "Product Image";
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{it.title || it.name || "Product"}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {it.quantity || it.qty || 1}
                          </p>
                          {measurementEntries.length > 0 && (
                            <div className="mt-1 text-xs text-gray-700">
                              <p className="font-medium text-gray-800">Measurements:</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                {measurementEntries.map((entry) => (
                                  <span key={`${entry.key}-${entry.value}`}>
                                    {entry.label}: {entry.value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {hidePrivateFields
                              ? "Hidden"
                              : `\u20B9${Number(it.price || it.unitPrice || 0).toFixed(2)}`}
                          </p>
                          {canNavigate && (
                            <span className="block text-xs text-pink-600">View details</span>
                          )}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No items</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
