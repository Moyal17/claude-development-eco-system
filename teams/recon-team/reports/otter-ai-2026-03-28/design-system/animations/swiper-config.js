/**
 * OTTER.AI DESIGN SYSTEM — Swiper.js Configuration Presets
 *
 * Otter.ai uses Swiper for:
 * - Testimonial carousel (autoplay, fade, pagination)
 * - Feature image galleries (navigation arrows, responsive slides)
 * - Use case cards (multiple slides per view)
 */

// ─── Testimonial Carousel (landing page) ───
export const testimonialSwiperConfig = {
  slidesPerView: 1,
  spaceBetween: 24,
  loop: true,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  effect: 'fade',
  fadeEffect: {
    crossFade: true,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    renderBullet: (index, className) =>
      `<span class="${className}"><span class="pagination-fill"></span></span>`,
  },
  breakpoints: {
    768: {
      slidesPerView: 1,
    },
  },
};

// ─── Feature Image Gallery (sales-agent, education-agent pages) ───
export const featureGallerySwiperConfig = {
  slidesPerView: 1,
  spaceBetween: 16,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  autoplay: {
    delay: 5000,
    disableOnInteraction: true,
  },
};

// ─── Use Case Cards (landing page "There's an AI Notetaker for that") ───
export const useCaseSwiperConfig = {
  slidesPerView: 1.2,
  spaceBetween: 16,
  breakpoints: {
    480: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 24,
    },
    992: {
      slidesPerView: 4,
      spaceBetween: 24,
    },
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
};

// ─── Swiper CSS imports needed ───
// Add to your main CSS or entry point:
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';
// import 'swiper/css/effect-fade';

// ─── Custom Swiper pagination styles (Otter's timed fill) ───
export const swiperPaginationCSS = `
  .swiper-pagination-bullet {
    width: 32px;
    height: 4px;
    border-radius: 2px;
    background: var(--color-gray-200, #E7EAEE);
    opacity: 0.4;
    transition: opacity 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
    position: relative;
    overflow: hidden;
  }

  .swiper-pagination-bullet-active {
    opacity: 1;
  }

  .swiper-pagination-bullet-active .pagination-fill {
    position: absolute;
    inset: 0;
    background: var(--color-brand-blue, #144fff);
    border-radius: 2px;
    animation: slider-fill 5s linear forwards;
  }

  @keyframes slider-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }
`;
