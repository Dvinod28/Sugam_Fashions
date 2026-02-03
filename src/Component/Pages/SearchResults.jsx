import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getProduct } from "../../Redux/Product/ProductSlice";
import { FaBagShopping, FaCartShopping } from "react-icons/fa6";
import { getAllProducts } from "../../data/products";

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { data: products } = useSelector((state) => state.product);
  const [sortBy, setSortBy] = useState("relevance");

  // Extract search query from URL
  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  }, [location.search]);

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(getProduct());
    }
  }, [dispatch, products]);

  const filtered = useMemo(() => {
    const apiList = Array.isArray(products) ? products : [];
    const localList = getAllProducts();
    
    // Combine API and local products
    let list = [...apiList];
    if (list.length === 0) list = [...localList];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name-asc":
        list = [...list].sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
        break;
      default:
        break;
    }

    return list;
  }, [products, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex text-gray-500">
          <li>
            <button
              className="text-pink-600 hover:underline"
              onClick={() => navigate("/")}
            >
              Home
            </button>
          </li>
          <li className="mx-2">/</li>
          <li className="text-gray-700 font-medium">Search Results</li>
        </ol>
      </nav>

      {/* Header + Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Search Results for "{searchQuery}"
        </h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border-2 border-pink-300 rounded-md px-1 md:px-3 py-1 md:py-2 text-xs md:text-sm outline-none"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 mb-4">
        {filtered.length} {filtered.length === 1 ? "item" : "items"} found
      </p>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">Try a different search term or browse our categories</p>
          <button 
            onClick={() => navigate("/")}
            className="bg-pink-500 text-white px-6 py-2 rounded-full hover:bg-pink-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Product Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product) => {
            const imageSrc =
              product.images && typeof product.images === "object"
                ? Object.values(product.images)[0]
                : Array.isArray(product.images)
                ? product.images[0]
                : product?.image ||
                  "/images/img-1.jpg";
            return (
              <div
                key={product.id}
                className="bg-white border-2 border-pink-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="bg-pink-50">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={imageSrc}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-40 md:h-48 object-cover"
                    />
                  </Link>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm md:text-base font-semibold line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <span className="text-pink-700 font-bold">
                      ₹{product.price}
                    </span>
                    <button
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="text-xs md:text-sm bg-pink-500 text-white font-semibold px-3 md:px-4 py-2 rounded-full hover:bg-pink-100 hover:text-pink-500 hover:border-2 hover:border-pink-500 transition-colors mt-2 md:mt-0 flex items-center"
                    >
                      <FaBagShopping className="mr-1" /> View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchResults;