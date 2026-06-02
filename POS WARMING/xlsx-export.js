// xlsx-export.js
// Generates window.buildLaporanXlsx({ title, subtitle, from, to, txns, expenses })
// Produces a single sheet "Laporan" matching the reference format:
//   Row 1  : LAPORAN KEUANGAN
//   Row 2  : Warming POS · Diekspor {stamp}
//   Row 4  : PENDAPATAN — {from} — {to}
//   Row 5  : Headers (ID, Tanggal, Waktu, Item, Kategori, Qty, Harga, Total, Metode)
//   ...    : Transaction rows (one per line item)
//   ...    : SUBTOTAL PENDAPATAN (col H)
//   ...    : PENGELUARAN — {from} — {to}
//   ...    : Headers (ID, Tanggal, Kategori, Deskripsi, Jumlah)
//   ...    : Expense rows
//   ...    : SUBTOTAL PENGELUARAN (col E)
//   ...    : RINGKASAN — Total Pendapatan / Pengeluaran / Net (col D)

(function () {

  // ── CRC32 ─────────────────────────────────────────────────────────────────
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // ── ZIP (stored, no compression) ─────────────────────────────────────────
  function zipStore(entries) {
    const enc = new TextEncoder();
    const localParts = [];
    const cdParts = [];
    let offset = 0;
    for (const e of entries) {
      const nameBytes = enc.encode(e.name);
      const data = typeof e.data === "string" ? enc.encode(e.data) : e.data;
      const crc = crc32(data);
      const lh = new Uint8Array(30);
      const dv = new DataView(lh.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      localParts.push(lh, nameBytes, data);

      const cd = new Uint8Array(46);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint32(42, offset, true);
      cdParts.push(cd, nameBytes);
      offset += lh.length + nameBytes.length + data.length;
    }
    const cdSize = cdParts.reduce((a, b) => a + b.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);

    const total = offset + cdSize + eocd.length;
    const out = new Uint8Array(total);
    let p = 0;
    for (const part of [...localParts, ...cdParts, [eocd]].flat()) { out.set(part, p); p += part.length; }
    return out;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // 0-based column index → letter ('A', 'B', …)
  function colLetter(i) {
    let s = "", n = i + 1;
    while (n > 0) { s = String.fromCharCode(65 + (n - 1) % 26) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function rpNum(n) { return Math.round(Number(n) || 0); }

  // "HH:MM" → Excel time decimal (fraction of 24 h), matching reference file
  function timeToDecimal(t) {
    if (!t || typeof t !== "string") return null;
    const [hh, mm] = t.split(":").map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;
    return (hh * 60 + mm) / 1440;
  }

  // ISO date "2026-05-08" → "8 Mei 2026"
  function fmtDateID(iso) {
    if (!iso) return "";
    try {
      return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric",
      });
    } catch { return iso; }
  }

  // ── Sheet builder ─────────────────────────────────────────────────────────
  // rowSpecs: array of either null (blank row) or array of { c, v, n }
  //   c: 0-based col index, v: value, n: true if numeric
  function buildSheetXml(rowSpecs) {
    const lines = [];
    let rn = 0;
    for (const spec of rowSpecs) {
      rn++;
      if (!spec || spec.length === 0) continue;
      const cells = spec
        .filter(x => x.v != null && x.v !== "")
        .map(({ c, v, n }) => {
          const ref = `${colLetter(c)}${rn}`;
          if (n && typeof v === "number" && Number.isFinite(v))
            return `<c r="${ref}"><v>${v}</v></c>`;
          return `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
        }).join("");
      lines.push(`<row r="${rn}">${cells}</row>`);
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${lines.join("")}</sheetData></worksheet>`;
  }

  // ── .xlsx assembler (single sheet) ────────────────────────────────────────
  function toXlsxBlob(sheetName, sheetXml) {
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${esc(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

    return new Blob([zipStore([
      { name: "[Content_Types].xml",        data: contentTypes },
      { name: "_rels/.rels",                data: rootRels },
      { name: "xl/workbook.xml",            data: workbookXml },
      { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
      { name: "xl/worksheets/sheet1.xml",   data: sheetXml },
    ])], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  // ── Public API ────────────────────────────────────────────────────────────
  // Called by report.jsx → ExportDataModal
  // { title, subtitle, from, to, txns, expenses } → Blob (.xlsx)
  function buildLaporanXlsx({ title = "LAPORAN KEUANGAN", subtitle = "", from = "", to = "", txns = [], expenses = [] }) {
    const fromLabel = fmtDateID(from);
    const toLabel   = fmtDateID(to);
    const rangeStr  = from === to
      ? fromLabel
      : `${fromLabel} — ${toLabel}`;

    const s = (v) => ({ c: undefined, v, n: false }); // placeholder — not used directly
    const row = (...cells) => cells; // array of { c, v, n }
    const txt = (c, v) => ({ c, v, n: false });
    const num = (c, v) => ({ c, v: rpNum(v), n: true });
    const blank = null;

    const rows = [];

    // ── Header ──
    rows.push([ txt(0, title) ]);
    rows.push([ txt(0, subtitle) ]);
    rows.push(blank);

    // ── PENDAPATAN ──
    rows.push([ txt(0, `PENDAPATAN — ${rangeStr}`) ]);
    rows.push([
      txt(0, "ID"), txt(1, "Tanggal"), txt(2, "Waktu"),
      txt(3, "Item"), txt(4, "Kategori"),
      txt(5, "Qty"), txt(6, "Harga"), txt(7, "Total"), txt(8, "Metode"),
    ]);

    let totalPendapatan = 0;
    for (const t of txns) {
      const dec = timeToDecimal(t.time);
      const total = rpNum(t.total);
      totalPendapatan += total;
      rows.push([
        txt(0, t.id        || ""),
        txt(1, t.isoDate   || ""),
        dec != null ? { c: 2, v: dec, n: true } : txt(2, t.time || ""),
        txt(3, t.unit      || ""),
        txt(4, t.kind      || ""),
        num(5, t.qty),
        num(6, t.price),
        num(7, total),
        txt(8, t.pay       || ""),
      ]);
    }

    rows.push(blank);
    rows.push([ txt(0, "SUBTOTAL PENDAPATAN"), num(7, totalPendapatan) ]);
    rows.push(blank);

    // ── PENGELUARAN ──
    rows.push([ txt(0, `PENGELUARAN — ${rangeStr}`) ]);
    rows.push([
      txt(0, "ID"), txt(1, "Tanggal"), txt(2, "Kategori"),
      txt(3, "Deskripsi"), txt(4, "Jumlah"),
    ]);

    let totalPengeluaran = 0;
    for (const e of expenses) {
      const jumlah = rpNum(e.jumlah);
      totalPengeluaran += jumlah;
      rows.push([
        txt(0, e.id        || ""),
        txt(1, e.tanggal   || ""),
        txt(2, e.kategori  || ""),
        txt(3, e.deskripsi || ""),
        num(4, jumlah),
      ]);
    }

    rows.push(blank);
    rows.push([ txt(0, "SUBTOTAL PENGELUARAN"), num(4, totalPengeluaran) ]);
    rows.push(blank);

    // ── RINGKASAN ──
    const net = totalPendapatan - totalPengeluaran;
    rows.push([ txt(0, "RINGKASAN") ]);
    rows.push([ txt(0, "Total Pendapatan"),              num(3, totalPendapatan)  ]);
    rows.push([ txt(0, "Total Pengeluaran"),             num(3, totalPengeluaran) ]);
    rows.push([ txt(0, "Net (Pendapatan − Pengeluaran)"), num(3, net)        ]);

    return toXlsxBlob("Laporan", buildSheetXml(rows));
  }

  window.buildLaporanXlsx = buildLaporanXlsx;
})();
