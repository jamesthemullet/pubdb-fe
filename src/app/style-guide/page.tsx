import type { Metadata } from "next";
import Typography from "@/app/components/typography/typography";
import styles from "./style-guide.module.css";

export const metadata: Metadata = {
  title: "Style Guide",
  description: "Pub DB design system style guide.",
  robots: { index: false },
};

const palette = [
  { name: "Background",       variable: "--background",       swatchClass: styles.swatchBackground },
  { name: "Surface",          variable: "--surface",          swatchClass: styles.swatchSurface },
  { name: "Surface Alt",      variable: "--surface-alt",      swatchClass: styles.swatchSurfaceAlt },
  { name: "Text",             variable: "--text-color",       swatchClass: styles.swatchTextColor },
  { name: "Text Muted",       variable: "--text-muted",       swatchClass: styles.swatchTextMuted },
  { name: "Brand",            variable: "--brand",            swatchClass: styles.swatchBrand },
  { name: "Brand Hover",      variable: "--brand-hover",      swatchClass: styles.swatchBrandHover },
  { name: "Accent",           variable: "--accent",           swatchClass: styles.swatchAccent },
  { name: "Accent Hover",     variable: "--accent-hover",     swatchClass: styles.swatchAccentHover },
  { name: "Action Blue",      variable: "--action-blue",      swatchClass: styles.swatchActionBlue },
  { name: "Action Red",       variable: "--action-red",       swatchClass: styles.swatchActionRed },
  { name: "Border",           variable: "--border-color",     swatchClass: styles.swatchBorderColor },
  { name: "Input Background", variable: "--input-background", swatchClass: styles.swatchInputBackground },
];

const StyleGuidePage = () => {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <Typography className={styles.kicker}>Pub DB Style Guide</Typography>
        <Typography variant="headingLarge" className={styles.title}>Warm, pub-inspired color system</Typography>
        <Typography className={styles.subtitle}>
          Designed for cozy interiors, aged wood, and warm brass accents. Use
          the brand and accent colors for calls to action and key highlights.
        </Typography>
      </header>

      <div className={styles.preview}>
        <div className={styles.previewCard}>
          <Typography variant="headingMedium" className={styles.cardTitle}>Sample UI</Typography>
          <Typography className={styles.cardCopy}>
            Book a table, save your favorites, and explore the best pours around
            town.
          </Typography>
          <div className={styles.buttonRow}>
            <button type="button">Primary Action</button>
            <button type="button" className="secondary">
              Secondary Action
            </button>
          </div>
          <div className={styles.utilityRow}>
            <button type="button" className={styles.blueButton}>
              Blue Action
            </button>
            <button type="button" className={styles.redButton}>
              Red Action
            </button>
          </div>
          <div className={styles.chips}>
            <span className={styles.chip}>House Ale</span>
            <span className={styles.chip}>Live Music</span>
            <span className={styles.chip}>Food Pairings</span>
          </div>
        </div>

        <div className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <Typography variant="headingSmall" className={styles.panelTitle}>Tonight's Specials</Typography>
            <span className={styles.panelTag}>New</span>
          </div>
          <ul className={styles.panelList}>
            <li>Amber Lager Flight</li>
            <li>Smoked Brisket Bap</li>
            <li>Old Fashioned Stout</li>
          </ul>
        </div>
      </div>

      <section className={styles.section}>
        <Typography variant="headingMedium" className={styles.sectionTitle}>Palette</Typography>
        <div className={styles.grid}>
          {palette.map((item) => (
            <div className={styles.swatchCard} key={item.variable}>
              <div className={`${styles.swatch} ${item.swatchClass}`} />
              <div className={styles.swatchMeta}>
                <span className={styles.swatchName}>{item.name}</span>
                <code className={styles.swatchVar}>{item.variable}</code>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
};

export default StyleGuidePage;
