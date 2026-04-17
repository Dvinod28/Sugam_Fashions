import React from 'react';

const InvoiceGenerator = ({ bill, onClose, onSendToCustomer }) => {

  if (!bill) return null;
  const products = Array.isArray(bill.products)
    ? bill.products   
    : Array.isArray(bill.items)
      ? bill.items
      : [];

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const dateObj = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
    if (Number.isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMoney = (value) => `\u20B9${Number(value || 0).toFixed(2)}`;

  const getMeasurementLines = (measurements = {}) => {
    return Object.entries(measurements || {})
      .map(([key, value]) => {
        if (value === undefined || value === null || String(value).trim() === '') return null;
        return `${MEASUREMENT_LABELS[key] || key}: ${value}`;
      })
      .filter(Boolean);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=1000,height=700');
    if (!printWindow) {
      alert('Please allow popups for this website to print the invoice.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${bill.billNumber || 'Invoice'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; padding: 1rem; font-family: Arial, sans-serif; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
            @page { margin: 1cm; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>

        <div id="invoice-content" className="p-8">
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-pink-600 mb-2">SUGAM Embroidrys</div>
            <div className="text-sm text-gray-600">
              Fashion Designing<br />
              Contact: +91-8880483456<br />
              Email: info@sugamfashion.com
            </div>
          </div>

          <div className="text-2xl font-bold text-center my-6">INVOICE</div>

          <div className="flex justify-between mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Bill To:</h3>
              <p className="mb-1"><strong>{bill.customerName || 'N/A'}</strong></p>
              <p className="text-sm text-gray-600">Phone: {bill.customerPhone || 'N/A'}</p>
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Invoice Details:</h3>
              <p className="mb-1">Invoice #: {bill.billNumber || 'N/A'}</p>
              <p className="mb-1">Date: {formatDate(bill.createdAt)}</p>
              <p className="mb-1">Delivery Date: {formatDate(bill.deliveryDate)}</p>
              <p className="text-sm text-gray-600">Payment: {(bill.paymentMethod || '').toUpperCase()}</p>
            </div>
          </div>

          {bill.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-gray-800">Description</h3>
              <p className="text-gray-700">{bill.description}</p>
            </div>
          )}

          <table className="w-full border-collapse border border-gray-300 mb-6 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Serial No</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Product</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Price</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Qty</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {

                const quantity = Number(product.quantity || 1);
                const price = Number(product.price || 0);
                return (
                  <tr key={`${product.id || product.title || 'product'}-${index}`} className="even:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">{product.title || product.name || 'Product'}</td>
                    
                    <td className="border border-gray-300 px-3 py-2">{formatMoney(price)}</td>
                    <td className="border border-gray-300 px-3 py-2">{quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">{formatMoney(price * quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="text-right mb-4 text-sm">
            <div className="flex justify-end items-center mb-1">
              <span className="w-40 text-right mr-4">Subtotal:</span>
              <span className="w-28 text-right font-medium">{formatMoney(bill.subtotal || 0)}</span>
            </div>
            <div className="flex justify-end items-center mb-1">
              <span className="w-40 text-right mr-4">Discount:</span>
              <span className="w-28 text-right font-medium">- {formatMoney(bill.discount || 0)}</span>
            </div>
            <div className="flex justify-end items-center mb-1">
              <span className="w-40 text-right mr-4">Additional Charges:</span>
              <span className="w-28 text-right font-medium">+ {formatMoney(bill.additionalCharge || 0)}</span>
            </div>
            <div className="flex justify-end items-center mb-1">
              <span className="w-40 text-right mr-4">Advance Payment:</span>
              <span className="w-28 text-right font-medium">- {formatMoney(bill.advancePayment || 0)}</span>
            </div>
            <div className="flex justify-end items-center mb-1">
              <span className="w-40 text-right mr-4">Balance Due:</span>
              <span className="w-28 text-right font-semibold">{formatMoney(bill.balanceDue || 0)}</span>
            </div>
            <div className="flex justify-end items-center pt-2 border-t-2 border-gray-800 mt-2">
              <span className="w-40 text-right mr-4 font-bold text-base">Total Amount:</span>
              <span className="w-28 text-right font-bold text-base">{formatMoney(bill.total || 0)}</span>
            </div>
          </div>

          <div className="text-center my-8">
            <div className="text-xl font-bold text-pink-600 mb-2">Thank you for shopping with Sugam Fashion!</div>
            <div> <h1 className='text-start'><span className="text-xl font-bold text-pink-600 mb-2">Note : </span>If dresses will be taken back within two months we will not be responsible for It and current failure we not responsible for delivery.</h1></div>
          </div>

          <div className="text-center text-xs text-gray-500 mt-8">
            This is a computer-generated invoice.<br />
            For any queries, please contact us at +91-8880483456
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 no-print">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
            Close
          </button>
          <button
            onClick={() => onSendToCustomer?.(bill)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Send to Customer
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700">
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
