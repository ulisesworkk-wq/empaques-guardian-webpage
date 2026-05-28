/* =====================================================================
   PROCESO — cambia imagen según el paso visible en pantalla
   ===================================================================== */

(function () {
  'use strict';

  const steps = document.querySelectorAll('.process-step');
  const imgs  = document.querySelectorAll('.proc-img');

  if (!steps.length || !imgs.length) return;

  function showImg(idx) {
    imgs.forEach((img, i) => img.classList.toggle('proc-img--on', i === idx));
  }

  // Arranca con imagen 0 visible
  showImg(0);

  // IntersectionObserver: cuando un paso cruza el centro de la pantalla
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.stepIndex, 10);
        if (!isNaN(idx)) showImg(idx);
      }
    });
  }, {
    threshold: 0.5,          // paso visible al 50 %
    rootMargin: '-20% 0px -20% 0px'  // franja central de pantalla
  });

  steps.forEach(step => io.observe(step));

})();
