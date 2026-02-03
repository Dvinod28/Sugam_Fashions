import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  HiOutlineHeart,
  HiHeart,
  HiStar,
  HiOutlineArrowLeft,
  HiTrash,
} from "react-icons/hi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { add } from "../../Redux/Cart/CartSlice";
import {
  getProduct,
  addReview,
  deleteReview,
} from "../../Redux/Product/ProductSlice";
import { FaBagShopping, FaCartShopping } from "react-icons/fa6";
import { toggleWishlist as toggleWishlistAction } from "../../Redux/Wishlist/WishlistSlice";
import { db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

const normalizeImages = (images, fallback) => {
  if (Array.isArray(images)) return images;
  if (images && typeof images === "object") {
    return Object.values(images);
  }
  return [fallback].filter(Boolean);
};

const getApprovedReviews = (reviews = []) => {
  if (!Array.isArray(reviews)) return [];
  // treat missing "approved" flag as approved for legacy data
  return reviews.filter((review) => review.approved !== false);
};

const normalizeProductRecord = (raw, idOverride) => {
  if (!raw) return null;
  const approvedReviews = getApprovedReviews(raw.reviews);
  const avgRating = approvedReviews.length
    ? Number(
        (
          approvedReviews.reduce(
            (sum, r) => sum + Number(r.rating || 0),
            0
          ) / approvedReviews.length
        ).toFixed(1)
      )
    : 0;

  const rawPrice = Number(raw.price ?? 0);
  const discountPrice =
    raw.discountPrice !== undefined && raw.discountPrice !== null
      ? Number(raw.discountPrice)
      : null;
  const salePrice =
    discountPrice && discountPrice > 0 ? discountPrice : rawPrice;

  let mrpCandidate;
  if (raw.originalPrice) {
    mrpCandidate = Number(raw.originalPrice);
  } else if (discountPrice && discountPrice > 0) {
    mrpCandidate = rawPrice || salePrice;
  } else if (raw.offer) {
    const offerNumber = parseInt(String(raw.offer).replace(/[^0-9]/g, ""), 10);
    mrpCandidate =
      offerNumber && offerNumber < 100
        ? Math.round((salePrice * 100) / (100 - offerNumber))
        : salePrice;
  } else {
    mrpCandidate = salePrice ? Math.round(salePrice * 1.15) : salePrice;
  }

  if (!mrpCandidate || Number.isNaN(mrpCandidate)) mrpCandidate = salePrice;
  if (mrpCandidate < salePrice) mrpCandidate = salePrice;

  const discountPercent =
    mrpCandidate > 0
      ? Math.max(
          0,
          Math.round(((mrpCandidate - salePrice) / mrpCandidate) * 100)
        )
      : 0;

  const categoryValue =
    raw?.category ||
    (raw?.categoryName ? { name: raw.categoryName } : "");

  return {
    id: idOverride ?? raw.id,
    name: raw.title || raw.name,
    price: salePrice,
    mrp: mrpCandidate,
    discountPercent,
    discountPrice: discountPrice,
    description: raw.description || "",
    images: normalizeImages(raw.images, raw.image),
    sizes: raw.sizes || [],
    colors: raw.colors || [],
    rating: avgRating,
    reviewsCount: approvedReviews.length,
    reviews: approvedReviews,
    inStock: raw.inStock ?? true,
    sku:
      raw.sku ||
      `SKU${String(idOverride ?? raw.id ?? "").toString().padStart(4, "0")}`,
    category: categoryValue,
    tags: raw.tags || ["Featured", "Popular"],
  };
};

function ProductDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState({ rating: 5, comment: "" });
  const [reviewNotice, setReviewNotice] = useState("");
  const [pendingReview, setPendingReview] = useState(null);
  const [reviewMenuOpenId, setReviewMenuOpenId] = useState(null);
  const reviewFormRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: products } = useSelector((state) => state.product);
  const wishlist = useSelector((state) => state.wishlist || []);

  useEffect(() => {
    // Always dispatch getProduct to ensure fresh data on navigation
    dispatch(getProduct());
  }, [dispatch]);

  useEffect(() => {
    const all = Array.isArray(products) ? products : [];
    const found = all.find((p) => String(p.id) === String(id));

    if (found) {
      const normalized = normalizeProductRecord(found);
      if (normalized) {
        setProduct(normalized);
        setSelectedImage(normalized.images[0] || "");
        const related = all
          .filter((p) => String(p.id) !== String(found.id))
          .filter(
            (p) =>
              (p?.category?.name || p.category || p?.categoryName || "") ===
              (found?.category?.name || found.category || found?.categoryName || "")
          )
          .slice(0, 4)
          .map((p, i) => {
            const rel = normalizeProductRecord(p);
            return {
              id: rel?.id || p.id,
              name: rel?.name || p.title || p.name,
              price: (rel?.price ?? Number(p.price)).toFixed(2),
              image: rel?.images?.[0] || "/images/img-1.jpg",
              rating: rel?.rating || 4.0 + i * 0.2,
            };
          });
        setRelatedProducts(related);
      }
    } else {
      setProduct(null);
    }
  }, [id, products]);

  useEffect(() => {
    if (!id) return;
    let unsub;
    try {
      const ref = doc(db, "products", String(id));
      unsub = onSnapshot(ref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const normalized = normalizeProductRecord({ id: snap.id, ...data }, snap.id);
        setProduct((prev) => {
          if (!prev) return normalized;
          return normalized;
        });
        try {
          const key = currentUser?.uid
            ? `pendingReview:${snap.id}:${currentUser.uid}`
            : `pendingReview:${snap.id}:guest`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const pr = JSON.parse(stored);
            const isApprovedNow = (normalized.reviews || []).some(
              (r) => r.id === pr.id
            );
            if (isApprovedNow) {
              localStorage.removeItem(key);
              setPendingReview(null);
            } else {
              setPendingReview(pr);
            }
          } else {
            // no stored pending
            // keep existing pendingReview as-is
          }
        } catch (_) {}
      });
    } catch (_) {}
    return () => {
      try {
        if (unsub) unsub();
      } catch {}
    };
  }, [id]);

  useEffect(() => {
    if (!pendingReview || !product) return;
    const existsApproved = (product.reviews || []).some(
      (r) => r.id === pendingReview.id
    );
    if (existsApproved) {
      setPendingReview(null);
      try {
        const key = currentUser?.uid
          ? `pendingReview:${product.id}:${currentUser.uid}`
          : `pendingReview:${product.id}:guest`;
        localStorage.removeItem(key);
      } catch (_) {}
    }
  }, [product, pendingReview]);

  // Keep local wishlisted state in sync with Redux wishlist store
  useEffect(() => {
    if (!product) return;
    const exists = (wishlist || []).some(
      (w) => String(w.id) === String(product.id)
    );
    setIsWishlisted(exists);
  }, [wishlist, product]);

  const validateSelection = () => {
    // Only validate color if colors are available
    if (product.colors.length > 0 && !selectedColor) {
      setValidationError("Please select a color");
      return false;
    }
    // Only validate size if sizes are available
    if (product.sizes.length > 0 && !selectedSize) {
      setValidationError("Please select a size");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) {
      return;
    }

    if (product) {
      dispatch(
        add({
          id: product.id,
          title: product.name,
          price: product.price,
          images: product.images,
          description: product.description,
          selectedColor,
          selectedSize,
          quantity: quantity || 1,
          openDrawer: true,
        })
      );
      setValidationError("");
    }
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;

    try {
      const payload = {
        items: [
          {
            id: product.id,
            title: product.name,
            price: product.price,
            images: product.images,
            description: product.description,
            selectedColor,
            selectedSize,
            quantity: quantity || 1,
          },
        ],
        isBuyNow: true,
      };
      console.debug("BuyNow payload:", payload);
      sessionStorage.setItem("buyNowItem", JSON.stringify(payload));
      // Use react-router navigation to avoid full page reload
      navigate("/checkout");
    } catch (err) {
      console.error("BuyNow failed:", err);
      alert("Unable to start Buy Now flow. Please try again.");
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    const payload = {
      id: product.id,
      title: product.name,
      price: product.price,
      images: product.images,
      description: product.description,
    };
    dispatch(toggleWishlistAction(payload));
    setIsWishlisted((v) => !v);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-pink-50">
      {/* Navigation */}
      <div className="shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="text-pink-400 hover:text-pink-600 flex items-center"
          >
            <HiOutlineArrowLeft className="mr-2" /> Continue Shopping
          </Link>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 py-5">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-md">
              <img
                src={selectedImage || "/images/img-1.jpg"}
                alt={product.name}
                loading="lazy"
                className="w-full h-55 md:h-80 object-contain "
                onError={(e) => {
                  e.currentTarget.src = "/images/img-1.jpg";
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images && product.images.length > 0 ? (
                product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`border rounded-md overflow-hidden ${
                      selectedImage === image ? "ring-2 ring-pink-500" : ""
                    }`}
                  >
                    <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        loading="lazy"
                        className="w-full h-15 md:h-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/img-1.jpg";
                        }}
                      />
                  </button>
                ))
              ) : (
                <div className="col-span-4 text-center text-gray-500 py-4">
                  No images available
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-8 lg:mt-0 lg:pl-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900">
                  {product.name}
                </h2>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiStar
                        key={star}
                        className={`h-5 w-5 ${
                          star <= Math.floor(product.rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {product.rating} ({product.reviewsCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleWishlist}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
              >
                {isWishlisted ? (
                  <HiHeart className="h-6 w-6 text-pink-500" />
                ) : (
                  <HiOutlineHeart className="h-6 w-6 text-gray-400 hover:text-pink-500" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-2xl md:text-3xl font-semibold text-gray-900">
                  ₹{Number(product.price || 0).toFixed(2)}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      ₹{Number(product.mrp || 0).toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                      {product.discountPercent || Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100))}% OFF
                    </span>
                  </>
                )}
              </div>

                {/* Category Badge */}
                {product.category && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      {product.category.name || product.category}
                    </span>
                  </div>
                )}

              <p className="mt-4 text-gray-600">{product.description}</p>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  {product.colors.length > 0 && (
                    <div className="flex flex-col">
                      <h3 className="text-sm font-medium text-gray-900">
                        Color{" "}
                        {product.colors.length > 0 && (
                          <span className="text-red-500">*</span>
                        )}
                      </h3>
                      <div className="flex mt-1 space-x-2">
                        {product.colors.map((color, index) => (
                          <button
                            key={index}
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 ${
                              selectedColor === color
                                ? "border-pink-500 ring-2 ring-pink-300"
                                : "border-gray-200"
                            } focus:outline-none`}
                            style={{ backgroundColor: color }}
                            aria-label={`Color ${index + 1}`}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="flex items-center border border-pink-400 rounded-md">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 py-1 md:px-3 md:py-2 cursor-pointer text-gray-600 hover:bg-pink-200 rounded-l-md"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 md:px-3 md:py-2">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-2 py-1 md:px-3 md:py-2 cursor-pointer text-gray-600 hover:bg-pink-200 rounded-r-md"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {product.sizes.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Size <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        className={`px-4 py-1 md:py-2 border rounded-md text-center ${
                          selectedSize === size
                            ? "bg-pink-100 border-pink-500 text-pink-700 font-medium"
                            : "hover:bg-pink-50 hover:border-pink-300"
                        } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {validationError && (
                <div className="mt-2 text-red-500 text-sm font-medium">
                  {validationError}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-pink-500 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Add to Cart <FaBagShopping className="ms-2" />
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-white border border-pink-500 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-pink-500 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Buy Now <FaCartShopping className="ms-2" />
                </button>
              </div>

              <div className="mt-8">
                <div className="flex gap-6 border-b">
                  {["details", "reviews"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 text-sm font-medium capitalize border-b-2 -mb-[2px] ${
                        activeTab === tab
                          ? "border-pink-500 text-pink-600"
                          : "border-transparent text-gray-600"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="pt-4 text-sm text-gray-700">
                  {activeTab === "details" && (
                    <div className="space-y-2">
                      <p>SKU: {product.sku.length > 10 ? product.sku.substring(0, 8) + '...' : product.sku}</p>
                      <p>Category: {product.category.name || product.category}</p>
                      <p>Tags: {Array.isArray(product.tags) ? product.tags.join(", ") : String(product.tags || "")}</p>
                      <p>
                        Availability:{" "}
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>
                  )}
                  {activeTab === "reviews" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          Customer Reviews
                        </h3>
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="text-pink-600 hover:text-pink-700 font-medium text-sm"
                        >
                          Write a Review
                        </button>
                      </div>
                      {reviewNotice && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                          {reviewNotice}
                        </div>
                      )}

                      {showReviewForm && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100">
                          <h4 className="font-medium mb-3">
                            Write Your Review
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                Rating
                              </label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() =>
                                      setUserReview((prev) => ({
                                        ...prev,
                                        rating: star,
                                      }))
                                    }
                                    className="focus:outline-none"
                                  >
                                    <HiStar
                                      className={`h-6 w-6 ${
                                        star <= userReview.rating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      } hover:text-yellow-400 transition-colors`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                Your Review
                              </label>
                              <textarea
                                value={userReview.comment}
                                onChange={(e) =>
                                  setUserReview((prev) => ({
                                    ...prev,
                                    comment: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                                rows="3"
                                placeholder="Share your thoughts about the product..."
                              ></textarea>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  const newReview = {
                                    id: String(Date.now()),
                                    user:
                                      currentUser?.displayName ||
                                      currentUser?.email ||
                                      "Customer",
                                    userId: currentUser?.uid || null,
                                    rating: userReview.rating,
                                    comment: userReview.comment,
                                    date: new Date().toISOString(),
                                    approved: false,
                                  };
                                  try {
                                    await dispatch(addReview(product.id, newReview));
                                    setShowReviewForm(false);
                                    setUserReview({ rating: 5, comment: "" });
                                    setReviewNotice("Thanks! Your review is submitted.");
                                    setPendingReview(newReview);
                                    try {
                                      const key = currentUser?.uid
                                        ? `pendingReview:${product.id}:${currentUser.uid}`
                                        : `pendingReview:${product.id}:guest`;
                                      localStorage.setItem(key, JSON.stringify(newReview));
                                    } catch (_) {}
                                  } catch (err) {
                                    console.error("Failed to submit review", err);
                                    alert("Unable to submit review. Please try again later.");
                                  }
                                }}
                                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                              >
                                Submit Review
                              </button>
                              <button
                                onClick={() => setShowReviewForm(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {pendingReview && (
                          <div className="border border-gray-300 rounded-md shadow-sm shadow-pink-200 p-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">
                                {pendingReview.user}
                              </div>
                              <div className="flex items-center gap-2">
                                {currentUser?.uid &&
                                  pendingReview.userId === currentUser.uid && (
                                    <div className="relative">
                                      <button
                                        className="px-2 py-1 cursor-pointer rounded hover:bg-pink-100"
                                        onClick={() =>
                                          setReviewMenuOpenId(
                                            reviewMenuOpenId ===
                                              pendingReview.id
                                              ? null
                                              : pendingReview.id
                                          )
                                        }
                                        aria-label="Review options"
                                      >
                                        <BsThreeDotsVertical />
                                      </button>
                                      {reviewMenuOpenId ===
                                        pendingReview.id && (
                                        <div className="absolute right-0 mt-1 w-22 border border-red-500 rounded shadow-lg z-10">
                                          <button
                                            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600"
                                            onClick={async () => {
                                              try {
                                                await dispatch(
                                                  deleteReview(
                                                    product.id,
                                                    pendingReview.id
                                                  )
                                                );
                                                setPendingReview(null);
                                                setReviewMenuOpenId(null);
                                              } catch (_) {}
                                            }}
                                          >
                                            Delete
                                            <HiTrash />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                            <div className="flex mt-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <HiStar
                                  key={s}
                                  className={`h-4 w-4 ${
                                    s <= (pendingReview.rating || 0)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-gray-600 mt-2">
                              {pendingReview.comment}
                            </p>
                            {pendingReview.date && (
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(
                                  pendingReview.date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                        {product.reviews.length === 0 && !pendingReview ? (
                          <p className="text-gray-600">No reviews yet. Be the first to review!</p>
                        ) : (
                          product.reviews.slice(0, 3).map((r) => (
                            <div
                              key={r.id}
                              className="border rounded-md p-4 bg-white"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{r.user}</div>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <HiStar
                                      key={s}
                                      className={`h-4 w-4 ${
                                        s <= (r.rating || 0)
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                  {currentUser?.uid &&
                                    r.userId === currentUser.uid && (
                                      <div className="relative">
                                        <button
                                          className="px-2 py-1 rounded hover:bg-gray-100"
                                          onClick={() =>
                                            setReviewMenuOpenId(
                                              reviewMenuOpenId === r.id
                                                ? null
                                                : r.id
                                            )
                                          }
                                          aria-label="Review options"
                                        >
                                          ...
                                        </button>
                                        {reviewMenuOpenId === r.id && (
                                          <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow-lg z-10">
                                            <button
                                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                              onClick={async () => {
                                                try {
                                                  await dispatch(
                                                    deleteReview(
                                                      product.id,
                                                      r.id
                                                    )
                                                  );
                                                  setReviewMenuOpenId(null);
                                                } catch (_) {}
                                              }}
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                              <p className="text-gray-600 mt-2">{r.comment}</p>
                              {r.date && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {new Date(r.date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                        {product.reviews.length > 3 && (
                          <button
                            className="text-pink-600 hover:text-pink-700 font-medium text-sm"
                            onClick={() => {
                              alert(
                                "Show all reviews functionality to be implemented"
                              );
                            }}
                          >
                            View all {product.reviews.length} reviews
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details moved into tabs above */}
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-64 object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiStar
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.floor(item.rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-lg font-medium text-pink-600">
                    ₹{item.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
