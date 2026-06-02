import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection, { HeroBackdrop } from "../components/landing/HeroSection";
import LandingLatestPublications from "../components/landing/LandingLatestPublications";
import FeaturesSection from "../components/landing/FeaturesSection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main className="bg-white">
      <LandingNavbar />
      <section className="relative overflow-hidden bg-white px-4 sm:px-6 pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 lg:pb-24">
        <HeroBackdrop />
        <div className="relative z-10 flex flex-col gap-12 sm:gap-14 lg:gap-16 w-full max-w-7xl mx-auto">
          <HeroSection />
          <LandingLatestPublications />
        </div>
      </section>
      <FeaturesSection />
      <Footer />
    </main>
  );
}
