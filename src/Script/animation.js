import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function startAnimation() {
  const tl = gsap.timeline({ paused: true });

  tl.to(".panel", {
    xPercent: 100,
    duration: 1.2,
    stagger: 0.12,
    ease: "expo.out",
  }).call(() => {
    window.dispatchEvent(new CustomEvent("welcome-animate"));
  });

  return tl;
}