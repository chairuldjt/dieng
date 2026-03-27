import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import DestinationGrid from '@/components/DestinationGrid';
import ContactForm from '@/components/ContactForm';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <DestinationGrid />
      <ContactForm />
      <footer style={{ padding: '4rem 0', borderTop: '1px solid var(--glass-border)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="container">
          <p>&copy; 2024 Dieng Explorer. Dibuat dengan cinta untuk Indonesia dengan Next.js.</p>
        </div>
      </footer>
    </main>
  );
}
