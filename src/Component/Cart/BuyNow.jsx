import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function BuyNow({ product, onClose }) {
  const navigate = useNavigate();

  const handleBuyNow = () => {
    // Store the single product data for checkout
    sessionStorage.setItem('buyNowItem', JSON.stringify({
      items: [{
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: product.quantity || 1,
        images: product.images,
        description: product.description
      }],
      isBuyNow: true
    }));
    navigate('/checkout', { state: { fromBuyNow: true } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Purchase</h3>
        <div className="flex items-start gap-4 mb-4">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-semibold text-gray-800">{product.title}</h4>
            <p className="text-gray-600 text-sm mt-1">Quantity: {product.quantity || 1}</p>
            <p className="text-pink-600 font-bold mt-1">
              ₹{(Number(product.price) * Number(product.quantity || 1)).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleBuyNow}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-full shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
          >
            Proceed to Checkout
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-full transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BuyNow;
