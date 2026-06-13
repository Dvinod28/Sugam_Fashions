import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { updateProductionStatus } from '../../../firebase/production';
import { ROLES } from '../../../data/roles';
import DataTable from '../Shared/DataTable';
import DashboardLayout from '../Layout/DashboardLayout';
import { HiOutlineCube } from 'react-icons/hi';
import OrderDetailsModal from '../Shared/OrderDetailsModal';
import { getOrderById } from '../../../api/orders';
import { getReminderDateForRole, toDateSafe } from '../../../utils/productionDates';
import FirebaseFileManager from '../../Common/FirebaseFileManager';

const ProductionDashboard = ({ userRole }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  // Ensure department matches what is stored in Firestore
  const department = userRole === ROLES.THREAD_WORK
    ? ROLES.THREAD_WORK
    : ROLES.RD_DEPARTMENT;
  const reminderLabel =
    userRole === ROLES.THREAD_WORK ? 'Thread Work Date' : 'R&D Start Date';
  const formatDate = (value) => {
    const date = value instanceof Date ? value : toDateSafe(value);
    if (!date) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, 'production'),
      where('department', '==', department),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEntries(arr);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Failed to load production entries');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [department]);

  const filtered = useMemo(() => {
    let list = entries;
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter((e) => (e.status || '') === statusFilter);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => {
        const orderId = String(e.orderId || '').toLowerCase();
        const productId = String(e.productId || '').toLowerCase();
        const customerName = String(e.customerName || '').toLowerCase();
        const customerPhone = String(e.customerPhone || '').toLowerCase();
        return (
          orderId.includes(q) ||
          productId.includes(q) ||
          customerName.includes(q) ||
          customerPhone.includes(q)
        );
      });
    }
    return list;
  }, [entries, statusFilter, search]);

  const activeEntries = useMemo(() => {
    return filtered.filter((e) => e.status !== 'cancelled');
  }, [filtered]);

  const cancelledEntries = useMemo(() => {
    return entries.filter((e) => e.status === 'cancelled');
  }, [entries]);

  const formatEntry = (entry) => {
    const deliverySource =
      entry.customerDeliveryDate ||
      entry.deliveryDate ||
      entry.metadata?.customerDeliveryDate;
    const deliveryDateObj = toDateSafe(deliverySource);
    const reminderDate = getReminderDateForRole(deliveryDateObj, department);
    const formattedReminderDate = formatDate(reminderDate || deliveryDateObj);
    return {
      id: entry.id,
      orderId: entry.orderId || '—',
      productId: entry.productId || '—',
      customerName: entry.customerName || '—',
      customerPhone: entry.customerPhone || '—',
      status: entry.status || 'pending',
      createdAt: entry.createdAt || null,
      deliveryDate: formattedReminderDate,
      productionDeliveryDate: reminderDate || deliveryDateObj || null,
      reminderDate: reminderDate || null,
      actualDeliveryDate: deliveryDateObj ? formatDate(deliveryDateObj) : '—',
    };
  };

  const [activeRows, cancelledRows] = useMemo(() => {
    return [
      activeEntries.map(formatEntry),
      cancelledEntries.map(formatEntry),
    ];
  }, [activeEntries, cancelledEntries]);

  const handleOrderClick = async (orderId, rowMeta) => {
    if (!orderId || orderId === '—') return;
    setDetailsError('');
    setDetailsLoading(true);
    setDetailsOpen(true);
    try {
      const order = await getOrderById(orderId);
      if (!order) {
        setSelectedOrder({
          id: orderId,
          productionDeliveryDate: rowMeta?.productionDeliveryDate || rowMeta?.deliveryDate,
        });
        setDetailsError('Order not found.');
      } else {
        setSelectedOrder({
          raw: order,
          ...order,
          productionDeliveryDate: rowMeta?.productionDeliveryDate || rowMeta?.deliveryDate,
        });
      }
    } catch (err) {
      setDetailsError('Unable to load order details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (entryId, newStatus) => {
    try {
      await updateProductionStatus(entryId, newStatus);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, status: newStatus } : e)));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'orderId',
      title: 'Order ID',
      render: (val, row) =>
        val && val !== '—' ? (
          <button
            className="text-pink-600 font-semibold hover:underline"
            onClick={() => handleOrderClick(val, row)}
          >
            #{val}
          </button>
        ) : (
          '—'
        ),
    },
    { key: 'productId', title: 'Product ID' },
    { key: 'customerName', title: 'Customer' },
    { key: 'customerPhone', title: 'Phone' },
    { key: 'status', title: 'Status' },
    { key: 'deliveryDate', title: 'Delivery Date' },
    {
      key: 'createdAt',
      title: 'Created At',
      render: (val) => {
        try {
          if (!val) return '—';
          if (typeof val?.toDate === 'function') return val.toDate().toLocaleString();
          if (typeof val === 'number') return new Date(val).toLocaleString();
          if (val instanceof Date) return val.toLocaleString();
          if (val?.seconds) return new Date(val.seconds * 1000).toLocaleString();
        } catch {}
        return '—';
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => (
        <select
          value={row.status || 'pending'}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          className="p-2 border rounded"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
  ];

  const menu = [
    { key: 'production', label: 'Production', icon: HiOutlineCube },
  ];

  return (
    <>
      <DashboardLayout title={`${department.replace('_', ' ').toUpperCase()} Dashboard`} menu={menu} activeKey={'production'} onChange={() => {}}>
        <div className="mb-6">
          <FirebaseFileManager
            collectionName="cadFiles"
            section={department}
            storageFolder="cad-files"
            label="CAD File Management"
            helperText="Independent file library for SVG and DXE CAD software files."
            maxFiles={200}
            maxSizeMb={100}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 items-center">
          <input
            type="text"
            placeholder="Search by Order ID or Product ID"
            className="border border-gray-400 focus:outline-none px-3 py-2 rounded w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-400 focus:outline-none px-2 py-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div>
            <DataTable columns={columns} data={activeRows} />

            <h3 className="text-xl font-bold mt-8 mb-4">Cancelled Orders</h3>
            <DataTable columns={columns} data={cancelledRows} />
          </div>
        )}
      </DashboardLayout>
      <OrderDetailsModal
        open={detailsOpen}
        order={selectedOrder}
        loading={detailsLoading}
        error={detailsError}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedOrder(null);
          setDetailsError('');
        }}
      />
    </>
  );
};

export default ProductionDashboard;
