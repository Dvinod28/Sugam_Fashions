// Test data for invoice generation
export const testBillData = {
  billNumber: "OFF123456",
  customerName: "Test Customer",
  customerPhone: "+91-9876543210",
  products: [
    {
      id: "1",
      name: "Cotton Saree",
      price: 1200,
      quantity: 2
    },
    {
      id: "2", 
      name: "Silk Kurti",
      price: 800,
      quantity: 1
    },
    {
      id: "3",
      name: "Designer Dress",
      price: 2500,
      quantity: 1
    }
  ],
  subtotal: 5700,
  discount: 200,
  total: 5500,
  paymentMethod: "cash",
  createdAt: new Date()
};

// Function to test invoice generation
export const testInvoiceGeneration = () => {
  console.log('Testing invoice generation with sample data:', testBillData);
  
  // This would typically be called from the component
  // For now, just log the test data
  return testBillData;
};