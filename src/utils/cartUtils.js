export const normalizeProductImages = (product = {}) => {
  const rawImages = product?.images ?? product?.image;

  if (Array.isArray(rawImages)) {
    const cleaned = rawImages.filter(Boolean);
    return cleaned.length ? cleaned : ["/images/img-1.jpg"];
  }

  if (rawImages && typeof rawImages === "object") {
    const cleaned = Object.values(rawImages).filter(Boolean);
    return cleaned.length ? cleaned : ["/images/img-1.jpg"];
  }

  if (typeof rawImages === "string" && rawImages.trim()) {
    return [rawImages];
  }

  return ["/images/img-1.jpg"];
};

export const buildCartPayload = (product = {}, overrides = {}) => {
  return {
    id: product?.id,
    title: product?.title || product?.name || "Product",
    price: Number(product?.price || 0),
    images: normalizeProductImages(product),
    description: product?.description || "",
    ...overrides,
  };
};

export const buildBuyNowPayload = (product = {}, overrides = {}) => {
  const item = buildCartPayload(product, { quantity: 1, ...overrides });
  return {
    items: [item],
    isBuyNow: true,
  };
};

export const getCartItemQuantity = (cart = [], productId) => {
  if (productId === undefined || productId === null) return 0;
  const item = cart.find((cartItem) => String(cartItem.id) === String(productId));
  return Number(item?.quantity || 0);
};

export const getCartTotalItems = (cart = []) => {
  return cart.reduce((total, item) => total + Number(item?.quantity || 0), 0);
};
