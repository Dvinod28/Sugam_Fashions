import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, doc, getDocs, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import DataTable from '../Shared/DataTable';
import { useDispatch, useSelector } from 'react-redux';
import { getProduct } from '../../../Redux/Product/ProductSlice';
import { addOne, fetchOrders } from '../../../Redux/Order/OrderSlice';
import InvoiceGenerator from './InvoiceGenerator';
import { createProductionEntry } from '../../../firebase/production';
import { ROLES } from '../../../data/roles';

const MEASUREMENT_FIELDS = [
  { key: 'length', label: 'Length' },
  { key: 'width', label: 'Width' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'backNeck', label: 'Back Neck' },
  { key: 'bagal', label: 'Bagal' },
  { key: 'frontNeck', label: 'Front Neck' },
  { key: 'chest', label: 'Chest' },
  { key: 'handsLength', label: 'Hands Length' },
  { key: 'handsRound', label: 'Hands Round' },
  { key: 'bristLength', label: 'Brist Length' },
  { key: 'shoulderPatti', label: 'Shoulder Patti' },
];

const createEmptyMeasurements = () =>
  MEASUREMENT_FIELDS.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});

const OfflineBilling = () => {
  const dispatch = useDispatch();
  const reduxProducts = useSelector((s) => s.product.data || []);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState(null);
  const [description, setDescription] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [billSearch, setBillSearch] = useState('');
  const [additionalCharge, setAdditionalCharge] = useState(0);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItems, setCustomItems] = useState([]);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [editingBillId, setEditingBillId] = useState(null);

  const isEditMode = Boolean(editingBillId);

  const resetBillForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setSelectedProducts([]);
    setDiscount(0);
    setPaymentMethod('cash');
    setDescription('');
    setDeliveryDate('');
    setAdditionalCharge(0);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItems([]);
    setAdvancePayment(0);
    setProductSearch('');
    setShowProductDropdown(false);
    setEditingBillId(null);
  };

  const normalizeDateForInput = (value) => {
    if (!value) return '';
    const dateValue = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(dateValue.getTime())) return '';
    return dateValue.toISOString().split('T')[0];
  };

  const normalizeProductForForm = (product) => ({
    ...product,
    price: Number(product?.price || 0),
    quantity: Number(product?.quantity || 1),
    measurements: {
      ...createEmptyMeasurements(),
      ...(product?.measurements || {}),
    },
  });

  const isCustomProduct = (product) => String(product?.id || '').startsWith('custom-');

  const handleCreateNewBill = () => {
    resetBillForm();
    setShowForm(true);
  };

  const handleEditBill = (bill) => {
    const billProducts = Array.isArray(bill?.products) ? bill.products : [];
    const customProducts = billProducts.filter(isCustomProduct);
    const standardProducts = billProducts.filter((item) => !isCustomProduct(item));

    setEditingBillId(bill.id);
    setCustomerName(String(bill.customerName || ''));
    setCustomerPhone(String(bill.customerPhone || ''));
    setPaymentMethod(bill.paymentMethod || 'cash');
    setDiscount(Number(bill.discount || 0));
    setDescription(bill.description || '');
    setDeliveryDate(normalizeDateForInput(bill.deliveryDate));
    setAdditionalCharge(Number(bill.additionalCharge || 0));
    setAdvancePayment(Number(bill.advancePayment || 0));
    setCustomItemName('');
    setCustomItemPrice('');
    setProductSearch('');
    setShowProductDropdown(false);

    setSelectedProducts(standardProducts.map(normalizeProductForForm));
    setCustomItems(
      customProducts.map((item, idx) => {
        const label = item.title || item.name || 'Custom Service';
        return {
          ...item,
          id: item.id || `custom-${Date.now()}-${idx}`,
          title: label,
          name: label,
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
        };
      })
    );

    setShowForm(true);
  };

  useEffect(() => {
    fetchBills();
    // Try to fetch products from Redux store first
    dispatch(getProduct());
    console.log('OfflineBilling component mounted, fetching products...');
  }, [dispatch]);

  // Sync Redux products to local state when they change
  useEffect(() => {
    if (reduxProducts.length > 0 && products.length === 0) {
      console.log('Syncing Redux products to local state:', reduxProducts);
      setProducts(reduxProducts);
    }
  }, [reduxProducts, products.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProductDropdown && !event.target.closest('.product-dropdown-container')) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProductDropdown]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'offlineBills'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const billsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBills(billsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Try to fetch with ordering first
      let q = query(collection(db, 'products'), orderBy('title'));
      let snapshot = await getDocs(q);
      
      // If no products or error, try without ordering
      if (snapshot.empty) {
        console.log('No products found with ordering, trying without order...');
        q = query(collection(db, 'products'));
        snapshot = await getDocs(q);
      }
      
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched products from Firestore:', productsData); // Debug log
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products from Firestore:', error);
      // Fallback: try without any ordering
      try {
        const q = query(collection(db, 'products'));
        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched products from Firestore (fallback):', productsData);
        setProducts(productsData);
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        // If Firestore fails, use Redux products as fallback
        console.log('Using Redux products as fallback:', reduxProducts);
        setProducts(reduxProducts);
      }
    }
  };

  const addProductToBill = (product) => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);
    if (existingProduct) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id 
          ? { ...p, quantity: p.quantity + 1, measurements: p.measurements || createEmptyMeasurements() }
          : p
      ));
    } else {
      setSelectedProducts([
        ...selectedProducts,
        { ...product, quantity: 1, measurements: createEmptyMeasurements() }
      ]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const removeProductFromBill = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProductFromBill(productId);
      return;
    }
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, quantity } : p
    ));
  };

  const updateProductMeasurement = (productId, measurementKey, value) => {
    setSelectedProducts(selectedProducts.map((product) =>
      product.id === productId
        ? {
            ...product,
            measurements: {
              ...createEmptyMeasurements(),
              ...(product.measurements || {}),
              [measurementKey]: value,
            },
          }
        : product
    ));
  };

  const subtotalAmount = useMemo(() => {
    const baseSubtotal = selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
    const customItemsTotal = customItems.reduce((total, item) => {
      return total + (Number(item.price) * Number(item.quantity || 1));
    }, 0);
    const draftCustomPrice = Number(customItemPrice) || 0;
    const customPrice =
      customItemsTotal + (selectedProducts.length === 0 ? draftCustomPrice : 0);
    return baseSubtotal + customPrice;
  }, [selectedProducts, customItems, customItemPrice]);

  const calculateTotal = () => {
    const extra = Number(additionalCharge) || 0;
    return subtotalAmount - Number(discount || 0) + extra;
  };

  const calculateBalanceDue = () => {
    const total = calculateTotal();
    const advance = Number(advancePayment) || 0;
    return Math.max(total - advance, 0);
  };

  const addCustomItemToBill = () => {
    const price = Number(customItemPrice);
    if (!(price > 0)) {
      alert('Please enter a valid custom amount.');
      return;
    }

    const label = customItemName?.trim() || 'Custom Service';
    setCustomItems([
      ...customItems,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: label,
        name: label,
        price,
        quantity: 1,
      },
    ]);
    setCustomItemName('');
    setCustomItemPrice('');
  };

  const removeCustomItemFromBill = (itemId) => {
    setCustomItems(customItems.filter((item) => item.id !== itemId));
  };

  const filteredProducts = products.filter(product => {
    if (!productSearch.trim()) return true; // Show all products when search is empty
    const searchTerm = productSearch.toLowerCase().trim();
    const title = (product.title || product.name || '').toLowerCase();
    const matches = title.includes(searchTerm);
    console.log(`Product: ${product.title || product.name}, Search: ${productSearch}, Matches: ${matches}`);
    return matches;
  });

  // Debug: Display current product state
  console.log('=== DEBUG INFO ===');
  console.log('Local products count:', products.length);
  console.log('Redux products count:', reduxProducts.length);
  console.log('Products array:', products);
  console.log('Redux products array:', reduxProducts);
  console.log('Show dropdown:', showProductDropdown);
  console.log('Product search:', productSearch);
  console.log('Filtered products count:', filteredProducts.length);

  const handleSubmitBill = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert(`Please enter the customer name before ${isEditMode ? 'updating' : 'creating'} a bill.`);
      return;
    }

    const preparedCustomItems = [...customItems];
    if (Number(customItemPrice) > 0) {
      const label = customItemName?.trim() || 'Custom Service';
      preparedCustomItems.push({
        id: `custom-${Date.now()}`,
        title: label,
        name: label,
        price: Number(customItemPrice) || 0,
        quantity: 1,
      });
    }

    if (selectedProducts.length === 0 && preparedCustomItems.length === 0) {
      alert(`Please add a product or enter a custom amount before ${isEditMode ? 'updating' : 'creating'} a bill.`);
      return;
    }

    try {
      const normalizedProducts = [...selectedProducts, ...preparedCustomItems];
      const subtotalAmountForBill = normalizedProducts.reduce(
        (total, p) => total + (p.price * p.quantity),
        0
      );
      const totalForBill =
        subtotalAmountForBill - Number(discount || 0) + (Number(additionalCharge) || 0);
      const advancePaymentValue = Number(advancePayment) || 0;
      const commonBillData = {
        customerName: String(customerName || '').trim(),
        customerPhone: String(customerPhone || '').trim(),
        products: normalizedProducts,
        subtotal: subtotalAmountForBill,
        discount: Number(discount || 0),
        additionalCharge: Number(additionalCharge) || 0,
        total: totalForBill,
        advancePayment: advancePaymentValue,
        balanceDue: Math.max(totalForBill - advancePaymentValue, 0),
        paymentMethod,
        description,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        updatedAt: new Date(),
      };

      let createdBill = null;

      if (isEditMode) {
        const billRef = doc(db, 'offlineBills', editingBillId);
        await updateDoc(billRef, commonBillData);
      } else {
        const billData = {
          ...commonBillData,
          createdAt: new Date(),
          billNumber: `OFF${Date.now().toString().slice(-6)}`
        };
        const offlineBillRef = await addDoc(collection(db, 'offlineBills'), billData);
        createdBill = { ...billData, id: offlineBillRef.id };
        await syncOfflineBillToOrders(createdBill);
      }

      resetBillForm();
      setShowForm(false);
      await fetchBills();
      await dispatch(fetchOrders());

      if (isEditMode) {
        alert('Bill updated successfully!');
      } else {
        alert('Bill created successfully!');
        const generateInvoiceNow = window.confirm('Bill created successfully! Would you like to generate an invoice for this bill?');
        if (generateInvoiceNow && createdBill) {
          setSelectedBillForInvoice(createdBill);
          setShowInvoiceModal(true);
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} bill:`, error);
      alert(`Error ${isEditMode ? 'updating' : 'creating'} bill`);
    }
  };

  const handleGenerateInvoice = (bill) => {
    setSelectedBillForInvoice(bill);
    setShowInvoiceModal(true);
  };

  const normalizePhone = (raw) => {
    if (!raw) return '';
    let digits = String(raw).replace(/[^0-9]/g, '');
    digits = digits.replace(/^0+/, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.startsWith('91') && digits.length === 12) return digits;
    return digits;
  };

  const handleSendInvoiceToCustomer = (bill) => {
    const phone = normalizePhone(bill?.customerPhone || '');
    if (!phone || phone.length < 10) {
      alert('Customer phone is missing or invalid. Please update it before sending.');
      return;
    }

    const deliveryDateValue = bill?.deliveryDate?.toDate
      ? bill.deliveryDate.toDate()
      : bill?.deliveryDate
        ? new Date(bill.deliveryDate)
        : null;
    const deliveryDateText =
      deliveryDateValue && !Number.isNaN(deliveryDateValue.getTime())
        ? deliveryDateValue.toLocaleDateString('en-IN')
        : 'N/A';
    const items = Array.isArray(bill?.products) ? bill.products : [];
    const itemLines = items.length
      ? items
          .map((item, idx) => `${idx + 1}. ${item.title || item.name || 'Product'} x${Number(item.quantity || 1)}`)
          .join('\n')
      : 'No items listed';

    const message = [
      `Hello ${bill?.customerName || 'Customer'},`,
      '',
      `Your invoice ${bill?.billNumber || ''} is ready.`,
      `Delivery Date: ${deliveryDateText}`,
      `Total: Rs ${Number(bill?.total || 0).toFixed(2)}`,
      `Balance Due: Rs ${Number(bill?.balanceDue || 0).toFixed(2)}`,
      '',
      'Items:',
      itemLines,
      '',
      'Thank you for choosing Sugam Fashion.',
    ].join('\n');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, '_blank');
    if (!opened) {
      window.location.href = url;
    }
  };

  const syncOfflineBillToOrders = async (billData) => {
    try {
      const ordersRef = collection(db, 'orders');
      const deliveryDateValue = billData.deliveryDate?.toDate
        ? billData.deliveryDate.toDate()
        : billData.deliveryDate || null;
      const now = new Date();
      const orderPayload = {
        customer: {
          name: billData.customerName,
          phone: billData.customerPhone || '',
          deliveryDate: deliveryDateValue ? deliveryDateValue.toISOString() : '',
        },
        items: billData.products?.map((product) => ({
          id: product.id,
          title: product.title || product.name || 'Product',
          price: Number(product.price),
          quantity: Number(product.quantity || 1),
          images: product.images || [],
          measurements: product.measurements || {},
        })) || [],
        subtotal: Number(billData.subtotal || 0),
        total: Number(billData.total || 0),
        discount: Number(billData.discount || 0),
        additionalCharge: Number(billData.additionalCharge || 0),
        advancePayment: Number(billData.advancePayment || 0),
        balanceDue: Number(billData.balanceDue || 0),
        status: 'pending',
        deliveryDate: deliveryDateValue || null,
        createdAt: serverTimestamp(),
        offlineBillId: billData.id,
        isOffline: true,
        billNumber: billData.billNumber,
        paymentMethod: billData.paymentMethod,
        description: billData.description || '',
      };

      const orderDocRef = await addDoc(ordersRef, orderPayload);

      const normalizedOrder = {
        id: orderDocRef.id,
        ...orderPayload,
        createdAt: now.toISOString(),
        deliveryDate: deliveryDateValue ? deliveryDateValue.toISOString() : null,
        subtotal: Number(orderPayload.subtotal || 0),
        total: Number(orderPayload.total || 0),
        additionalCharge: Number(orderPayload.additionalCharge || 0),
        advancePayment: Number(orderPayload.advancePayment || 0),
        balanceDue: Number(orderPayload.balanceDue || 0),
      };
      dispatch(addOne(normalizedOrder));

      const productionMetadata = {
        customerName: billData.customerName,
        customerPhone: billData.customerPhone || '',
        customerDeliveryDate: deliveryDateValue ? deliveryDateValue.toISOString() : null,
        bookingDate: now.toISOString(),
        isOffline: true,
        paymentMethod: billData.paymentMethod,
        billNumber: billData.billNumber,
      };

      if (Array.isArray(orderPayload.items)) {
        for (const product of orderPayload.items) {
          const productId = product.id || product.title || 'product';
          await createProductionEntry(orderDocRef.id, productId, ROLES.THREAD_WORK, productionMetadata);
          await createProductionEntry(orderDocRef.id, productId, ROLES.RD_DEPARTMENT, productionMetadata);
        }
      }
    } catch (error) {
      console.error('Failed to sync offline bill to orders/production:', error);
    }
  };

  const columns = [
    { key: 'billNumber', title: 'Bill #' },
    { key: 'customerName', title: 'Customer Name' },
    { key: 'customerPhone', title: 'Phone' },
    { 
      key: 'total', 
      title: 'Total',
      render: (value) => `\u20B9${Number(value || 0).toFixed(2)}`
    },
    { key: 'paymentMethod', title: 'Payment' },
    {
      key: 'deliveryDate',
      title: 'Delivery',
      render: (value) => value ? (value?.toDate?.().toLocaleDateString?.() || new Date(value).toLocaleDateString()) : 'N/A'
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (value) => value?.toDate?.().toLocaleDateString() || new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditBill(row)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => handleGenerateInvoice(row)}
            className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700"
          >
            Generate Invoice
          </button>
        </div>
      )
    }
  ];

  const filteredBills = useMemo(() => {
    if (!billSearch.trim()) return bills;
    const term = billSearch.toLowerCase();
    return bills.filter((bill) => {
      return (
        bill.customerName?.toLowerCase().includes(term) ||
        bill.customerPhone?.toLowerCase().includes(term) ||
        bill.billNumber?.toLowerCase().includes(term)
      );
    });
  }, [bills, billSearch]);

  return (
    <div className="space-y-6">
      {console.log('Component render - products:', products.length, 'reduxProducts:', reduxProducts.length, 'showProductDropdown:', showProductDropdown, 'productSearch:', productSearch)}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Offline Billing</h2>
        <button
          onClick={handleCreateNewBill}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
        >
          Create New Bill
        </button>
      </div>
     
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">{isEditMode ? 'Edit Bill' : 'Create New Bill'}</h3>
          <form onSubmit={handleSubmitBill} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full border rounded px-3 py-2 ${!customerName.trim() && 'border-red-300'}`}
                  placeholder="Enter customer name"
                  required
                />
                {!customerName.trim() && (
                  <p className="text-red-500 text-xs mt-1">Customer name is required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter bill description (optional)"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional – shown on the invoice for customer reference.
              </p>
            </div>

            <div className="product-dropdown-container">
              <label className="block text-sm font-medium mb-2">
                Select Products <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  console.log('Manual refresh clicked');
                  fetchProducts();
                }}
                className="text-xs bg-gray-200 px-2 py-1 rounded mb-2 hover:bg-gray-300"
              >
                Refresh Products
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('Using Redux products as fallback:', reduxProducts);
                  setProducts(reduxProducts);
                }}
                className="text-xs bg-blue-200 px-2 py-1 rounded mb-2 hover:bg-blue-300 ml-2"
              >
                Use Store Products ({reduxProducts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  // Test with sample products
                  const testProducts = [
                    { id: 'test1', title: 'Test Product 1', price: 100 },
                    { id: 'test2', title: 'Test Product 2', price: 200 },
                    { id: 'test3', title: 'Test Product 3', price: 300 }
                  ];
                  console.log('Loading test products:', testProducts);
                  setProducts(testProducts);
                }}
                className="text-xs bg-green-200 px-2 py-1 rounded mb-2 hover:bg-green-300 ml-2"
              >
                Load Test Products
              </button>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="Search products..."
                  className="w-full border rounded px-3 py-2"
                />
                {showProductDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-y-auto z-10">
                    {console.log('Dropdown shown - filteredProducts:', filteredProducts, 'productSearch:', productSearch)}
                    
                    {/* Show all products button when search is empty */}
                    {!productSearch && products.length > 0 && (
                      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => {
                            // Keep dropdown open and show all products
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Showing all {products.length} products
                        </button>
                      </div>
                    )}
                    
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addProductToBill(product)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          {product.images && (
                            <img 
                              src={
                                typeof product.images === 'string' ? product.images :
                                Array.isArray(product.images) ? product.images[0] :
                                product.images.url ||
                                (product.images[0] || '/images/img-1.jpg')
                              }
                              alt={product.title || product.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => { e.target.src = '/images/img-1.jpg'; }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{product.title || product.name}</div>
                            <div className="text-sm text-gray-600">₹{product.price}</div>
                          </div>
                        </button>
                      ))
                    ) : productSearch ? (
                      <div className="p-3 text-gray-500">
                        No products found matching "{productSearch}"
                      </div>
                    ) : (
                      <div className="p-3 text-gray-500">
                        Start typing to search products...
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowProductDropdown(!showProductDropdown)}
                className="text-sm text-pink-600 hover:text-pink-700 mb-2"
              >
                {showProductDropdown ? 'Hide' : 'Show'} All Products ({products.length})
              </button>
              {showProductDropdown && !productSearch && (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {products.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProductToBill(product)}
                      className="text-left px-2 py-1 hover:bg-gray-50 rounded text-sm flex items-center gap-2"
                    >
                      {product.images && (
                        <img 
                          src={typeof product.images === 'string' ? product.images : 
                               Array.isArray(product.images) ? product.images[0] : 
                               product.images.url || '/images/img-1.jpg'}
                          alt={product.title || product.name}
                          className="w-8 h-8 object-cover rounded border flex-shrink-0"
                          onError={(e) => { e.target.src = '/images/img-1.jpg'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{product.title || product.name}</div>
                        <div className="text-xs text-gray-600">₹{product.price}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedProducts.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Selected Products ({selectedProducts.length})</h4>
                <div className="space-y-2">
                  {selectedProducts.map(product => (
                    <div key={product.id} className="border rounded p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {product.images && (
                            <img
                              src={typeof product.images === 'string' ? product.images :
                                Array.isArray(product.images) ? product.images[0] :
                                product.images.url || '/images/img-1.jpg'}
                             alt={product.title || product.name || 'Product'}
                                className="w-10 h-10 object-cover rounded border"
                                onError={(e) => { e.target.src = '/images/img-1.jpg'; }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{product.title || product.name || 'Product'}</div>
                            <div className="text-sm text-gray-600">{'\u20B9'}{product.price} each</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                            className="bg-gray-200 px-2 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="px-2">{product.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                            className="bg-gray-200 px-2 py-1 rounded"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProductFromBill(product.id)}
                            className="text-red-500 px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {MEASUREMENT_FIELDS.map((field) => (
                          <div key={`${product.id}-${field.key}`}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {field.label}
                            </label>
                            <input
                              type="text"
                              value={product.measurements?.[field.key] || ''}
                              onChange={(e) => updateProductMeasurement(product.id, field.key, e.target.value)}
                              className="w-full border rounded px-2 py-1 text-sm"
                              placeholder={field.label}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="py-4 border-2 border-dashed border-gray-300 rounded-lg px-4">
                <div className="text-center">
                  <p className="text-gray-500">
                    {selectedProducts.length === 0
                      ? 'No products selected. You can still create a custom service bill, or add products using the search above.'
                      : 'Add custom service items to include extra work with selected products.'}
                  </p>
                  {selectedProducts.length === 0 && productSearch && (
                    <p className="text-sm text-gray-400 mt-1">Try searching for "saree", "kurti", or "dress"</p>
                  )}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 text-left">
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Item Name</label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g. Alteration, Stitching Service"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Amount (₹)</label>
                    <input
                      type="number"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Add multiple custom items one by one to build the bill.
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={addCustomItemToBill}
                    className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-900 text-sm"
                  >
                    Add Custom Item
                  </button>
                </div>

                {customItems.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h5 className="font-medium text-sm">Added Custom Items ({customItems.length})</h5>
                    {customItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border rounded p-2 bg-white">
                        <div>
                          <div className="font-medium text-sm">{item.title || item.name}</div>
                          <div className="text-xs text-gray-600">₹{Number(item.price || 0).toFixed(2)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomItemFromBill(item.id)}
                          className="text-red-500 text-sm px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount (₹)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Charges (₹)
                </label>
                <input
                  type="number"
                  value={additionalCharge}
                  onChange={(e) => setAdditionalCharge(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use for custom embroidery, express delivery, etc.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Advance Payment (₹)
                </label>
                <input
                  type="number"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount received now. Balance is shown below.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span>- ₹{Number(discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Additional Charges</span>
                  <span>+ ₹{Number(additionalCharge || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Advance Payment</span>
                  <span>- ₹{Number(advancePayment || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t pt-2">
                  <span>Balance Due</span>
                  <span>₹{calculateBalanceDue().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-medium">Total: ₹{calculateTotal().toFixed(2)}</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetBillForm();
                        setShowForm(false);
                      }}
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                    >
                      {isEditMode ? 'Update Bill' : 'Create Bill'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold">Recent Bills</h3>
          <input
            type="text"
            value={billSearch}
            onChange={(e) => setBillSearch(e.target.value)}
            placeholder="Search by customer, phone or bill #"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-80"
          />
        </div>
        {loading ? (
          <p>Loading bills...</p>
        ) : (
          <DataTable columns={columns} data={filteredBills} />
        )}
      </div>

      {/* Invoice Generator Modal */}
      {showInvoiceModal && (
        <InvoiceGenerator
          bill={selectedBillForInvoice}
          onSendToCustomer={handleSendInvoiceToCustomer}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedBillForInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default OfflineBilling;


