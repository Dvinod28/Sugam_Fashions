import Facalities from "../Home/Facalities";
import FeaturedIn from "../Home/FeaturedIn";
import HeroSection from "../Home/HeroSection";
import NewArraival from "../Home/NewArraival";
import NewArraivalSlider from "../Home/NewArraivalSlider";
import FeaturedProducts from "../Home/FeaturedProducts";
import ShopbyCatagory from "../Home/ShopbyCatagory";
import ShopbyCollection from "../Home/ShopbyCollection";
import VidSlider from "../Home/VidSlider";
function HomePage() {
  return (
    <>
      <div className="bg-gray-100">
        <HeroSection />
        <NewArraivalSlider />
        <VidSlider />
        <Facalities />
        <NewArraival />
        <ShopbyCatagory />
        <FeaturedProducts />
        <FeaturedIn />
        <ShopbyCollection />
      </div>
    </>
  );
}
export default HomePage;
