import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import { openDirectOrderModal } from './DirectOrderModal';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="hero-heading" className="home-hero w-full">
      <div className="home-hero-overlay" aria-hidden="true" />
      <div className="page-container relative z-[1] py-16 md:py-24">
        <div className="page-grid">
          <div className="page-col-12 page-col-lg-6 flex flex-col gap-6">
            <ModusWcTypography
              hierarchy="h1"
              size="6xl"
              weight="normal"
              customClass="home-hero-heading !mb-0"
            >
              <span id="hero-heading">Hardware solutions for every jobsite</span>
            </ModusWcTypography>

            <ModusWcTypography
              hierarchy="p"
              size="lg"
              weight="normal"
              customClass="home-hero-subcopy text-[var(--modus-wc-color-base-content-low-contrast)]"
              label="Browse our complete catalog of certified hardware, or use our Guided Selling Tool to configure a custom system tailored to your machinery."
            />

            <div className="flex flex-wrap items-center gap-3">
              <ModusWcButton
                color="primary"
                variant="filled"
                size="md"
                aria-label="Browse catalog"
                onButtonClick={() => navigate('/catalog')}
              >
                Browse Catalog
              </ModusWcButton>
              <ModusWcButton
                color="neutral"
                variant="filled"
                size="md"
                aria-label="Open guided selling tool"
                onButtonClick={openDirectOrderModal}
              >
                Guided Selling Tool
              </ModusWcButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
