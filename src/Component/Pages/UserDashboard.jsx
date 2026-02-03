import { Navigate } from "react-router-dom";
import { logout } from "../../api/auth";
import { useDispatch, useSelector } from "react-redux";
import { loadCart } from "../../Redux/Cart/CartSlice";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";

export default function UserDashboard() {
  const { currentUser, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  
  useEffect(() => {
    if (currentUser) {
      dispatch(loadCart());
    }
  }, [currentUser, dispatch]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Welcome, {currentUser?.displayName || currentUser?.email}</h1>
        <button onClick={logout} className="text-sm border px-3 py-1 rounded hover:bg-pink-50">Logout</button>
      </div>
      <div className="grid gap-3">
        <div className="border rounded p-3">Orders (coming soon)</div>
        <div className="border rounded p-3">Saved items (coming soon)</div>
        <div className="border rounded p-3">Profile (coming soon)</div>
        <div className="border rounded p-3">
          <div className="font-semibold mb-2">Your Cart</div>
          {Array.isArray(cart) && cart.length > 0 ? (
            <ul className="list-disc pl-5 text-sm">
              {cart.map((c) => (
                <li key={c.id}>{c.title} × {c.quantity} (₹{c.price})</li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">Cart is empty</div>
          )}
        </div>
      </div>
    </div>
  );
}


