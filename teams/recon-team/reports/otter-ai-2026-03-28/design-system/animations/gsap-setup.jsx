/**
 * OTTER.AI DESIGN SYSTEM — GSAP Animation Setup for React
 *
 * Otter.ai uses GSAP for:
 * 1. Marquee (infinite horizontal scroll of logos/testimonials)
 * 2. ScrollTrigger (scroll-driven section reveals, direction-aware marquee)
 * 3. Typewriter effect (character-by-character text reveal)
 * 4. Slider pagination (timed width fill animation)
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ─── Otter's Default Easing ───
export const OTTER_EASE = 'power2.out'; // closest GSAP equivalent to cubic-bezier(0.215, 0.61, 0.355, 1)

// ─── Scroll-Triggered Fade In Up ───
// Usage: <div ref={containerRef}><div className="gsap-fade-up">...</div></div>
export function useScrollReveal(containerRef) {
  useGSAP(() => {
    const elements = containerRef.current?.querySelectorAll('.gsap-fade-up');
    if (!elements?.length) return;

    elements.forEach((el, i) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: OTTER_EASE,
        delay: i * 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: containerRef });
}

// ─── Infinite Marquee ───
// Usage: Pass a ref to the marquee track element
export function useMarquee(trackRef, { speed = 80, direction = 'left' } = {}) {
  useGSAP(() => {
    const track = trackRef.current;
    if (!track) return;

    const tl = gsap.to(track, {
      xPercent: direction === 'left' ? -100 : 100,
      repeat: -1,
      duration: speed,
      ease: 'linear',
    });

    // Pause on hover
    track.addEventListener('mouseenter', () => tl.pause());
    track.addEventListener('mouseleave', () => tl.resume());

    return () => tl.kill();
  }, { scope: trackRef });
}

// ─── Direction-Aware Marquee (reverses on scroll direction) ───
export function useScrollDirectionMarquee(trackRef, { speed = 80 } = {}) {
  useGSAP(() => {
    const track = trackRef.current;
    if (!track) return;

    const tl = gsap.to(track, {
      xPercent: -100,
      repeat: -1,
      duration: speed,
      ease: 'linear',
    });

    ScrollTrigger.create({
      trigger: track,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0,
      onUpdate: (self) => {
        tl.timeScale(self.direction === -1 ? -1 : 1);
      },
    });

    return () => tl.kill();
  }, { scope: trackRef });
}

// ─── Typewriter Effect ───
// Wraps each character in a span and animates opacity
export function useTypewriter(textRef, { stagger = 0.03, delay = 0 } = {}) {
  useGSAP(() => {
    const el = textRef.current;
    if (!el) return;

    const text = el.textContent;
    el.innerHTML = '';

    [...text].forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      el.appendChild(span);
    });

    gsap.to(el.querySelectorAll('span'), {
      opacity: 1,
      stagger,
      delay,
      ease: OTTER_EASE,
    });
  }, { scope: textRef });
}

// ─── Navbar Float on Scroll ───
export function useNavbarFloat(navRef, triggerRef) {
  useGSAP(() => {
    if (!navRef.current || !triggerRef.current) return;

    ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'bottom top',
      onEnter: () => navRef.current.classList.add('is-floating'),
      onLeaveBack: () => navRef.current.classList.remove('is-floating'),
    });
  }, { scope: navRef });
}

// ─── Tooltip Bar (appears after scroll threshold) ───
export function useTooltipBar(barRef, { threshold = 150 } = {}) {
  useGSAP(() => {
    const bar = barRef.current;
    if (!bar) return;

    ScrollTrigger.create({
      start: `${threshold}px top`,
      end: 'max',
      onEnter: () => bar.classList.add('is-visible'),
      onLeaveBack: () => bar.classList.remove('is-visible'),
    });
  }, { scope: barRef });
}
