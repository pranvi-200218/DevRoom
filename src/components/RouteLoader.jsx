import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import Loader from "./Loader";

/**
 * Suspense fallback for the lazy-loaded routes in App.jsx. Kept intentionally
 * tiny (no heavy deps) since it's part of the *initial* bundle — it's the
 * thing users see while the real page chunk is still downloading.
 */
export default function RouteLoader() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(ref.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    });
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref}>
      <Loader fullPage label="loading_route..." size="lg" />
    </div>
  );
}