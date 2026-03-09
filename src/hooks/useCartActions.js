import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { add, remove, removeItem } from "../Redux/Cart/CartSlice";
import {
  buildCartPayload,
  buildBuyNowPayload,
  getCartItemQuantity,
  getCartTotalItems,
} from "../utils/cartUtils";

const resolveProductId = (productOrId) => {
  if (productOrId && typeof productOrId === "object") return productOrId.id;
  return productOrId;
};

function useCartActions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((state) => state.cart || []);

  const totalItems = useMemo(() => getCartTotalItems(cart), [cart]);

  const getQuantity = useCallback(
    (productId) => getCartItemQuantity(cart, productId),
    [cart]
  );

  const addProduct = useCallback(
    (product, options = {}) => {
      if (!product || product.id === undefined || product.id === null) return;
      dispatch(add(buildCartPayload(product, options)));
    },
    [dispatch]
  );

  const increaseQuantity = useCallback(
    (product, options = {}) => {
      if (!product || product.id === undefined || product.id === null) return;
      dispatch(add(buildCartPayload(product, options)));
    },
    [dispatch]
  );

  const decreaseQuantity = useCallback(
    (productOrId) => {
      const id = resolveProductId(productOrId);
      if (id === undefined || id === null) return;
      dispatch(remove({ id }));
    },
    [dispatch]
  );

  const removeProduct = useCallback(
    (productOrId) => {
      const id = resolveProductId(productOrId);
      if (id === undefined || id === null) return;
      dispatch(removeItem({ id }));
    },
    [dispatch]
  );

  const buyNowProduct = useCallback(
    (product, overrides = {}) => {
      if (!product || product.id === undefined || product.id === null) return;
      try {
        const payload = buildBuyNowPayload(product, overrides);
        sessionStorage.setItem("buyNowItem", JSON.stringify(payload));
        navigate("/checkout", { state: { fromBuyNow: true } });
      } catch (error) {
        console.error("Failed to start Buy Now flow:", error);
      }
    },
    [navigate]
  );

  return {
    cart,
    totalItems,
    getQuantity,
    addProduct,
    increaseQuantity,
    decreaseQuantity,
    removeProduct,
    buyNowProduct,
  };
}

export default useCartActions;
