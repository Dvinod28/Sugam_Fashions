import { useState } from "react";
import { login, loginWithGoogle } from "../../api/auth";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login({ email, password });
      navigate("/admin");
    } catch (e) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate("/admin");
    } catch (e) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
      {error && <p className="text-red-600 mb-2 text-sm">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading} className="w-full bg-pink-500 text-white py-2 rounded hover:bg-pink-600 disabled:opacity-50 hover:cursor-pointer">{loading ? "Loading..." : "Login"}</button>
      </form>
      <button onClick={onGoogle} disabled={loading} className="w-full mt-3 bg-white border text-black py-2 rounded hover:bg-pink-50 disabled:opacity-50 hover:cursor-pointer">Continue with Google</button>
    </div>
  );
}


