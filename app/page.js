import Navbar from '@/components/Navbar';
import LandingIntro from '@/components/LandingIntro';
import Hero from '@/components/Hero';
import DestinationGrid from '@/components/DestinationGrid';
import CostEstimator from '@/components/CostEstimator';
import Gallery from '@/components/Gallery';
import ContactForm from '@/components/ContactForm';

export default function Home() {
  return (
    <main className="site-shell">
      <LandingIntro />
      <Navbar />
      <Hero />
      <DestinationGrid />
      <CostEstimator />
      <Gallery />
      <ContactForm />
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <p>&copy; 2026 Dieng Explorer. Negeri di atas awan yang paling indah dinikmati pelan-pelan.</p>
          <p>Redesigned untuk pengalaman yang lebih kuat di desktop maupun mobile.</p>
        </div>
      </footer>
    </main>
  );
}
