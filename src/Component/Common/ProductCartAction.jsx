import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { TiCancel } from "react-icons/ti";
import { FaBoltLightning } from "react-icons/fa6";
import useCartActions from "../../hooks/useCartActions";

function ProductCartAction({
  product,
  addLabel = "Add to Cart",
  addIcon = null,
  buyNowLabel = "Buy Now",
  buyNowIcon = null,
  showBuyNow = true,
  openDrawerOnAdd = false,
  addButtonClassName = "",
  buyNowButtonClassName = "",
  controlsWrapperClassName = "",
  qtyControlClassName = "",
  qtyButtonClassName = "",
  qtyValueClassName = "",
  removeButtonClassName = "",
}) {
  const {
    getQuantity,
    addProduct,
    increaseQuantity,
    decreaseQuantity,
    removeProduct,
    buyNowProduct,
  } = useCartActions();

  const productId = product?.id;
  const quantity = getQuantity(productId);

  const baseAddButtonClassName =
    "bg-pink-500 text-white rounded px-3 py-2 flex items-center justify-center gap-2 hover:bg-pink-600 transition-colors duration-200";
  const baseControlsWrapperClassName = "flex flex-col items-stretch gap-2";
  const baseQtyControlClassName =
    "flex items-center border border-pink-400 rounded overflow-hidden bg-white";
  const baseQtyButtonClassName =
    "px-2 py-1 text-lg text-pink-600 hover:bg-pink-50 transition-colors";
  const baseQtyValueClassName = "px-3 py-1 font-semibold text-pink-700";
  const baseRemoveButtonClassName =
    "px-3 py-1.5 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors";
  const baseBuyNowButtonClassName =
    "rounded px-3 py-2 flex items-center justify-center gap-2 !bg-emerald-600 !text-white hover:!bg-emerald-700 transition-colors duration-200";
  const buyNowEffectiveIcon = buyNowIcon ?? (
    <FaBoltLightning className="text-sm" />
  );

  if (!productId && productId !== 0) return null;

  if (quantity <= 0) {
    return (
      <div className={`${baseControlsWrapperClassName} ${controlsWrapperClassName}`}>
        <button
          type="button"
          onClick={() => addProduct(product, { openDrawer: openDrawerOnAdd })}
          className={`${baseAddButtonClassName} ${addButtonClassName}`}
        >
          <span>{addLabel}</span>
          {addIcon}
        </button>
        {showBuyNow && (
          <button
            type="button"
            onClick={() => buyNowProduct(product, { quantity: 1 })}
            className={`${baseBuyNowButtonClassName} ${addButtonClassName} ${buyNowButtonClassName}`}
          >
            <span>{buyNowLabel}</span>
            {buyNowEffectiveIcon}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${baseControlsWrapperClassName} ${controlsWrapperClassName}`}>
      <div className={`${baseQtyControlClassName} ${qtyControlClassName}`}>
        {quantity > 0 && (
          <button
            type="button"
            onClick={() => decreaseQuantity(product)}
            className={`${baseQtyButtonClassName} ${qtyButtonClassName}`}
            aria-label="Decrease quantity"
          >
            <IoMdRemove />
          </button>
        )}
        <span className={`${baseQtyValueClassName} ${qtyValueClassName}`}>
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => increaseQuantity(product, { openDrawer: false })}
          className={`${baseQtyButtonClassName} ${qtyButtonClassName}`}
          aria-label="Increase quantity"
        >
          <IoMdAdd />
        </button>
      </div>
      <button
        type="button"
        onClick={() => removeProduct(product)}
        className={`${baseRemoveButtonClassName} ${removeButtonClassName}`}
      >
        <span className="inline-flex items-center gap-1">
          <TiCancel />
          Remove
        </span>
      </button>
      {showBuyNow && (
        <button
          type="button"
          onClick={() => buyNowProduct(product, { quantity: 1 })}
          className={`${baseBuyNowButtonClassName} ${addButtonClassName} ${buyNowButtonClassName}`}
        >
          <span>{buyNowLabel}</span>
          {buyNowEffectiveIcon}
        </button>
      )}
    </div>
  );
}

export default ProductCartAction;
