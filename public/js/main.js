/* =====================================================================
   MAIN JS — Interactividad general
   ===================================================================== */

// Siempre inicia en el top al cargar la página
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {

  // ============== Navbar: cambia estilo al hacer scroll ==============
  const navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 50) navbar?.classList.add('scrolled');
    else navbar?.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ============== Mobile menu hamburguesa ==============
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open');
  });
  // Cerrar al hacer click en un link
  mobileMenu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });

  // ============== Gallery: navegación con flechas ==============
  const track = document.getElementById('galleryTrack');
  const prev = document.getElementById('galleryPrev');
  const next = document.getElementById('galleryNext');
  if (track) {
    const SCROLL = 344; // 320px item + 24px gap
    prev?.addEventListener('click', () => track.scrollBy({ left: -SCROLL, behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left:  SCROLL, behavior: 'smooth' }));
  }

  // ============== Drag-to-scroll para carruseles PDP ==============
  document.querySelectorAll('.pdp-formats-track, .pdp-finishes-track').forEach(track => {
    let isDown = false, startX = 0, scrollLeft = 0;
    track.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    track.addEventListener('mouseleave', () => { isDown = false; });
    track.addEventListener('mouseup',    () => { isDown = false; });
    track.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x    = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.2;
      track.scrollLeft = scrollLeft - walk;
    });
  });

  // ============== Smooth scroll para anchors ==============
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
