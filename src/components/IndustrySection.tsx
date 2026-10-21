import { useNavigate } from 'react-router-dom';
import {
  ModusWcButton,
  ModusWcCard,
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';
import SectionHeader from './SectionHeader';
import { industries } from '../data';

export default function IndustrySection() {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="industry-heading" className="flex flex-col gap-6">
      <div id="industry-heading">
        <SectionHeader
          eyebrow="Explore hardware by industry"
          title={
            <>
              Jump straight to equipment built for
              <br />
              your specific trade
            </>
          }
          titleWeight="light"
          titleCustomClass="home-section-heading"
        />
      </div>

      <div className="page-grid">
        {industries.map((industry) => (
          <div key={industry.id} className="page-col-4">
            <ModusWcCard bordered={true} padding="compact" customClass="h-full">
              <div slot="header">
                <div className="industry-card-image">
                  <img
                    src={industry.image}
                    alt=""
                    loading="lazy"
                  />
                </div>
              </div>

              <div slot="title" className="flex w-full min-w-0 items-center gap-2">
                <ModusWcTypography
                  hierarchy="h3"
                  size="lg"
                  weight="semibold"
                  label={industry.title}
                />
              </div>

              <ModusWcTypography
                hierarchy="p"
                size="sm"
                customClass="text-[var(--modus-wc-color-base-content-low-contrast)]"
                label={industry.description}
              />

              <div slot="footer" className="px-4 pb-4">
                <ModusWcButton
                  color="neutral"
                  variant="filled"
                  size="sm"
                  fullWidth
                  aria-label={industry.cta}
                  onButtonClick={() =>
                    navigate('/catalog', {
                      state: { industry: industry.facetValue },
                    })
                  }
                >
                  <ModusWcIcon name="shopping_cart" size="xs" decorative />
                  {industry.cta}
                </ModusWcButton>
              </div>
            </ModusWcCard>
          </div>
        ))}
      </div>
    </section>
  );
}
