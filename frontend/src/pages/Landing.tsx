import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PreviewSection from "../components/landing/PreviewSection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main className="bg-white">
      <HeroSection />
      <FeaturesSection />
      <PreviewSection />
      <Footer />
    </main>
  );
}
