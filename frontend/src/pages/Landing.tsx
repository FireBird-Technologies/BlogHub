import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import LandingAboutSection from "../components/landing/LandingAboutSection";
import LandingLatestPublications from "../components/landing/LandingLatestPublications";
import LandingCategorizedPublications from "../components/landing/LandingCategorizedPublications";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <main className="bg-white">
      <LandingNavbar />
      <section className="relative overflow-hidden bg-white px-4 sm:px-6 pt-20 sm:pt-24 pb-8">
        <div className="relative z-10 flex flex-col gap-12 sm:gap-14 lg:gap-16 w-full max-w-7xl mx-auto">
          <HeroSection />
        </div>
      </section>
      <section className="relative overflow-hidden bg-white px-4 sm:px-6 pb-14 sm:pb-16">
        <div className="relative z-10 flex flex-col gap-12 sm:gap-14 lg:gap-16 w-full max-w-7xl mx-auto">
          <LandingLatestPublications />
        </div>
      </section>
      <LandingAboutSection />
      <LandingCategorizedPublications />
      <Footer />
    </main>
  );
}
