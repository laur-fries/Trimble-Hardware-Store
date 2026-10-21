import {
  ModusWcIcon,
  ModusWcTypography,
} from '@trimble-oss/moduswebcomponents-react';

const LEGAL_LINKS = [
  'Legal',
  'Terms of Use',
  'Terms of Sale',
  'Privacy Center',
  'Do Not Sell My Information',
] as const;

const COMPANY_BLURB =
  'Trimble is an industrial technology company transforming the way the world works by delivering solutions that enable our customers to thrive. Core technologies in positioning, modeling, connectivity and data analytics connect the digital and physical worlds to improve productivity, quality, safety, transparency and sustainability. From purpose built products to enterprise lifecycle solutions, Trimble is transforming industries such as agriculture, construction, geospatial and transportation.';

/**
 * Site footer — dark charcoal band with logo/copyright, company blurb, and legal links.
 */
export default function Footer() {
  return (
    <footer className="site-footer mt-auto w-full">
      <div className="page-container py-12 md:py-14">
        <div className="page-grid items-start gap-y-8">
          <div className="page-col-12 page-col-lg-3 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ModusWcIcon
                name="trimble_logo"
                size="md"
                decorative
                customClass="site-footer-logo"
              />
              <ModusWcTypography
                hierarchy="p"
                size="lg"
                weight="bold"
                label="Trimble"
              />
            </div>
            <div className="footer-muted">
              <ModusWcTypography
                hierarchy="p"
                size="sm"
                label="© 2024, Trimble Inc."
              />
            </div>
          </div>

          <div className="page-col-12 page-col-lg-6 footer-muted">
            <ModusWcTypography hierarchy="p" size="sm" label={COMPANY_BLURB} />
          </div>

          <nav
            aria-label="Legal"
            className="page-col-12 page-col-lg-3 flex flex-col"
          >
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {LEGAL_LINKS.map((link) => (
                <li key={link}>
                  <a className="footer-link" href="#">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
