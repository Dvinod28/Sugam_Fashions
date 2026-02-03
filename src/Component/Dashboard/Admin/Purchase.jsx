import React, { useState, useMemo } from "react";
import { db } from "../../../firebase/config";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { HiPlus, HiPencil, HiTrash } from "react-icons/hi";

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [form, setForm] = useState({
    supplier: "",
    item: "",
    quantity: "",
    cost: "",
    paymentStatus: "pending",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useState(() => {
    const q = query(collection(db, "purchases"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPurchases(items);
      setFilteredPurchases(items);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    if (currentItem) {
      await updateDoc(doc(db, "purchases", currentItem.id), { ...form, date: new Date() });
    } else {
      await addDoc(collection(db, "purchases"), { ...form, date: new Date() });
    }
    closeModal();
  };

  const openModal = (item = null) => {
    setCurrentItem(item);
    setForm(item || { supplier: "", item: "", quantity: "", cost: "", paymentStatus: "pending" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this purchase record?")) {
      await deleteDoc(doc(db, "purchases", id));
    }
  };

  useMemo(() => {
    let filtered = purchases;
    if (searchTerm) {
      filtered = purchases.filter(p =>
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPurchases(filtered);
  }, [searchTerm, purchases]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Purchase Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-pink-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-pink-600 flex items-center"
        >
          <HiPlus className="mr-2" /> Add Purchase
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by supplier or item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPurchases.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(p.date.seconds * 1000).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.supplier}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.item}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{p.cost}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    p.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {p.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(p)} className="text-indigo-600 hover:text-indigo-900 mr-3"><HiPencil /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900"><HiTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{currentItem ? "Edit Purchase" : "Add Purchase"}</h2>
            <div className="space-y-4">
              <input type="text" name="supplier" value={form.supplier} onChange={handleInputChange} placeholder="Supplier" className="w-full p-2 border rounded" />
              <input type="text" name="item" value={form.item} onChange={handleInputChange} placeholder="Item" className="w-full p-2 border rounded" />
              <input type="number" name="quantity" value={form.quantity} onChange={handleInputChange} placeholder="Quantity" className="w-full p-2 border rounded" />
              <input type="number" name="cost" value={form.cost} onChange={handleInputChange} placeholder="Cost" className="w-full p-2 border rounded" />
              <select name="paymentStatus" value={form.paymentStatus} onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={closeModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Cancel</button>
              <button onClick={handleSave} className="bg-pink-500 text-white px-4 py-2 rounded-md">{currentItem ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;