import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";

gsap.registerPlugin(ScrollTrigger, TextPlugin, Flip, Observer);

export function splitChars(el, className = "char") {
  const text = el.textContent ?? "";
  el.textContent = "";
  el.setAttribute("aria-label", text);
  const chars = [];
  for (const char of text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = char === " " ? "\u00a0" : char;
    span.style.display = "inline-block";
    el.appendChild(span);
    chars.push(span);
  }
  return {
    chars,
    revert() {
      el.textContent = text;
      el.removeAttribute("aria-label");
    },
  };
}

export function splitWords(el, className = "word") {
  const text = el.textContent ?? "";
  el.textContent = "";
  const words = text.split(/\s+/).filter(Boolean);
  const spans = [];
  words.forEach((word, i) => {
    const span = document.createElement("span");
    span.className = className;
    span.style.display = "inline-block";
    span.textContent = word;
    el.appendChild(span);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    spans.push(span);
  });
  return {
    words: spans,
    revert() {
      el.textContent = text;
    },
  };
}

export function onceInView(el, cb) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          cb();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.25 }
  );
  observer.observe(el);
}

export function animate3DChars(el, { repeat = false } = {}) {
  el.classList.remove("invisible", "opacity-0");
  gsap.set(el, { visibility: "visible", opacity: 1, clearProps: "transform" });
  const { chars } = splitChars(el);
  const depth = -Math.min(window.innerWidth, 1200) / 6;
  const transformOrigin = `50% 50% ${depth}px`;

  gsap.set(el, { perspective: 800, transformStyle: "preserve-3d" });

  return gsap.fromTo(
    chars,
    { rotationX: -90, opacity: 0, y: 20 },
    {
      rotationX: 0,
      opacity: 1,
      y: 0,
      stagger: 0.06,
      duration: 0.85,
      ease: "power3.out",
      transformOrigin,
      repeat: repeat ? -1 : 0,
    }
  );
}

export function animateHeadlineChars(el) {
  el.classList.remove("opacity-0");
  gsap.set(el, { opacity: 1, y: 0, visibility: "visible" });
  const { chars } = splitChars(el);
  return gsap.from(chars, {
    duration: 0.9,
    opacity: 0,
    scale: 0,
    y: 70,
    rotationX: 160,
    transformOrigin: "50% 50% -40px",
    ease: "back.out(1.7)",
    stagger: 0.045,
  });
}

export function animateHeadlineWords(el) {
  gsap.set(el, { opacity: 1, y: 0 });
  const { words, revert } = splitWords(el);
  return gsap.from(words, {
    y: -100,
    opacity: 0,
    rotation: () => gsap.utils.random(-80, 80),
    stagger: 0.1,
    duration: 1,
    ease: "back.out(1.4)",
    onComplete: revert,
  });
}

