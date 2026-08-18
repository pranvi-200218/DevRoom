import { useLayoutEffect } from "react";
import { gsap } from "gsap";

/**
 * Shared entrance-animation hook for every authenticated page.
 * Drop these class names on existing elements (no markup restructuring
 * needed) and call usePageEntrance() once per page:
 *
 *   .gsap-topbar   -> fades + slides down once, on mount
 *   .gsap-sidebar  -> fades + slides in from the left once, on mount
 *   .gsap-panel    -> fades + slides up, staggered, on mount
 *   .gsap-stagger  -> direct children fade/slide up with a stagger
 *                     (use for card grids, lists, table rows)
 *   .gsap-hover    -> subtle lift + shadow on hover (pure CSS, see index.css)
 *
 * `deps` lets a page re-run the .gsap-stagger pass after async data
 * arrives (e.g. usePageEntrance([loading, items.length])).
 */
export default function usePageEntrance(deps = []) {
    useLayoutEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
            tl.fromTo(".gsap-topbar", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.45, clearProps: "transform" })
                .fromTo(".gsap-sidebar", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5, clearProps: "transform" }, "<")
                .fromTo(
                    ".gsap-panel", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: "transform" },
                    "-=0.25"
                );

            gsap.utils.toArray(".gsap-stagger").forEach((group) => {
                const children = group.children.length ? group.children : [group];
                gsap.fromTo(
                    children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.045, ease: "power2.out", delay: 0.1, clearProps: "transform" }
                );
            });
        });
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}