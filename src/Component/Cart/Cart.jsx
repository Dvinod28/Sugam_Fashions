import { useSelector, useDispatch } from "react-redux";
import { MdOutlineDoneOutline } from "react-icons/md";
import { IoMdAdd, IoMdRemove, IoMdRemoveCircleOutline } from "react-icons/io";
import { add, remove, removeItem } from "../../Redux/Cart/CartSlice";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCartShopping } from "react-icons/fa6";
import { TiCancel } from "react-icons/ti";
import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";
import BuyNow from "./BuyNow";
function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productCart = useSelector((state) => state.cart);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { subtotal, totalItems } = useMemo(() => {
    const subtotalCalc = productCart.reduce(
      (acc, item) => acc + Number(item.price) * Number(item.quantity || 1),
      0
    );
    const items = productCart.reduce(
      (acc, item) => acc + Number(item.quantity || 1),
      0
    );
    return { subtotal: subtotalCalc, totalItems: items };
  }, [productCart]);

  return (
    <>
      {productCart.length === 0 ? (
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 md:py-16 bg-gradient-to-b from-pink-50 via-pink-100 to-pink-50 px-4">
          <div className="max-w-lg w-full text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-pink-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <img
                src="images/empty cart.png"
                alt="Empty Cart"
                loading="lazy"
                className="w-56 md:w-64 mx-auto relative transform hover:scale-105 transition-all duration-300"
              />
            </div>
            <div className="space-y-6">
              <p className="text-lg md:text-xl text-pink-700/80 mx-auto font-medium">
                Looks like you haven't added anything to your cart yet.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <FaHome className="text-lg md:text-xl" />
                  <span className="text-base md:text-lg font-medium">Home</span>
                </Link>
                <Link
                  to="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <FaCartShopping className="text-lg md:text-xl" />
                  <span className="text-base md:text-lg font-medium">
                    Start Shopping
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-pink-100 via-pink-200 to-pink-100 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <h2 className="text-2xl md:text-4xl font-bold text-pink-800 mb-8 text-center md:text-left">
              Your Cart
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {productCart.map((product, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-center md:items-start gap-4 border border-pink-300/60 bg-white/80 backdrop-blur rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4"
                  >
                    <div className="relative group w-full md:w-auto">
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-48 md:w-36 md:h-36 object-cover rounded-lg bg-pink-50 transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
                    </div>
                    <div className="flex-1 w-full my-auto">
                      <div className="flex flex-col md:flex-row justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-lg md:text-xl font-semibold text-gray-800 line-clamp-1 hover:text-pink-600 transition-colors duration-200">
                            {product.title}
                          </h3>
                          <p className="text-sm md:text-base text-gray-500 line-clamp-2 mt-1">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end justify-between gap-2">
                          <span className="inline md:hidden text-lg md:text-xl font-bold text-pink-700 ">
                            ₹
                            {(
                              Number(product.price) *
                              Number(product.quantity || 1)
                            ).toFixed(2)}
                          </span>
                          <div className="flex items-center gap-3 bg-pink-50/50 rounded-full p-1 order-2 md:order-none">
                            <button
                              className="p-1.5 bg-pink-600 text-white text-lg font-bold rounded-full hover:bg-pink-700 active:scale-95 transition-all duration-200 shadow-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dispatch(remove(product));
                              }}
                            >
                              <IoMdRemove />
                            </button>
                            <span className="min-w-[36px] text-center font-semibold text-gray-700 text-lg">
                              {product.quantity}
                            </span>
                            <button
                              className="p-1.5 bg-pink-600 text-white text-lg font-bold rounded-full hover:bg-pink-700 active:scale-95 transition-all duration-200 shadow-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dispatch(
                                  add({ ...product, openDrawer: false })
                                );
                              }}
                            >
                              <IoMdAdd />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="hidden md:inline text-lg md:text-xl font-bold text-pink-700 ">
                          ₹
                          {(
                            Number(product.price) *
                            Number(product.quantity || 1)
                          ).toFixed(2)}
                        </span>
                        <div className="flex sm:flex-row justify-end gap-3 mt-4 w-full">
                          <button
                            className="flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] gap-2"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <FaCartShopping className="text-lg" />
                            <span>Buy Now</span>
                          </button>
                          <button
                            className=" flex items-center justify-center bg-red-500 text-white font-semibold px-4 py-2.5 rounded-full hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] gap-2"
                            onClick={() => dispatch(removeItem(product))}
                          >
                            <TiCancel className="text-lg" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 border border-pink-300/60 bg-white/90 backdrop-blur rounded-2xl shadow-md p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold text-pink-800 mb-6">
                    Order Summary
                  </h3>
                  <div className="space-y-4 text-base">
                    <div className="flex justify-between text-gray-700">
                      <span className="font-medium">Items</span>
                      <span className="font-semibold">{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span className="font-medium">Subtotal</span>
                      <span className="font-semibold">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">
                        Shipping
                      </span>
                      <span className="text-green-600 font-semibold">Free</span>
                    </div>
                    <div className="border-t-2 border-pink-100 my-4"></div>
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-pink-600">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="mt-6 w-full bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold py-4 rounded-full shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                    onClick={() => navigate("/checkout")}
                  >
                    <MdOutlineDoneOutline className="text-xl" />
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedProduct && (
            <BuyNow
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </div>
      )}
    </>
  );
}
export default Cart;
