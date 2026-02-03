// Single source of truth for products
// Images must be under public/images so they resolve as /images/...

export const products = [
  {
    id: 1001,
    title: "Silk Saree - Rose Gold",
    price: 2499,
    offer: "20%",
    description: "Premium silk saree with elegant border.",
    images: ["/images/saree-1.png", "/images/model-3.png"],
    category: { name: "Sarees", slug: "sarees" },
    tags: ["New", "Trending"],
    reviews: [
      { id: 1, user: "Asha", rating: 5, comment: "Fabric quality is amazing!" },
      { id: 2, user: "Neha", rating: 4, comment: "Loved the color and drape." }
    ],
    shipping: {
      policy: "Free shipping on orders over ₹999. COD available in select cities.",
      points: [
        "Delivery within 3-7 business days",
        "Easy 7-day return policy",
        "Secure packaging to prevent damage",
      ],
    },
  },
  {
    id: 1003,
    title: "Banarasi Saree - Emerald",
    price: 2799,
    description: "Rich banarasi weave with intricate motifs.",
    images: ["/images/saree-3.png", "/images/img-8.jpg"],
    category: { name: "Sarees", slug: "sarees" },
    reviews: [],
    shipping: { policy: "Ships in 48 hours.", points: [] },
  },
  {
    id: 1002,
    title: "Kanjeevaram Saree",
    price: 3999,
    description: "Traditional kanjeevaram silk saree.",
    images: ["/images/saree-2.png", "/images/model-4.png"],
    category: { name: "Sarees", slug: "sarees" },
    reviews: [
      { id: 1, user: "Ritu", rating: 5, comment: "Perfect for weddings." },
    ],
    shipping: {
      policy: "Standard and express shipping available.",
      points: ["Dispatch within 24-48 hours"],
    },
  },
  {
    id: 1101,
    title: "Bridal Lehenga - Maroon",
    price: 12999,
    description: "Heavy embroidered bridal lehenga set.",
    images: ["/images/model-1.png", "/images/img-5.jpg"],
    category: { name: "Lehengas", slug: "lehengas" },
    reviews: [
      { id: 1, user: "Priya", rating: 5, comment: "Stunning and premium feel." },
      { id: 2, user: "Meera", rating: 4, comment: "Great embroidery work." },
    ],
    shipping: {
      policy: "Premium shipping with insurance for high-value items.",
      points: ["Delivery within 5-9 business days"],
    },
  },
  {
    id: 1102,
    title: "Party Lehenga - Teal",
    price: 8999,
    description: "Lightweight lehenga perfect for festivities.",
    images: ["/images/model-2.png", "/images/img-9.jpg"],
    category: { name: "Lehengas", slug: "lehengas" },
    reviews: [],
    shipping: { policy: "Standard shipping.", points: [] },
  },
  {
    id: 1103,
    title: "Embroidered Lehenga - Peach",
    price: 10499,
    description: "Elegant embroidery with subtle shimmer.",
    images: ["/images/model-3.png", "/images/model-4.png"],
    category: { name: "Lehengas", slug: "lehengas" },
    reviews: [],
    shipping: { policy: "Standard shipping.", points: [] },
  },
  {
    id: 1201,
    title: "Designer Kurti - Floral",
    price: 1299,
    description: "Comfortable cotton kurti with floral pattern.",
    images: ["/images/img-4.jpg", "/images/img-6.JPG"],
    category: { name: "Kurtis", slug: "kurtis" },
    reviews: [
      { id: 1, user: "Tina", rating: 4, comment: "Very comfortable daily wear." },
    ],
    shipping: { policy: "Free shipping over ₹999.", points: [] },
  },
  {
    id: 1202,
    title: "Cotton Kurti - Indigo",
    price: 999,
    description: "Breathable cotton kurti with block print.",
    images: ["/images/img-2.jpg", "/images/img-3.jpg"],
    category: { name: "Kurtis", slug: "kurtis" },
    reviews: [],
    shipping: { policy: "Ships in 24 hours.", points: [] },
  },
  {
    id: 1203,
    title: "Anarkali Kurti - Wine",
    price: 1599,
    description: "Flowy anarkali with gold print.",
    images: ["/images/img-1.jpg", "/images/img-10.jpg"],
    category: { name: "Kurtis", slug: "kurtis" },
    reviews: [],
    shipping: { policy: "Standard shipping.", points: [] },
  },
  {
    id: 1301,
    title: "Gold Plated Necklace",
    price: 899,
    description: "Classic jewelry piece for all occasions.",
    images: ["/images/img-5.jpg"],
    category: { name: "Jewelry", slug: "jewelry" },
    reviews: [
      { id: 1, user: "Anu", rating: 4, comment: "Looks elegant." },
    ],
    shipping: { policy: "Ships in 24 hours.", points: ["Gift wrap available"] },
  },
  {
    id: 1302,
    title: "Bangle Set - Meenakari",
    price: 699,
    description: "Traditional meenakari bangles.",
    images: ["/images/img-8.jpg", "/images/img-5.jpg"],
    category: { name: "Jewelry", slug: "jewelry" },
    reviews: [],
    shipping: { policy: "Ships in 24 hours.", points: [] },
  },
  {
    id: 1401,
    title: "Embellished Sandals",
    price: 1499,
    description: "Stylish sandals with stone work.",
    images: ["/images/img-6.JPG"],
    category: { name: "Footwear", slug: "footwear" },
    reviews: [
      { id: 1, user: "Isha", rating: 4, comment: "Comfortable fit." },
    ],
    shipping: { policy: "Standard shipping.", points: [] },
  },
  {
    id: 1402,
    title: "Kolhapuri Flats",
    price: 1199,
    description: "Handcrafted leather flats.",
    images: ["/images/img-7.jpg", "/images/img-6.JPG"],
    category: { name: "Footwear", slug: "footwear" },
    reviews: [],
    shipping: { policy: "Standard shipping.", points: [] },
  },
  {
    id: 1501,
    title: "Clutch Bag - Pearl",
    price: 1599,
    description: "Elegant clutch with pearl detailing.",
    images: ["/images/img-7.jpg"],
    category: { name: "Accessories", slug: "accessories" },
    reviews: [
      { id: 1, user: "Kavya", rating: 5, comment: "Beautiful and classy." },
    ],
    shipping: { policy: "Standard shipping.", points: [] },
  },
  {
    id: 1502,
    title: "Sling Bag - Tan",
    price: 1399,
    description: "Compact sling with adjustable strap.",
    images: ["/images/img-9.jpg", "/images/img-4.jpg"],
    category: { name: "Accessories", slug: "accessories" },
    reviews: [],
    shipping: { policy: "Standard shipping.", points: [] },
  },
];

export const getAllProducts = () => products;
export const getProductsByCategorySlug = (slug) =>
  products.filter((p) => (p?.category?.slug || "").toLowerCase() === String(slug).toLowerCase());
export const getProductById = (id) => products.find((p) => String(p.id) === String(id));


