export const categories = [
  { name: "Sarees", slug: "sarees" },
  { name: "Lehengas", slug: "lehengas" },
  { name: "Kurtis", slug: "kurtis" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Footwear", slug: "footwear" },
  { name: "Accessories", slug: "accessories" },
];

export function toCategorySlug(name = "") {
  return name.toLowerCase().replace(/\s+/g, "-");
}


