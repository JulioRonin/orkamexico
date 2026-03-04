import { NoiseOverlay } from './components/NoiseOverlay';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Manifesto } from './components/Manifesto';
import { Archive } from './components/Archive';
import { Pricing } from './components/Pricing';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[#F2F0E9]">
      {/* Global SVG Noise Filter */}
      <NoiseOverlay />

      {/* Components */}
      <Navbar />
      <Hero />
      <Features />
      <Manifesto />
      <Archive />
      <Pricing />
      <Footer />
    </div>
  );
}

export default App;
