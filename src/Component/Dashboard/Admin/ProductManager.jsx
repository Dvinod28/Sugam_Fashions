import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DataTable from "../Shared/DataTable";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteReview,
  setReviewApproval,
} from "../../../Redux/Product/ProductSlice";
import { getCategories } from "../../../api/catalog";
import { processProductImages } from "../../../utils/cloudinaryUpload";

// Validation schema
const productSchema = Yup.object().shape({
  title: Yup.string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters")
    .required("Title is required"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .required("Description is required"),
  price: Yup.number()
    .min(0, "Price must be positive")
    .required("Price is required"),
  discountPrice: Yup.number()
    .min(0, "Discount price must be positive")
    .lessThan(Yup.ref('price'), "Discount price must be less than price"),
  offers: Yup.number()
    .min(0, "Offers must be positive")
    .integer("Offers must be a whole number")
    .required("Offers is required"),
  images: Yup.array()
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed")
    .required("Images are required"),
});

// Delete Confirmation Modal
function DeleteModal({ open, onClose, onConfirm, productName }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{productName}"? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md font-semibold border text-gray-600 border-gray-300 hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-md bg-red-500 border border-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductModal({ open, onClose, initial }) {
  const dispatch = useDispatch();
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getCategories();
        if (mounted) setCategories(list || []);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isEdit = Boolean(initial?.id);

  const initialValues = {
    id: initial?.id || undefined,
    title: initial?.title || "",
    description: initial?.description || "",
    price: initial?.price || "",
    discountPrice: initial?.discountPrice || "",
    offers: initial?.offers ?? initial?.stock ?? 0,
    categoryId: initial?.categoryId || "",
    images: initial?.images || [],
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    console.log("Form values:", values);
    console.log("Images:", values.images);
    console.log("Is Edit:", isEdit);

    try {
      setIsUploading(true);
      const selectedCategory =
        categories.find((c) => c.id === values.categoryId) || null;
      
      // Validate images
      if (!values.images || values.images.length === 0) {
        throw new Error("At least one image is required");
      }
      
      // Process images with Cloudinary
      let processedImages = values.images;
      if (values.images.some(img => img instanceof File)) {
        // Only process if there are new files to upload
        toast.info("Uploading images to cloud...", { position: "top-left" });
        processedImages = await processProductImages(values.images, values.id || `product-${Date.now()}`);
        
        if (processedImages.length === 0) {
          throw new Error("Failed to upload images. Please try again.");
        }
        
        toast.success("Images uploaded successfully!", { position: "top-left" });
      }
      
      const payload = {
        id: values.id,
        title: values.title,
        description: values.description,
        price: values.price,
        discountPrice: values.discountPrice,
        // primary public field is `offers`
        offers: values.offers,
        // keep `stock` for backward compatibility with existing DB schema
        stock: values.offers,
        categoryId: values.categoryId || null,
        categoryName: selectedCategory?.name || null,
        images: processedImages,
      };
      
      console.log("Submitting payload:", payload);
      
      if (isEdit) {
        await dispatch(updateProduct(payload));
        toast.success("Product updated successfully", { position: "top-left" });
      } else {
        await dispatch(addProduct(payload));
        toast.success("Product added successfully", { position: "top-left" });
      }
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Failed to save product. Please try again.", { position: "top-left" });
    } finally {
      setSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative bg-gray-50 rounded-xl shadow-xl w-full max-w-2xl p-6 border border-gray-300 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEdit ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-500 hover:cursor-pointer transition-colors"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            <Formik
              initialValues={initialValues}
              validationSchema={productSchema}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue, isSubmitting }) => (
                <Form className="space-y-4">
                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <Field
                      name="title"
                      className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Enter product title"
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <Field
                      name="description"
                      as="textarea"
                      rows={1}
                      className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      placeholder="Enter product description"
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Category Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <Field
                      as="select"
                      name="categoryId"
                      className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.title || "Category"}
                        </option>
                      ))}
                    </Field>
                  </div>

                  {/* Multiple Images Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Images * (Max 5 images)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          console.log("Selected files:", files);
                          console.log("Current images:", values.images);
                          
                          const newFiles = files.slice(0, 5 - values.images.length); // Limit to 5 total images
                          console.log("New images after slice:", newFiles);
                          
                          // Merge new files with existing images (URLs + Files)
                          const existingImages = values.images.filter(img => typeof img === 'string');
                          const allImages = [...existingImages, ...newFiles];
                          // Limit to 5 images max
                          const limitedImages = allImages.slice(0, 5);
                          console.log("Merged images:", limitedImages);
                          
                          setFieldValue("images", limitedImages);
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center justify-center text-gray-600 hover:text-pink-500 transition-colors"
                      >
                        <HiOutlinePlus className="w-6 h-6 mb-1" />
                        <span>Click to upload images</span>
                        <span className="text-sm text-gray-400">
                          PNG, JPG, GIF up to 5MB each
                        </span>
                      </label>
                    </div>

                    {/* Image Preview and Progress */}
                    {values.images && values.images.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {values.images.map((file, index) => {
                          const isUrl = typeof file === "string";
                          const previewSrc = isUrl
                            ? file
                            : URL.createObjectURL(file);
                          const displayName = isUrl
                            ? file.split("/").pop() || "image"
                            : file.name;
                          return (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-shrink-0">
                                <img
                                  src={previewSrc}
                                  alt={`Preview ${index + 1}`}
                                  loading="lazy"
                                  className="w-12 h-12 object-cover rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {displayName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {!isUrl && file.size
                                    ? (file.size / 1024 / 1024).toFixed(2) +
                                      " MB"
                                    : ""}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = values.images.filter(
                                    (_, i) => i !== index
                                  );
                                  setFieldValue("images", newImages);
                                }}
                                className="text-red-500 hover:text-red-700 transition-colors"
                              >
                                <HiOutlineX className="w-5 h-5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <ErrorMessage
                      name="images"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Price and Stock Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <Field
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <ErrorMessage
                        name="price"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Price
                      </label>
                      <Field
                        name="discountPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <ErrorMessage
                        name="discountPrice"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Offers
                      </label>
                      <Field
                        name="offers"
                        type="tel"
                        min="0"
                        className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0"
                      />
                      <ErrorMessage
                        name="offers"
                        component="div"
                        className="text-red-500 text-sm mt-1"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 rounded-md font-semibold border text-gray-600 border-gray-300 hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="px-6 py-2 rounded-md bg-pink-500 border border-pink-500 text-white font-semibold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isUploading
                        ? "Uploading..."
                        : isSubmitting
                        ? "Saving..."
                        : isEdit
                        ? "Save Changes"
                        : "Add Product"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProductManager() {
  const products = useSelector((s) => s.product.data || []);
  const dispatch = useDispatch();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);

  useEffect(() => {
    dispatch(getProduct());
  }, [dispatch]);

  const columns = useMemo(
    () => [
      // { key: "id", title: "ID" },
      { key: "title", title: "Title" },
      { key: "description", title: "Description" },
      { key: "price", title: "Price" },
      { key: "offers", title: "Offers" },
      { key: "categoryName", title: "Category" },
      {
        key: "actions",
        title: "",
        render: (_, row) => (
          <div className="flex gap-2 ">
            <button
              className="px-2 py-1 border rounded-md hover:bg-gray-50"
              onClick={() => {
                setEditing({
                  id: row.id,
                  title: row.title,
                  description: row.description ?? "",
                  price: row.price ?? 0,
                  offers: row.offers ?? row.stock ?? 0,
                  categoryId: row.categoryId || "",
                  images: row.images || [],
                });
                setModalOpen(true);
              }}
            >
              <HiOutlinePencil />
            </button>
            <button
              className="px-2 py-1 border rounded-md hover:bg-gray-50"
              onClick={() => {
                // open reviews modal for this product
                const prod = products.find((p) => p.id === row.id);
                setReviewProduct(prod || { id: row.id, reviews: [] });
                setReviewModalOpen(true);
              }}
            >
              Reviews
            </button>
            <button
              className="px-2 py-1 border  rounded-md text-red-600 hover:bg-red-50"
              onClick={() => {
                setProductToDelete(row);
                setDeleteModalOpen(true);
              }}
            >
              <HiOutlineTrash />
            </button>
          </div>
        ),
      },
    ],
    [dispatch, products]
  );

  // Review Modal Component
  function ReviewModal({ open, onClose, product }) {
    if (!open || !product) return null;
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    return (
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 border max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Manage Reviews — {product.title || product.id}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><HiOutlineX className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-gray-600">No reviews for this product.</p>}
                {reviews.map((r) => (
                  <div key={r.id} className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{r.user || 'Customer'}</div>
                        <div className="flex text-sm text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < (r.rating || 0) ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2">{r.comment}</p>
                      {r.date && <p className="text-sm text-gray-500 mt-1">{new Date(r.date).toLocaleString()}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-3 py-1 rounded-md ${r.approved ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                        onClick={async () => {
                          await dispatch(setReviewApproval(product.id, r.id, !r.approved));
                          toast.success(`Review ${r.approved ? 'unapproved' : 'approved'}`);
                          // refresh local product reference
                          const updated = (products || []).find(p => p.id === product.id);
                          setReviewProduct(updated || product);
                        }}
                      >
                        {r.approved ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        className="px-3 py-1 rounded-md bg-red-500 text-white"
                        onClick={async () => {
                          if (!confirm('Delete this review?')) return;
                          await dispatch(deleteReview(product.id, r.id));
                          toast.success('Review deleted');
                          const updated = (products || []).find(p => p.id === product.id);
                          setReviewProduct(updated || product);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-3 py-2 font-semibold rounded-md bg-pink-500 text-white shadow-sm hover:bg-pink-600"
        >
          <h2 className="flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" /> Add Product
          </h2>
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <DataTable
          columns={columns}
          data={[...products]
            .sort((a, b) => {
              const ca = Number(a?.createdAt || 0);
              const cb = Number(b?.createdAt || 0);
              if (cb !== ca) return cb - ca; // newest first
              // fallback by id string compare to keep deterministic
              return String(b.id || "").localeCompare(String(a.id || ""));
            })
            .map((p) => ({
              id: p.id,
              title: p.title,
              description:
                p.description.length > 10
                  ? p.description.slice(0, 30) + "..."
                  : p.description ?? "",
              price: p.price,
              offers: p.offers ?? p.stock ?? 0,
              categoryId: p.categoryId || "",
              categoryName: p.categoryName || "",
              images: Array.isArray(p.images)
                ? p.images
                : p.image
                ? [p.image]
                : [],
            }))}
        />
      </div>
      <ProductModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
      />
      <DeleteModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={async () => {
          if (productToDelete) {
            await dispatch(deleteProduct(productToDelete));
            setDeleteModalOpen(false);
            setProductToDelete(null);
          }
        }}
        productName={productToDelete?.title || "this product"}
      />
      <ReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setReviewProduct(null);
        }}
        product={reviewProduct}
      />
    </div>
  );
}
