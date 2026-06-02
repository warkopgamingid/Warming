// db-export.js
// ----------------------------------------------------------------------------
// Exports POS transaction history into a DB-ready structure:
//   - Transactions sheet
//   - TransactionItems sheet
//   - Payments sheet
//
// Two formats:
//   window.dbExport.xlsx(rows)  → .xlsx with 3 sheets (multi-sheet workbook)
//   window.dbExport.csv(rows)   → .zip containing 3 .csv files
//
// If the browser cannot build the xlsx for any reason (e.g. no Blob/URL API,
// XML generation throws), xlsx() automatically falls back to the CSV-zip.
//
// Data source: each row in the POS store represents ONE cart line, all rows
// from the same checkout share the same `trxId`. We group by trxId to produce
// one Transactions / Payments record + N TransactionItems records.
// ----------------------------------------------------------------------------

(function () {
  // ---------- CRC32 (for ZIP entries) ----------
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

  // ---------- ZIP (stored, no compression) ----------
  function zipStore(entries) {
    const enc = new TextEncoder();
    const localParts = [];
    const cdParts = [];
    let offset = 0;
    for (const e of entries) {
      const nameBytes = enc.encode(e.name);
      const data = typeof e.data === "string" ? enc.encode(e.data) : e.data;
      const crc = crc32(data);
      const localHeader = new Uint8Array(30);
      const dv = new DataView(localHeader.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 0, true);
      dv.setUint16(8, 0, true);
      dv.setUint16(10, 0, true);
      dv.setUint16(12, 0x21, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      dv.setUint16(28, 0, true);
      localParts.push(localHeader, nameBytes, data);

      const cd = new Uint8Array(46);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      cdParts.push(cd, nameBytes);
      offset += localHeader.length + nameBytes.length + data.length;
    }
    const cdSize = cdParts.reduce((a, b) => a + b.length, 0);
    const cdOffset = offset;
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, cdOffset, true);

    const total = offset + cdSize + eocd.length;
    const out = new Uint8Array(total);
    let p = 0;
    for (const part of localParts) { out.set(part, p); p += part.length; }
    for (const part of cdParts)    { out.set(part, p); p += part.length; }
    out.set(eocd, p);
    return out;
  }

  // ---------- helpers ----------
  function escXml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function colLetter(i) {
    let s = ""; let n = i + 1;
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }
  function pad(n, w) { return String(n).padStart(w, "0"); }

  // POS stores "time" as "HH:MM"; we append :00 to get full HH:mm:ss
  function fmtDatetime(isoDate, time) {
    const t = (time && /^\d{2}:\d{2}$/.test(time)) ? time : "00:00";
    return `${isoDate} ${t}:00`;
  }

  // ---------- Column definitions (DB-import contract) ----------
  const TXN_COLS = [
    "transaction_id", "transaction_datetime", "cashier_name", "customer_name",
    "subtotal", "discount", "tax", "grand_total",
    "paid_amount", "change_amount", "status", "notes",
  ];
  const ITEM_COLS = [
    "transaction_id", "item_id", "item_name", "category",
    "qty", "unit_price", "line_discount", "line_total",
  ];
  const PAY_COLS = [
    "payment_id", "transaction_id", "payment_method",
    "payment_amount", "payment_datetime", "reference_no", "notes",
  ];

  // ---------- Group rows by trxId ----------
  // Returns { transactions, items, payments } — three tabular arrays-of-objects
  // ready for sheet writing. transaction_id + payment_id are guaranteed unique.
  function buildTables(txnRows) {
    // Preserve insertion order; group lines belonging to the same checkout.
    const byTrx = new Map();
    for (const r of txnRows) {
      const key = r.trxId || r.id;
      if (!byTrx.has(key)) byTrx.set(key, []);
      byTrx.get(key).push(r);
    }

    const transactions = [];
    const items = [];
    const payments = [];
    const seenTrx = new Set();
    const seenPay = new Set();
    let payCounter = 0;

    for (const [trxId, rows] of byTrx) {
      // Make absolutely sure transaction_id is unique. Duplicates would only
      // happen if the store ever held two checkouts with the same id; we
      // suffix to disambiguate.
      let uniqTrx = trxId;
      let bump = 1;
      while (seenTrx.has(uniqTrx)) uniqTrx = `${trxId}-${++bump}`;
      seenTrx.add(uniqTrx);

      const first = rows[0];
      const grand = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
      const dt = fmtDatetime(first.isoDate, first.time);
      const status = first.status || "Berhasil";

      transactions.push({
        transaction_id:        uniqTrx,
        transaction_datetime:  dt,
        cashier_name:          first.cashier || "Kasir",
        customer_name:         (first.customer && first.customer !== "—") ? first.customer : "",
        subtotal:              grand,
        discount:              0,
        tax:                   0,
        grand_total:           grand,
        paid_amount:           status === "Berhasil" ? grand : 0,
        change_amount:         0,
        status:                status,
        notes:                 "",
      });

      rows.forEach((r, i) => {
        items.push({
          transaction_id: uniqTrx,
          item_id:        `${uniqTrx}-${pad(i + 1, 3)}`,
          item_name:      r.unit || "",
          category:       r.kind || "",
          qty:            Number(r.qty) || 0,
          unit_price:     Number(r.price) || 0,
          line_discount:  0,
          line_total:     Number(r.total) || 0,
        });
      });

      // One payment record per transaction (POS currently supports a single
      // tender per checkout). payment_id is globally unique.
      payCounter++;
      let payId = `PAY-${pad(payCounter, 4)}`;
      while (seenPay.has(payId)) payId = `PAY-${pad(++payCounter, 4)}`;
      seenPay.add(payId);

      payments.push({
        payment_id:        payId,
        transaction_id:    uniqTrx,
        payment_method:    first.pay || "",
        payment_amount:    status === "Berhasil" ? grand : 0,
        payment_datetime:  dt,
        reference_no:      "",
        notes:             "",
      });
    }

    return { transactions, items, payments };
  }

  // ---------- CSV ----------
  function csvField(v) {
    if (v == null) return "";
    const s = String(v);
    // RFC-4180 quoting
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toCsv(headers, rows) {
    const out = [headers.join(",")];
    for (const r of rows) out.push(headers.map(h => csvField(r[h])).join(","));
    return out.join("\r\n");
  }

  // ---------- XLSX (multi-sheet, no styling — pure data) ----------
  function buildSheetXml(headers, rows) {
    const lines = [];
    // Header row (always strings)
    const headerCells = headers
      .map((h, i) => `<c r="${colLetter(i)}1" t="inlineStr"><is><t>${escXml(h)}</t></is></c>`)
      .join("");
    lines.push(`<row r="1">${headerCells}</row>`);

    rows.forEach((row, ri) => {
      const rowNum = ri + 2;
      const cells = headers.map((h, ci) => {
        const v = row[h];
        const ref = `${colLetter(ci)}${rowNum}`;
        if (v == null || v === "") return "";
        if (typeof v === "number" && Number.isFinite(v)) {
          return `<c r="${ref}"><v>${v}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr"><is><t>${escXml(v)}</t></is></c>`;
      }).join("");
      lines.push(`<row r="${rowNum}">${cells}</row>`);
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${lines.join("")}</sheetData>
</worksheet>`;
  }

  function buildXlsx(sheets) {
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`;

    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
${sheets.map((s, i) => `<sheet name="${escXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("\n")}
</sheets>
</workbook>`;

    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
</Relationships>`;

    const entries = [
      { name: "[Content_Types].xml",        data: contentTypes },
      { name: "_rels/.rels",                data: rootRels },
      { name: "xl/workbook.xml",            data: workbookXml },
      { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
    ];
    sheets.forEach((s, i) => {
      entries.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: buildSheetXml(s.headers, s.rows) });
    });

    return new Blob([zipStore(entries)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  // ---------- Download trigger ----------
  function downloadBlob(blob, filename) {
    if (typeof URL === "undefined" || !URL.createObjectURL) {
      throw new Error("Browser does not support Blob downloads.");
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function todayTag() {
    const d = new Date();
    return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}-${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}`;
  }

  // ---------- Public API ----------
  function pickRows(input) {
    // Accepts either an array of txn rows OR nothing (reads from POS store).
    if (Array.isArray(input)) return input;
    try {
      const raw = localStorage.getItem("warming-pos.transactions.v1");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function exportXlsx(input) {
    const rows = pickRows(input);
    if (!rows.length) { alert("Belum ada transaksi untuk diekspor."); return false; }
    try {
      const tables = buildTables(rows);
      const blob = buildXlsx([
        { name: "Transactions",     headers: TXN_COLS,  rows: tables.transactions },
        { name: "TransactionItems", headers: ITEM_COLS, rows: tables.items },
        { name: "Payments",         headers: PAY_COLS,  rows: tables.payments },
      ]);
      downloadBlob(blob, `pos-export-${todayTag()}.xlsx`);
      return true;
    } catch (err) {
      console.warn("[db-export] xlsx failed, falling back to CSV zip:", err);
      try {
        exportCsv(rows);
        alert("Browser ini tidak mendukung Excel export. File diekspor sebagai CSV (.zip).");
      } catch (e2) {
        alert("Export gagal: " + (e2 && e2.message ? e2.message : e2));
      }
      return false;
    }
  }

  function exportCsv(input) {
    const rows = pickRows(input);
    if (!rows.length) { alert("Belum ada transaksi untuk diekspor."); return false; }
    const tables = buildTables(rows);
    const entries = [
      { name: "Transactions.csv",     data: toCsv(TXN_COLS,  tables.transactions) },
      { name: "TransactionItems.csv", data: toCsv(ITEM_COLS, tables.items) },
      { name: "Payments.csv",         data: toCsv(PAY_COLS,  tables.payments) },
    ];
    const blob = new Blob([zipStore(entries)], { type: "application/zip" });
    downloadBlob(blob, `pos-export-${todayTag()}-csv.zip`);
    return true;
  }

  window.dbExport = {
    xlsx: exportXlsx,
    csv: exportCsv,
    buildTables,         // exposed for tests / future re-use
    columns: { TXN_COLS, ITEM_COLS, PAY_COLS },
  };
})();
