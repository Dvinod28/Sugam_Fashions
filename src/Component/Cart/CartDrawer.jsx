import { useSelector, useDispatch } from "react-redux";
import { IoMdAdd, IoMdRemove, IoMdClose } from "react-icons/io";
import { add, remove, removeItem } from "../../Redux/Cart/CartSlice";
import { Link } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

function CartDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const productCart = useSelector((state) => state.cart);
  
  // Calculate subtotal and total items
  const { subtotal, totalItems } = productCart.reduce(
    (acc, item) => {
      const itemTotal = Number(item.price) * Number(item.quantity || 1);
      return {
        subtotal: acc.subtotal + itemTotal,
        totalItems: acc.totalItems + Number(item.quantity || 1),
      };
    },
    { subtotal: 0, totalItems: 0 }
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop - removed background */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-pink-600 text-white">
              <h2 className="text-lg font-medium flex items-center">
                <FaShoppingBag className="mr-2" /> 
                Your Cart ({totalItems})
              </h2>
              <button 
                onClick={onClose}
                className="rounded-md text-white hover:text-gray-200 focus:outline-none"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 px-4 py-6 overflow-auto">
              {productCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <img
                    src="/images/empty-cart.png"
                    alt="Empty Cart"
                    loading="lazy"
                    className="w-32 h-32 mb-4"
                  />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productCart.map((product, index) => (
                    <div 
                      key={index}
                      className="flex items-center border-b border-gray-200 pb-4"
                    >
                      <img
                            src={(product.images && product.images[0]) || "/images/img-1.jpg"}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded-md"
                            onError={(e) => { e.currentTarget.src = "/images/img-1.jpg"; }}
                          />
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {product.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          ₹{Number(product.price).toFixed(2)}
                        </p>
                        <div className="flex items-center mt-2">
                          <button
                            className="p-1 bg-pink-100 text-pink-700 rounded"
                            onClick={() => dispatch(remove(product))}
                          >
                            <IoMdRemove size={14} />
                          </button>
                          <span className="mx-2 text-sm font-medium">
                            {product.quantity || 1}
                          </span>
                          <button
                            className="p-1 bg-pink-600 text-white rounded"
                            onClick={() => dispatch(add(product))}
                          >
                            <IoMdAdd size={14} />
                          </button>
                          <button
                            className="ml-auto text-sm text-gray-500 hover:text-red-500"
                            onClick={() => dispatch(removeItem(product))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {productCart.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-4">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-3">
                  <p>Subtotal</p>
                  <p>₹{subtotal.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Shipping and taxes calculated at checkout.
                </p>
                <Link
                  to="/cart"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-pink-600 hover:bg-pink-700"
                  onClick={onClose}
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-pink-600 bg-white border-pink-600 hover:bg-pink-50 mt-2"
                  onClick={onClose}
                >
                  Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartDrawer;