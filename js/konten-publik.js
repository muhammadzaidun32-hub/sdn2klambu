// ============================================================
// Loader konten publik SDN 2 Klambu
// - render data/konten.json ke elemen[data-bind*]
// - pengaturan: PPDB ON/OFF, tombol WhatsApp
// ============================================================
(function () {
  const GRADS = {
    1: "linear-gradient(135deg,#57BB85,#1B5E43)",
    2: "linear-gradient(135deg,#F2B33D,#E08E0B)",
    3: "linear-gradient(135deg,#3E9E6C,#134B33)",
    4: "linear-gradient(135deg,#7FC29B,#2E7D57)",
    5: "linear-gradient(135deg,#E08E0B,#B4771B)",
    6: "linear-gradient(135deg,#2E8B57,#257A54)",
  };
  let DATA = {};

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function fmtTanggal(iso) {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return iso; }
  }
  function get(obj, path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj); }

  // ---------- renderer kartu ----------
  function thumbFoto(foto, emoji, grad, tinggi) {
    const d = el("div", "news-thumb");
    if (foto) {
      const img = el("img"); img.src = foto; img.alt = ""; img.loading = "lazy";
      d.append(img);
    } else {
      d.style.cssText = `display:grid;place-items:center;font-size:${tinggi || 3.4}rem`;
      if (grad) d.style.background = GRADS[grad] || GRADS[1];
      d.textContent = emoji || "📰";
    }
    return d;
  }

  function kartuBerita(b) {
    const c = el("article", "news-card");
    c.append(thumbFoto(b.foto, b.emoji, b.grad));
    const body = el("div", "news-body");
    body.append(
      el("span", "news-cat", (b.kategori || "").toUpperCase()),
      el("h3", null, b.judul),
      el("p", null, b.isi),
      el("span", "tag", fmtTanggal(b.tanggal))
    );
    c.append(body);
    return c;
  }

  function kartuGaleri(g) {
    const b = el("button", "gal-item"); b.type = "button";
    const wrap = thumbFoto(g.foto, g.emoji, g.grad);
    wrap.classList.add("gal-ph");
    if (!g.foto) wrap.classList.add("gal-grad-" + (g.grad || 1));
    b.append(wrap, el("span", "gal-cap", g.judul));
    b.addEventListener("click", () => {
      const lb = document.getElementById("lb");
      if (!lb) return;
      const em = document.getElementById("lb-emoji");
      const big = document.getElementById("lb-img");
      // jika foto asli: tampilkan <img>, else emoji
      if (g.foto) {
        em.style.display = "none";
        big.style.display = "block";
        big.src = g.foto;
      } else {
        big.style.display = "none";
        em.style.display = "block";
        em.textContent = g.emoji || "📷";
      }
      document.getElementById("lb-title").textContent = g.judul || "";
      document.getElementById("lb-desc").textContent = g.deskripsi || "";
      lb.classList.add("open");
    });
    return b;
  }

  function kartuGuru(g) {
    const c = el("div", "card center");
    const av = el("div", "avatar-ph");
    av.style.cssText = "margin:0 auto 12px;overflow:hidden";
    if (g.foto) {
      const img = el("img"); img.src = g.foto; img.alt = g.nama || "Foto";
      av.replaceChildren(img);
    } else {
      av.textContent = g.inisial || (g.nama || "?").slice(0, 1).toUpperCase();
    }
    c.append(av, el("h3", null, g.nama || "—"), el("p", null, g.peran || ""));
    c.querySelector("h3").style.fontSize = "1rem";
    c.querySelector("p").style.cssText = "font-size:.84rem;color:var(--mute);margin:0";
    return c;
  }

  function kartuProgram(p) {
    const c = el("div", "card");
    if (p.foto) {
      const img = el("img"); img.src = p.foto; img.alt = p.judul || "";
      img.style.cssText = "border-radius:12px;margin-bottom:12px;aspect-ratio:16/10;object-fit:cover;width:100%";
      c.append(img);
    } else {
      c.append(el("div", "ico", p.ikon || "★"));
    }
    c.append(el("h3", null, p.judul), el("p", null, p.teks));
    if (p.tanda) {
      const t = el("p", null, p.tanda);
      t.style.cssText = "margin-top:8px;font-size:.82rem;color:var(--emas-600);font-weight:700";
      c.append(t);
    }
    return c;
  }

  function kartuEkskul(x) {
    const c = el("div", "card");
    if (x.foto) {
      const img = el("img"); img.src = x.foto; img.alt = x.judul || "";
      img.style.cssText = "border-radius:12px;margin-bottom:12px;aspect-ratio:16/10;object-fit:cover;width:100%";
      c.append(img);
    } else {
      c.append(el("div", "ico", x.ikon || "★"));
    }
    c.append(el("h3", null, x.judul), el("p", null, x.teks));
    return c;
  }

  function liSimple(t) { return el("li", null, t); }
  function liStat(s) {
    const d = el("div", "stat");
    d.append(el("b", null, s.nilai), el("span", null, s.label || ""));
    return d;
  }
  function kartuMisi(t, i) {
    const c = el("div", "card");
    const b = el("b", null, (i + 1) + ". "); b.style.color = "var(--hijau-700)";
    c.append(b, t); return c;
  }
  function liJadwalPPDB(j) {
    const li = el("li");
    li.append(el("b", null, j.nilai), " — " + (j.label || ""));
    return li;
  }
  function liFaq(f) {
    const d = el("details");
    d.append(el("summary", null, f.q || ""), el("div", "faq-body", f.a || ""));
    return d;
  }
  function itemUnduhan(u) {
    const c = el("div", "card");
    c.style.cssText = "display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap";
    const kiri = el("div");
    kiri.append(el("h3", null, u.judul || "—"), el("p", null, u.deskripsi || ""));
    const a = el("a", "btn btn-gold", "⬇ Unduh");
    a.style.cssText = "background:var(--hijau-800);color:#fff";
    if (u.url) { a.href = u.url; a.target = "_blank"; a.rel = "noopener"; }
    else { a.href = "#"; a.onclick = e => e.preventDefault(); a.title = "Link belum diisi admin"; }
    c.append(kiri, a);
    return c;
  }

  const RENDERERS = {
    berita: kartuBerita, galeri: kartuGaleri, guru: kartuGuru,
    program: kartuProgram, ekskul: kartuEkskul, statistik: liStat,
    "misi-list": kartuMisi,
    "ppdb.jadwal": liJadwalPPDB, "ppdb.dokumen": liSimple, "ppdb.faq": liFaq,
    unduhan: itemUnduhan,
    "kalender.ganjil": liSimple, "kalender.genap": liSimple, "kalender.libur": liSimple,
    "kalender-sekolah": kalenderRow,
  };
  function kalenderRow(k) {
    const tr = el("tr");
    const td1 = el("td", null, k.tanggal || "");
    td1.style.cssText = "padding:10px 16px;white-space:nowrap;font-weight:700";
    const td2 = el("td", null, k.kegiatan || "");
    td2.style.cssText = "padding:10px 16px";
    tr.append(td1, td2);
    return tr;
  }

  function renderArray(nama, items, container) {
    container.replaceChildren();
    const r = RENDERERS[nama];
    if (!r) return;
    items.forEach((item, i) => container.append(r(item, i)));
  }

  function isiText(path, value) {
    document.querySelectorAll(`[data-bind="${path}"]`).forEach(n => (n.textContent = value));
  }
  function isiImg(path, value) {
    document.querySelectorAll(`[data-bind-img="${path}"]`).forEach(n => {
      if (value) {
        n.src = value; n.style.display = "";
        const f = n.parentElement.querySelector(".foto-fallback");
        if (f) f.style.display = "none";
      } else n.style.display = "none";
    });
  }
  function isiHtml(path, html) {
    document.querySelectorAll(`[data-bind-html="${path}"]`).forEach(n => (n.innerHTML = html));
  }

  function terapkanPengaturan() {
    const s = DATA.pengaturan || {};
    // PPDB ON/OFF
    const ppdbOn = s.ppdbAktif !== false;
    document.querySelectorAll("[data-ppdb-gate]").forEach(n => (n.style.display = ppdbOn ? "" : "none"));
    document.querySelectorAll("[data-ppdb-tutup]").forEach(n => (n.style.display = ppdbOn ? "none" : ""));
    // tombol PPDB nav ikut ON/OFF
    document.querySelectorAll("a.btn-ppdb").forEach(a => (a.style.display = ppdbOn ? "" : "none"));
    // WhatsApp
    const waOn = s.waAktif && s.waNomor;
    let fab = document.getElementById("wa-fab");
    if (waOn) {
      if (!fab) {
        fab = document.createElement("a");
        fab.id = "wa-fab";
        fab.target = "_blank";
        fab.rel = "noopener";
        fab.setAttribute("aria-label", "Chat WhatsApp");
        fab.style.cssText = "position:fixed;bottom:18px;right:18px;z-index:80;display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;font-weight:800;padding:12px 16px;border-radius:999px;box-shadow:0 10px 26px rgba(0,0,0,.28);text-decoration:none;font-size:.92rem";
        fab.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.06c-.25.7-1.45 1.34-2 1.38-.55.05-1.05.24-3.52-.73-2.98-1.17-4.85-4.26-5-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37h.56c.18 0 .42-.07.65.5.24.59.81 2.02.88 2.16.07.15.12.32.02.51-.1.2-.15.32-.29.5l-.44.51c-.15.15-.3.31-.13.61.17.3.75 1.24 1.61 2.01 1.1.98 2.03 1.29 2.33 1.44.3.15.47.12.65-.08.17-.2.75-.87.94-1.17.2-.3.4-.25.67-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.35.07.12.07.72-.18 1.42Z"/></svg> Chat WhatsApp';
      }
      fab.href = `https://wa.me/${String(s.waNomor).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(s.waTeks || "Assalamualaikum, saya ingin bertanya.")}`;
      if (!fab.isConnected) document.body.append(fab);
    } else if (fab) fab.remove();
  }

  async function muat() {
    try {
      const res = await fetch("data/konten.json?t=" + Date.now());
      DATA = await res.json();
    } catch { return; }

    // teks tunggal
    ["visi", "sejarah", "ppdb.tajuk", "ppdb.judul", "ppdb.sub",
     "kepsek.nama", "kepsek.jabatan", "kepsek.sambutan1", "kepsek.sambutan2", "kepsek.kutipan",
     "kontak.alamat", "kontak.email", "kontak.jam",
     "pengaturan.tahunPelajaran"].forEach(p => {
      const v = get(DATA, p);
      if (typeof v === "string") isiText(p, v);
    });

    // profilTeks: array 2 paragraf
    (DATA.profilTeks || []).forEach((t, i) => isiText(`profilTeks.${i}`, t));
    isiImg("kepsek.foto", get(DATA, "kepsek.foto"));

    // array utama
    ["program", "guru", "ekskul", "berita", "galeri", "statistik", "unduhan"].forEach(n => {
      const items = get(DATA, n);
      if (Array.isArray(items)) {
        const cont = document.querySelector(`[data-bind-container="${n}"]`);
        if (cont) renderArray(n, items, cont);
      }
    });

    // ppdb sub-array
    const ppdb = DATA.ppdb || {};
    ["alur", "jadwal", "dokumen", "faq"].forEach(n => {
      const items = ppdb[n];
      if (Array.isArray(items)) {
        const cont = document.querySelector(`[data-bind-container="ppdb.${n}"]`);
        if (cont) renderArray("ppdb." + n, items, cont);
      }
    });

    // misi (kartu bernomor) & kalender
    if (Array.isArray(DATA.misi)) {
      const cont = document.querySelector('[data-bind-container="misi-list"]');
      if (cont) renderArray("misi-list", DATA.misi, cont);
    }
    ["ganjil", "genap", "libur"].forEach(k => {
      if (Array.isArray((DATA.kalender || {})[k])) {
        const cont = document.querySelector(`[data-bind-container="kalender.${k}"]`);
        if (cont) renderArray("kalender." + k, DATA.kalender[k], cont);
      }
    });
    if (Array.isArray(DATA.kalenderSekolah)) {
      const tbody = document.querySelector('[data-bind-container="kalender-sekolah"]');
      if (tbody) renderArray("kalender-sekolah", DATA.kalenderSekolah, tbody);
    }

    terapkanPengaturan();
    document.dispatchEvent(new CustomEvent("konten:muat", { detail: DATA }));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", muat);
  else muat();
})();
