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
  })
    .to(".hero-title", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
    .to(".hero-desc", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");

  return tl;
}