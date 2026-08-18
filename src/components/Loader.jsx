/**
 * Shared loading indicator — ring spinner + pulse bars, mixed into one mark.
 * Used for full-page / inline "fetching data" states across the app.
 * Content-shaped loading (cards, rows, grids) still uses Skeleton.jsx —
 * this component is for everything else.
 */
export default function Loader({ label, size = "sm", fullPage = false }) {
  const mark = (
    <span className={`dr-loader ${size === "lg" ? "dr-loader--lg" : ""}`}>
      <span className="dr-loader-ring" />
      <span className="dr-loader-bars">
        <span />
        <span />
        <span />
        <span />
      </span>
      {label && <span className="dr-loader-label">{label}</span>}
    </span>
  );

  if (fullPage) {
    return <div className="dr-route-loader">{mark}</div>;
  }
  return mark;
}