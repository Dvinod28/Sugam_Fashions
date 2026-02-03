import React, { useState, useEffect } from "react";
import { 
  getSliders, 
  createSlider, 
  updateSlider, 
  deleteSlider, 
  reorderSliders 
} from "../../../api/catalog";
import { uploadImageToCloudinary } from "../../../utils/cloudinaryUpload";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowsUpDown, HiOutlineEye } from "react-icons/hi2";
import { HiEyeOff } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: "",
    alt: "",
    link: "",
    src: "",
    active: true,
    order: 0
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getSliders();
      setBanners(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error loading banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, {
        folder: 'sugam-fashion/banners',
        tags: ['banner', 'sugam-fashion']
      });
      setNewBanner(prev => ({ ...prev, src: uploadedUrl }));
      setPreviewImage(uploadedUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBanner.src || !newBanner.title) {
      alert("Please provide both image and title");
      return;
    }

    try {
      const bannerData = {
        ...newBanner,
        order: banners.length
      };
      
      await createSlider(bannerData);
      await loadBanners();
      
      // Reset form
      setNewBanner({
        title: "",
        alt: "",
        link: "",
        src: "",
        active: true,
        order: 0
      });
      setPreviewImage(null);
      
      alert("Banner added successfully!");
    } catch (error) {
      console.error("Error adding banner:", error);
      alert("Failed to add banner. Please try again.");
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      await deleteSlider(bannerId);
      await loadBanners();
      alert("Banner deleted successfully!");
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("Failed to delete banner. Please try again.");
    }
  };

  const handleToggleStatus = async (banner) => {
    try {
      await updateSlider(banner.id, { active: !banner.active });
      await loadBanners();
    } catch (error) {
      console.error("Error updating banner status:", error);
      alert("Failed to update banner status. Please try again.");
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
    
    try {
      await reorderSliders(newBanners.map((banner, idx) => ({ ...banner, order: idx })));
      setBanners(newBanners);
    } catch (error) {
      console.error("Error moving banner:", error);
      alert("Failed to move banner. Please try again.");
    }
  };

  const handleMoveDown = async (index) => {
    if (index === banners.length - 1) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    
    try {
      await reorderSliders(newBanners.map((banner, idx) => ({ ...banner, order: idx })));
      setBanners(newBanners);
    } catch (error) {
      console.error("Error moving banner:", error);
      alert("Failed to move banner. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Banner</h2>
        <form onSubmit={handleAddBanner} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={newBanner.title}
                onChange={(e) => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter banner title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={newBanner.alt}
                onChange={(e) => setNewBanner(prev => ({ ...prev, alt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter alt text for accessibility"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Category
              </label>
              <select
                value={newBanner.link}
                onChange={(e) => setNewBanner(prev => ({ ...prev, link: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="#">No Link</option>
                <option value="/category/sarees">Sarees</option>
                <option value="/category/lehengas">Lehengas</option>
                <option value="/category/kurtis">Kurtis</option>
                <option value="/category/jewelry">Jewelry</option>
                <option value="/category/footwear">Footwear</option>
                <option value="/category/accessories">Accessories</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banner Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                disabled={uploading}
              />
            </div>
          </div>

          {previewImage && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-w-md h-48 object-cover rounded-md border border-gray-300"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !newBanner.src || !newBanner.title}
            className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? "Uploading..." : "Add Banner"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Banners</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No banners found. Add your first banner above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {banners.map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={banner.src}
                        alt={banner.alt || banner.title}
                        className="w-full md:w-32 h-24 object-cover rounded-md"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {banner.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {banner.alt || "No alt text"}
                      </p>
                      {banner.link && (
                        <p className="text-xs text-blue-600 mt-1 truncate">
                          Link: {banner.link === '#' ? 'No Link' : banner.link.split('/').pop().charAt(0).toUpperCase() + banner.link.split('/').pop().slice(1)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          banner.active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {banner.active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Order: {banner.order + 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          banner.active
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {banner.active ? <HiEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                        {banner.active ? "Deactivate" : "Activate"}
                      </button>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                          title="Move up"
                        >
                          <HiOutlineArrowsUpDown className="w-4 h-4 rotate-180" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === banners.length - 1}
                          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                          title="Move down"
                        >
                          <HiOutlineArrowsUpDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default BannerManager;