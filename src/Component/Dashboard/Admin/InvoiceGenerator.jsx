import React, { useState } from 'react';

const InvoiceGenerator = ({ bill, onClose }) => {
  const [invoiceMessage, setInvoiceMessage] = useState('');
  if (!bill) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content').cloneNode(true);
    const messageElement = printContent.querySelector('#invoice-message');
    if (messageElement) {
      messageElement.textContent = invoiceMessage;
    }

    try {
      const printWindow = window.open('', '', 'width=800,height=600');
      
      if (!printWindow) {
        alert('Please allow popups for this website to print the invoice.');
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${bill.billNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
                .print\:p-4 { padding: 1rem; }
                .print\:hidden { display: none; }
              }
              body { margin: 0; padding: 2rem; }
              @page { margin: 1cm; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for the content to load before printing
      setTimeout(() => {
        try {
          printWindow.print();
          // Don't close the window immediately - let user handle it
          // printWindow.close();
        } catch (error) {
          console.error('Print error:', error);
          alert('There was an error printing the invoice. Please try again or use your browser\'s print function.');
        }
      }, 500); // Increased timeout to 500ms
    } catch (error) {
      console.error('Error creating print window:', error);
      alert('There was an error opening the print dialog. Please check your popup settings.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateItemTotal = (product) => {
    return (product.price * product.quantity).toFixed(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl no-print"
          >
            ×
          </button>
        </div>
        
        <div id="invoice-content" className="p-8 print:p-4">
          {/* Invoice Header */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold text-pink-600 mb-2">SUGAM Embroidrys</div>
            <div className="text-sm text-gray-600">
              Fashion Designing<br/>
              Contact: +91-8880483456<br/>
              Contact: +91-8088065400<br/>
              Email: info@sugamfashion.com
            </div>
          </div>

          <div className="text-2xl font-bold text-center my-6">INVOICE</div>

          {/* Bill Information */}
          <div className="flex justify-between mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Bill To:</h3>
              <p className="mb-1"><strong>{bill.customerName}</strong></p>
              <p className="text-sm text-gray-600">Phone: {bill.customerPhone || 'N/A'}</p>
            </div>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Invoice Details:</h3>
              <p className="mb-1">Invoice #: {bill.billNumber}</p>
              <p className="mb-1">Date: {formatDate(bill.createdAt)}</p>
              <p className="mb-1">Delivery Date: {formatDate(bill.deliveryDate)}</p>
              <p className="text-sm text-gray-600">Payment Method: {bill.paymentMethod?.toUpperCase()}</p>
            </div>
          </div>

          {/* Description Section */}
          {bill.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-gray-800">Description:</h3>
              <p className="text-gray-700">{bill.description}</p>
            </div>
          )}

          {/* Products Table */}
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">#</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Product</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Price (₹)</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Quantity</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-bold">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bill.products?.map((product, index) => (
                <tr key={product.id} className="even:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">{product.name || product.title || 'Product'}</td>
                  <td className="border border-gray-300 px-4 py-3">₹{Number(product.price).toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-3">{product.quantity}</td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">₹{calculateItemTotal(product)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Section */}
          <div className="text-right mb-4">
            <div className="flex justify-end items-center mb-2">
              <span className="w-32 text-right mr-4">Subtotal:</span>
              <span className="w-24 text-right font-medium">
                ₹{Number(bill.subtotal || 0).toFixed(2)}
              </span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-end items-center mb-2">
                <span className="w-32 text-right mr-4">Discount:</span>
                <span className="w-24 text-right font-medium text-red-600">
                  -₹{Number(bill.discount).toFixed(2)}
                </span>
              </div>
            )}
            {bill.additionalCharge > 0 && (
              <div className="flex justify-end items-center mb-2">
                <span className="w-32 text-right mr-4">Additional Charges:</span>
                <span className="w-24 text-right font-medium text-green-600">
                  +₹{Number(bill.additionalCharge).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-end items-center pt-2 border-t-2 border-gray-800">
              <span className="w-32 text-right mr-4 font-bold text-lg">
                Total Amount:
              </span>
              <span className="w-24 text-right font-bold text-lg">
                ₹{Number(bill.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-6 mb-6">
          <h3 className="text-lg font-bold mb-2 text-gray-800\">Message:</h3>
          <p id="invoice-message" className="text-gray-600">{invoiceMessage}</p>
        </div>
          <div className="mb-6\">
            <strong>Payment Method:</strong> <span className="font-medium text-pink-600\">{bill.paymentMethod?.toUpperCase()}</span>
          </div>

          <div className="text-center my-8">
            <div className="text-xl font-bold text-pink-600 mb-2">Thank you for shopping with Sugam Fashion!</div>
          </div>

          <div className="text-center text-xs text-gray-500 mt-8">
            This is a computer-generated invoice.<br/>
            For any queries, please contact us at +91-8880483456
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
          >
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;