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
});
