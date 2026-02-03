import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import DataTable from '../Shared/DataTable';

const Accounts = () => {
  const [salaries, setSalaries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('salaries');
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Salary form state
  const [employeeName, setEmployeeName] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryMonth, setSalaryMonth] = useState('');
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Expense form state
  const [expenseType, setExpenseType] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('other');

  useEffect(() => {
    fetchSalaries();
    fetchExpenses();
  }, []);

  const fetchSalaries = async () => {
    try {
      const q = query(collection(db, 'salaries'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const salariesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSalaries(salariesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    if (!employeeName || !salaryAmount || !salaryMonth) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const salaryData = {
        employeeName,
        amount: Number(salaryAmount),
        month: salaryMonth,
        year: Number(salaryYear),
        paymentStatus,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'salaries'), salaryData);
      
      // Reset form
      setEmployeeName('');
      setSalaryAmount('');
      setSalaryMonth('');
      setPaymentStatus('pending');
      setShowSalaryForm(false);
      
      // Refresh data
      fetchSalaries();
      alert('Salary record created successfully!');
    } catch (error) {
      console.error('Error creating salary:', error);
      alert('Error creating salary record');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseType || !expenseAmount) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const expenseData = {
        type: expenseType,
        amount: Number(expenseAmount),
        description: expenseDescription,
        category: expenseCategory,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'expenses'), expenseData);
      
      // Reset form
      setExpenseType('');
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseCategory('other');
      setShowExpenseForm(false);
      
      // Refresh data
      fetchExpenses();
      alert('Expense record created successfully!');
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Error creating expense record');
    }
  };

  const updateSalaryPayment = async (salaryId, newStatus) => {
    try {
      await updateDoc(doc(db, 'salaries', salaryId), {
        paymentStatus: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : null
      });
      fetchSalaries();
      alert('Payment status updated!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const salaryColumns = [
    { key: 'employeeName', title: 'Employee Name' },
    { 
      key: 'amount', 
      title: 'Amount',
      render: (value) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { key: 'month', title: 'Month' },
    { key: 'year', title: 'Year' },
    {
      key: 'paymentStatus',
      title: 'Status',
      render: (value, row) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value?.toUpperCase()}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Created Date',
      render: (value) => value?.toDate?.().toLocaleDateString() || new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        row.paymentStatus === 'pending' && (
          <button
            onClick={() => updateSalaryPayment(row.id, 'paid')}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
          >
            Mark Paid
          </button>
        )
      )
    }
  ];

  const expenseColumns = [
    { key: 'type', title: 'Expense Type' },
    { 
      key: 'amount', 
      title: 'Amount',
      render: (value) => `₹${value?.toFixed(2) || '0.00'}`
    },
    { key: 'category', title: 'Category' },
    { key: 'description', title: 'Description' },
    {
      key: 'createdAt',
      title: 'Date',
      render: (value) => value?.toDate?.().toLocaleDateString() || new Date(value).toLocaleDateString()
    }
  ];

  const totalSalaries = salaries.reduce((sum, salary) => sum + salary.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingSalaries = salaries.filter(s => s.paymentStatus === 'pending').reduce((sum, salary) => sum + salary.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Accounts Management</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Salaries</h3>
          <p className="text-2xl font-bold text-blue-800">₹{totalSalaries.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-800">₹{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Pending Salaries</h3>
          <p className="text-2xl font-bold text-yellow-800">₹{pendingSalaries.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('salaries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'salaries'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Salaries
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expenses'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Other Expenses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'salaries' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Salary Records</h3>
            <button
              onClick={() => setShowSalaryForm(true)}
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Add Salary Record
            </button>
          </div>

          {showSalaryForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h4 className="text-lg font-semibold mb-4">Add Salary Record</h4>
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Name *</label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary Amount *</label>
                    <input
                      type="number"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Month *</label>
                    <select
                      value={salaryMonth}
                      onChange={(e) => setSalaryMonth(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input
                      type="number"
                      value={salaryYear}
                      onChange={(e) => setSalaryYear(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      min="2020"
                      max="2030"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSalaryForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <p>Loading salaries...</p>
          ) : (
            <DataTable columns={salaryColumns} data={salaries} />
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Other Expenses</h3>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Add Expense
            </button>
          </div>

          {showExpenseForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
              <h4 className="text-lg font-semibold mb-4">Add Expense</h4>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Expense Type *</label>
                    <input
                      type="text"
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., Electricity Bill, Rent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount *</label>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="utilities">Utilities</option>
                    <option value="rent">Rent</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="marketing">Marketing</option>
                    <option value="transport">Transport</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          )}

          <DataTable columns={expenseColumns} data={expenses} />
        </div>
      )}
    </div>
  );
};

export default Accounts;