export function scrambleReveal(el, finalText, { duration = 2.4, delay = 0 } = {}) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const len = finalText.length;
  let frame = 0;
  const totalFrames = Math.round(duration * 30);
  gsap.set(el, { opacity: 1, y: 0 });

  return gsap.delayedCall(delay, () => {
    const tick = () => {
      frame++;
      const progress = frame / totalFrames;
      const revealed = Math.floor(progress * len);
      let out = "";
      for (let i = 0; i < len; i++) {
        out += i < revealed ? finalText[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (frame < totalFrames) requestAnimationFrame(tick);
      else el.textContent = finalText;
    };
    tick();
  });
}

export function glitchTransition(elements, updateContent, { duration = 0.5, flashes = 14 } = {}) {
  const els = gsap.utils.toArray(elements);
  gsap.killTweensOf(els);
  gsap.set(els, { clearProps: "opacity" });

  const tl = gsap.timeline();
  for (let i = 0; i < flashes; i++) {
    tl.set(els, { opacity: i % 2 === 0 ? 0 : 1 });
    tl.to({}, { duration: duration / flashes });
  }
  tl.set(els, { opacity: 0 });
  tl.call(updateContent);
  tl.to(els, { opacity: 1, duration: 0.12, ease: "steps(1)" });
  return tl;
}

export function fadeTransition(elements, updateContent, { duration = 0.25 } = {}) {
  const els = gsap.utils.toArray(elements);
  return gsap
    .timeline()
    .to(els, { opacity: 0, duration, ease: "power2.in" })
    .call(updateContent)
    .to(els, { opacity: 1, duration, ease: "power2.out" });
}

export function loadingTextCycle(el, texts, { paused = true } = {}) {
  const tl = gsap.timeline({ paused, repeat: -1 });
  texts.forEach((text, i) => {
    const next = texts[(i + 1) % texts.length];
    tl.to(el, {
      duration: 0.8,
      text: { value: next, type: "diff" },
      ease: "sine.inOut",
    });
  });
  return tl;
}

export function horizontalLoop(items, config = {}) {
  items = gsap.utils.toArray(items);
  config = config || {};
  let tl = gsap.timeline({
    repeat: config.repeat,
    paused: config.paused,
    defaults: { ease: "none" },
    onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
  });
  const length = items.length;
  const startX = items[0].offsetLeft;
  const times = [];
  const widths = [];
  const xPercents = [];
  let curIndex = 0;
  const pixelsPerSecond = (config.speed || 1) * 100;
  const snap =
    config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1);
  let totalWidth, curX, distanceToStart, distanceToLoop, item, i;

  gsap.set(items, {
    xPercent: (i, el) => {
      let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
      xPercents[i] = snap(
        (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
          gsap.getProperty(el, "xPercent")
      );
      return xPercents[i];
    },
  });
  gsap.set(items, { x: 0 });
  totalWidth =
    items[length - 1].offsetLeft +
    (xPercents[length - 1] / 100) * widths[length - 1] -
    startX +
    items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") +
    (parseFloat(config.paddingRight) || 0);

  for (i = 0; i < length; i++) {
    item = items[i];
    curX = (xPercents[i] / 100) * widths[i];
    distanceToStart = item.offsetLeft + curX - startX;
    distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
    tl.to(
      item,
      {
        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
        duration: distanceToLoop / pixelsPerSecond,
      },
      0
    )
      .fromTo(
        item,
        {
          xPercent: snap(
            ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
          ),
        },
        {
          xPercent: xPercents[i],
          duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
          immediateRender: false,
        },
        distanceToLoop / pixelsPerSecond
      )
      .add("label" + i, distanceToStart / pixelsPerSecond);
    times[i] = distanceToStart / pixelsPerSecond;
  }

  function toIndex(index, vars) {
    vars = vars || {};
    Math.abs(index - curIndex) > length / 2 &&
      (index += index > curIndex ? -length : length);
    let newIndex = gsap.utils.wrap(0, length, index),
      time = times[newIndex];
    if (time > tl.time() !== index > curIndex) {
      vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
      time += tl.duration() * (index > curIndex ? 1 : -1);
    }
    curIndex = newIndex;
    vars.overwrite = true;
    return tl.tweenTo(time, vars);
  }

  tl.next = (vars) => toIndex(curIndex + 1, vars);
  tl.previous = (vars) => toIndex(curIndex - 1, vars);
  tl.current = () => curIndex;
  tl.toIndex = (index, vars) => toIndex(index, vars);
  tl.times = times;
  tl.progress(1, true).progress(0, true);
  if (config.reversed) {
    tl.vars.onReverseComplete();
    tl.reverse();
  }
  return tl;
}

export function initStageScale(stageId, baseWidth = 1920, baseHeight = 1080, offsetLeft = 0) {
  const stage = document.getElementById(stageId);
  if (!stage) return;

  const apply = () => {
    const availableWidth = Math.max(window.innerWidth - offsetLeft, 320);
    const availableHeight = Math.max(window.innerHeight, 320);
    const scale = Math.min(availableWidth / baseWidth, availableHeight / baseHeight);
    const centerX = offsetLeft + availableWidth / 2;
    const centerY = availableHeight / 2;
    stage.style.left = `${centerX}px`;
    stage.style.top = `${centerY}px`;
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  apply();
  window.addEventListener("resize", apply);
  return apply;
}

export function initSimpleStageScale(stageId, baseWidth = 1920, baseHeight = 1080) {
  const stage = document.getElementById(stageId);
  if (!stage) return;

  const apply = () => {
    const scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
    stage.style.left = "50%";
    stage.style.top = "50%";
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };

  apply();
  window.addEventListener("resize", apply);
}

export { gsap, ScrollTrigger, Flip, Observer, TextPlugin };
