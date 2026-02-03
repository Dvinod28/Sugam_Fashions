import React from "react";
import { FaHome } from "react-icons/fa";
import { useParams, Link } from "react-router-dom";

const LEGAL_CONTENT = {
  "privacy-policy": {
    title: "Privacy Policy",
    body: `We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights.

1. Information we collect: account information, order history, and communications.
2. How we use data: to process orders, improve services, and send transactional messages.
3. Your rights: access, correction, and deletion where applicable.

For questions about privacy, contact us at suraj.ar.sp@gmail.com.`,
  },
  "terms-&-conditions": {
    title: "Terms & Conditions",
    body: `These terms and conditions govern your use of the website and services. By using the site you agree to these terms.

1. Use of site: comply with applicable laws and do not misuse the services.
2. Orders: all orders are subject to acceptance and availability.
3. Liability: we are not liable for indirect or consequential losses.

If you have any questions about these terms, contact support.`,
  },
  "exchange-&-return-policy": {
    title: "Exchange & Return Policy",
    body: `We accept returns within 30 days of delivery for eligible products. Items must be unused and in original packaging.

1. Start a return by contacting support with your order number.
2. Refunds are issued to the original payment method once the return is received and inspected.
3. Some items (e.g., intimate apparel) may be non-returnable for hygiene reasons.

Contact us for help with exchanges or returns.`,
  },
  "payment-policy": {
    title: "Payment Policy",
    body: `We accept major credit cards and digital wallets. All payments are processed securely.

1. Prices are shown in the site's currency and include applicable taxes where required.
2. Orders may be cancelled if payment cannot be verified.

For payment issues, reach out to billing support.`,
  },
  "shipping-&-delivery-policy": {
    title: "Shipping & Delivery Policy",
    body: `We offer standard and expedited shipping options. Delivery times depend on your location and chosen shipping method.

1. Orders are typically processed within 1-2 business days.
2. Tracking information is provided when your order ships.
3. International shipping rates and times vary.

If you need help tracking an order, contact our support team.`,
  },
};

function toSlug(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-&]/g, "");
}

export default function LegalPage() {
  const { slug } = useParams();
  const key = slug || "privacy-policy";
  const content = LEGAL_CONTENT[key] || {
    title: "Not Found",
    body: "The requested policy was not found.",
  };

  return (
    <div className="min-h-screen bg-pink-50 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        <nav className="text-sm text-gray-500 mb-4 flex">
          <Link to="/" className="flex items-center hover:text-pink-600">
            <FaHome  className="me-1"/>Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{content.title}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-bold text-pink-700 mb-4">
          {content.title}
        </h1>
        <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
          {content.body}
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Other Policies</h3>
          <div className="flex flex-wrap gap-3">
            {Object.keys(LEGAL_CONTENT).map((k) => (
              <Link
                key={k}
                to={`/legal/${k}`}
                className={`px-3 py-1 rounded-full border text-sm ${
                  k === key
                    ? "bg-pink-600 text-white border-pink-600"
                    : "text-pink-600 border-pink-100 hover:bg-pink-50"
                }`}
              >
                {LEGAL_CONTENT[k].title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
