import { Link } from "react-router-dom";

export default function ThankYou() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-pink-50 to-white px-4">
      <div className="max-w-xl w-full text-center bg-white/80 border border-pink-200 rounded-2xl p-8 shadow-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl md:text-3xl font-bold text-pink-700 mb-2">
          Thank you for your order!
        </h1>
        <p className="text-gray-600 mb-6">
          We've sent your order details to our team on WhatsApp. You'll receive
          a confirmation shortly.Thank you for shopping with us!
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2 rounded-md bg-pink-600 text-white font-semibold hover:bg-pink-700"
          >
            Continue Shopping
          </Link>
          <Link
            to="/user"
            className="px-5 py-2 rounded-md border border-pink-300 text-pink-700 font-semibold hover:bg-pink-50"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
