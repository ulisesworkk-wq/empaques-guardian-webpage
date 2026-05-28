/* =====================================================================
   ANIMACIONES — GSAP + ScrollTrigger + IntersectionObserver
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ============== Page loader ==============
  window.addEventListener('load', () => {
    const _hash = location.hash;
    if (!_hash) window.scrollTo(0, 0);
    setTimeout(() => {
      if (!_hash) window.scrollTo(0, 0);
      document.getElementById('pageLoader')?.classList.add('hide');
      setTimeout(() => {
        if (!_hash) {
          window.scrollTo(0, 0);
        } else {
          const el = document.querySelector(_hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 80);
    }, 600);
  });

  // ============== Reveal on scroll (IntersectionObserver) ==============
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-scale, .p2-reveal, .pdp-reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => io.observe(el));

  // ============== GSAP scroll-driven ==============
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Hero image parallax
    gsap.to('.hero-image-wrapper', {
      yPercent: -15,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end:   'bottom top',
        scrub: 1
      }
    });

    // Section titles slide in
    gsap.utils.toArray('.section-title, .section-title-light').forEach(title => {
      gsap.from(title, {
        y: 60, opacity: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: title, start: 'top 85%' }
      });
    });

    // Gallery mask text reveal
    gsap.utils.toArray('.gallery-mask-text span').forEach((span, i) => {
      gsap.from(span, {
        y: 80, opacity: 0, duration: 1, delay: i * 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.gallery-mask-block', start: 'top 80%' }
      });
    });

    // ============== Proceso: activar cada paso + imagen con scroll ==============
    const processSteps = document.querySelectorAll('.process-step');
    const procImgs     = document.querySelectorAll('.proc-img');

    function setActiveStep(index) {
      processSteps.forEach(s => s.classList.remove('is-active'));
      procImgs.forEach(img => img.classList.remove('proc-img--on'));
      if (processSteps[index]) processSteps[index].classList.add('is-active');
      if (procImgs[index])     procImgs[index].classList.add('proc-img--on');
    }

    if (processSteps.length > 0) {
      setActiveStep(0);

      processSteps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 60%',
          end:   'bottom 40%',
          onEnter:     () => setActiveStep(i),
          onEnterBack: () => setActiveStep(i),
        });
      });
    }

    // Footer logo
    gsap.from('.footer-brand-logo', {
      y: 60, opacity: 0, duration: 1.4, ease: 'power4.out',
      scrollTrigger: { trigger: '.site-footer', start: 'top 85%' }
    });
  }
});
