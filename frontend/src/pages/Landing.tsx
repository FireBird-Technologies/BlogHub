import HeroSection, { HeroBackdrop } from "../components/landing/HeroSection";
import LandingLatestPublications from "../components/landing/LandingLatestPublications";
import FeaturesSection from "../components/landing/FeaturesSection";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-white px-4 sm:px-6 pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24">
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
