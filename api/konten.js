// ============================================================
// API SDN 2 Klambu — Vercel Serverless Functions
// Penyimpanan: file JSON di repo GitHub (Contents API)
//   - data/konten.json   : seluruh konten situs
//   - data/pendaftar.json: data PPDB (diisi publik, dibaca admin)
//   - assets/uploads/    : foto yang diunggah admin
// Autentikasi admin: header X-Admin-Password vs env ADMIN_PASSWORD
// Kode rahasia TIDAK pernah ditulis di front-end.
// ============================================================
const REPO = process.env.GITHUB_REPO || "muhammadzaidun32-hub/sdn2klambu";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const KONTEN_PATH = "data/konten.json";
const PENDAFTAR_PATH = "data/pendaftar.json";
const UPLOAD_DIR = "assets/uploads";

function gh(path, opts = {}) {
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
}

async function readFile(path) {
  const res = await gh(`${path}?ref=${BRANCH}&t=${Date.now()}`);
  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) throw new Error(`GitHub read gagal (${res.status})`);
  const json = await res.json();
  return { data: JSON.parse(Buffer.from(json.content, "base64").toString("utf-8")), sha: json.sha };
}

async function writeFile(path, data, sha, message) {
  const body = {
    message,
    content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };
  const res = await gh(path, { method: "PUT", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub write gagal (${res.status})`);
}

function authOk(req) {
  return ADMIN_PASSWORD && req.headers["x-admin-password"] === ADMIN_PASSWORD;
}

async function readBody(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

// batas ukuran body upload ~4.5MB (base64). Kompres di sisi admin.
function tooLarge(str) { return str && str.length > 6_000_000; }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();

  const url = new URL(req.url, "http://x");
  const q = url.searchParams;

  try {
    // ============================================================
    // GET — publik
    // ============================================================
    if (req.method === "GET") {
      if (q.get("file") === "pendaftar") {
        // daftar pendaftar: hanya admin
        if (!authOk(req)) return res.status(401).json({ error: "Password admin salah." });
        const { data } = await readFile(PENDAFTAR_PATH);
        return res.status(200).json({ items: (data && data.items) || [] });
      }
      // default: konten
      const { data } = await readFile(KONTEN_PATH);
      return res.status(200).json(data || {});
    }

    const body = await readBody(req);

    // ============================================================
    // POST — aksi
    // ============================================================
    if (req.method === "POST") {
      const act = q.get("act");

      // ---- daftar PPDB (publik) ----
      if (act === "daftar") {
        if (tooLarge(JSON.stringify(body))) return res.status(413).json({ error: "Data terlalu besar." });
        const { data, sha } = await readFile(PENDAFTAR_PATH);
        const items = (data && data.items) || [];
        const nomor = "PPDB-" + new Date().getFullYear() + "-" + String(items.length + 1).padStart(4, "0");
        const entry = { ...body, nomor, status: "Menunggu verifikasi", waktu: new Date().toISOString() };
        items.push(entry);
        await writeFile(PENDAFTAR_PATH, { items }, sha, `PPDB: pendaftar baru ${nomor}`);
        return res.status(200).json({ ok: true, nomor });
      }

      // ---- cek status (publik, by nomor + tanggal lahir) ----
      if (act === "cek") {
        const { data } = await readFile(PENDAFTAR_PATH);
        const items = (data && data.items) || [];
        const p = items.find(x => x.nomor === body.nomor && x.ttl === body.ttl);
        if (!p) return res.status(404).json({ error: "Data tidak ditemukan. Periksa nomor & tanggal lahir." });
        return res.status(200).json({ ok: true, p });
      }

      // ---- upload gambar (admin) ----
      if (act === "upload") {
        if (!authOk(req)) return res.status(401).json({ error: "Password admin salah." });
        const { name, dataUrl } = body || {};
        if (!name || !dataUrl) return res.status(400).json({ error: "name & dataUrl wajib." });
        const name2 = decodeURIComponent(Buffer.from(name, "base64").toString("utf-8"));
        const content = dataUrl.split(",")[1];
        if (tooLarge(dataUrl)) return res.status(413).json({ error: "Foto terlalu besar (maks ±3MB). Kompres dulu." });
        const ext = (name2.match(/\.(png|jpe?g|webp|gif|svg)$/i) || [".png"])[0].toLowerCase();
        const path = `${UPLOAD_DIR}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const gres = await gh(path, {
          method: "PUT",
          body: JSON.stringify({ message: `Upload foto via admin`, content, branch: BRANCH }),
        });
        if (!gres.ok) throw new Error(`Upload gagal (${gres.status})`);
        const j = await gres.json();
        return res.status(200).json({ url: j.content.download_url });
      }

      // ---- simpan konten (admin) ----
      if (act === "simpan") {
        if (!authOk(req)) return res.status(401).json({ error: "Password admin salah." });
        if (tooLarge(JSON.stringify(body.data))) return res.status(413).json({ error: "Konten terlalu besar." });
        const { sha } = await readFile(KONTEN_PATH);
        await writeFile(KONTEN_PATH, body.data, sha, `Update konten via admin (${new Date().toISOString()})`);
        return res.status(200).json({ ok: true });
      }

      // ---- update status pendaftar (admin) ----
      if (act === "status") {
        if (!authOk(req)) return res.status(401).json({ error: "Password admin salah." });
        const { data, sha } = await readFile(PENDAFTAR_PATH);
        const items = (data && data.items) || [];
        const p = items.find(x => x.nomor === body.nomor);
        if (!p) return res.status(404).json({ error: "Nomor tidak ditemukan." });
        p.status = body.status;
        await writeFile(PENDAFTAR_PATH, { items }, sha, `PPDB: status ${p.nomor} -> ${body.status}`);
        return res.status(200).json({ ok: true });
      }

      // ---- hapus pendaftar (admin) ----
      if (act === "hapus-pendaftar") {
        if (!authOk(req)) return res.status(401).json({ error: "Password admin salah." });
        const { data, sha } = await readFile(PENDAFTAR_PATH);
        const items = ((data && data.items) || []).filter(x => x.nomor !== body.nomor);
        await writeFile(PENDAFTAR_PATH, { items }, sha, `PPDB: hapus ${body.nomor}`);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: "act tidak dikenal." });
    }

    return res.status(405).json({ error: "Metode tidak didukung." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
