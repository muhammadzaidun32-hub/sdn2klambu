/* ====== JS bersama: menu mobile + tahun + util ====== */
document.addEventListener('DOMContentLoaded', () => {
  // Menu mobile
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    // tutup saat klik link
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
    }));
  }

  // Tahun otomatis di footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ======== Hero slider (beranda) ========
  const slider = document.getElementById('hero-slider');
  if (slider) {
    const track = slider.querySelector('.hs-track');
    const dotsWrap = slider.querySelector('#hs-dots');
    const slides = track ? [...track.querySelectorAll('img')] : [];
    let idx = 0, timer = null;

    if (track && slides.length > 1) {
      // buat titik navigasi sesuai jumlah slide
      slides.forEach((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'hs-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Ke slide ' + (i + 1));
        d.addEventListener('click', () => { keSlide(i); restart(); });
        dotsWrap.append(d);
      });

      const keSlide = (i) => {
        idx = (i + slides.length) % slides.length;
        track.style.transform = `translateX(-${idx * 100}%)`;
        dotsWrap.querySelectorAll('.hs-dot').forEach((d, k) => d.classList.toggle('active', k === idx));
      };

      document.getElementById('hs-prev')?.addEventListener('click', () => { keSlide(idx - 1); restart(); });
      document.getElementById('hs-next')?.addEventListener('click', () => { keSlide(idx + 1); restart(); });

      // autoplay 4 detik
      const mulai = () => { timer = setInterval(() => keSlide(idx + 1), 4000); };
      const berhenti = () => clearInterval(timer);
      const restart = () => { berhenti(); mulai(); };
      mulai();
      // jeda autoplay saat kursor di atas slider
      slider.addEventListener('mouseenter', berhenti);
      slider.addEventListener('mouseleave', mulai);
      // sentuhan HP: geser
      let sx = null;
      slider.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) { keSlide(dx < 0 ? idx + 1 : idx - 1); restart(); }
        sx = null;
      }, { passive: true });
    }
  }
});
