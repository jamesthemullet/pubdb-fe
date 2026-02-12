import styles from "./style-guide.module.css";

const palette = [
  { name: "Background", variable: "--background" },
  { name: "Surface", variable: "--surface" },
  { name: "Surface Alt", variable: "--surface-alt" },
  { name: "Text", variable: "--text-color" },
  { name: "Text Muted", variable: "--text-muted" },
  { name: "Brand", variable: "--brand" },
  { name: "Brand Hover", variable: "--brand-hover" },
  { name: "Accent", variable: "--accent" },
  { name: "Accent Hover", variable: "--accent-hover" },
  { name: "Action Blue", variable: "--action-blue" },
  { name: "Action Red", variable: "--action-red" },
  { name: "Border", variable: "--border-color" },
  { name: "Input Background", variable: "--input-background" },
];

const StyleGuidePage = () => {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Pub DB Style Guide</p>
        <h1 className={styles.title}>Warm, pub-inspired color system</h1>
        <p className={styles.subtitle}>
          Designed for cozy interiors, aged wood, and warm brass accents. Use
          the brand and accent colors for calls to action and key highlights.
        </p>
      </header>

      <div className={styles.preview}>
        <div className={styles.previewCard}>
          <h2 className={styles.cardTitle}>Sample UI</h2>
          <p className={styles.cardCopy}>
            Book a table, save your favorites, and explore the best pours around
            town.
          </p>
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
            <h3 className={styles.panelTitle}>Tonight's Specials</h3>
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
        <h2 className={styles.sectionTitle}>Palette</h2>
        <div className={styles.grid}>
          {palette.map((item) => (
            <div className={styles.swatchCard} key={item.variable}>
              <div
                className={styles.swatch}
                style={{ background: `var(${item.variable})` }}
              />
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
