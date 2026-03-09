import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where, getDocs, doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import DataTable from "../Shared/DataTable";
import { ROLES } from "../../../data/roles";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getApp, initializeApp, getApps, deleteApp } from "firebase/app";

function AddUserForm({ onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(ROLES.THREAD_WORK);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    let secondaryApp;
    try {
      // First check if email already exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setError("This email is already registered in the system. Please use a different email.");
        setLoading(false);
        return;
      }

      // Use a secondary Firebase app to avoid replacing the current admin session
      const primaryApp = getApp();
      const existingSecondary = getApps().find((a) => a.name === "Secondary");
      secondaryApp = existingSecondary || initializeApp(primaryApp.options, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);
      
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        email,
        role,
        createdAt: serverTimestamp(),
      });
      
      // Reset form and close
      setName("");
      setEmail("");
      setPassword("");
      setRole(ROLES.THREAD_WORK);
      onAdd();
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered in Firebase. Please use a different email.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters long.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Failed to create user: ${error.message}`);
      }
    } finally {
      // Clean up secondary app so it doesn't interfere
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (_) {}
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded">
      <h3 className="text-xl font-bold mb-2">Add New User</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
          disabled={loading}
          autoComplete="name"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
          disabled={loading}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
          disabled={loading}
          autoComplete="new-password"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 rounded"
          disabled={loading}
        >
          <option value={ROLES.THREAD_WORK}>Thread work Hand work</option>
          <option value={ROLES.RD_DEPARTMENT}>R & D department</option>
          <option value={ROLES.STORE_MANAGER}>Store Manager (Offline Billing)</option>
          <option value={ROLES.PRODUCT_MANAGER}>Product Manager</option>
        </select>
      </div>
      <button 
        type="submit" 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Creating User..." : "Add User"}
      </button>
    </form>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleUserAdded = () => {
    setShowAddForm(false);
    setSuccessMessage("User created successfully!");
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId,));
        setSuccessMessage("User deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        setError("Error deleting user: " + error.message);
      }
    }
  };

  const columns = [
    { key: "displayName", title: "Name" },
    { key: "email", title: "Email" },
    { key: "role", title: "Role" },
    {
      key: "createdAt",
      title: "Created At",
      render: (value) => {
        try {
          if (!value) return "";
          // value may be ISO string, number (ms), or Firestore Timestamp
          if (typeof value === "string") return new Date(value).toLocaleString();
          if (typeof value === "number") return new Date(value).toLocaleString();
          if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
          return new Date(value).toLocaleString();
        } catch (_) {
          return "";
        }
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (value, row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          {showAddForm ? "Cancel" : "Add User"}
        </button>
      </div>
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      {showAddForm && <AddUserForm onAdd={handleUserAdded} />}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <DataTable columns={columns} data={users} />
      )}
    </div>
  );
}