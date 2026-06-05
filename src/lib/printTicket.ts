type SlipSelection = {
  Outcome?: {
    name?: string;
    Market?: {
      name?: string;
      Fixture?: {
        startsAt?: string;
        League?: { name?: string };
        homeTeam?: { name?: string };
        awayTeam?: { name?: string };
      };
    };
  };
  oddsAtPlacement?: string | number;
  snapshot?: any;
};

type SlipForPrint = {
  id: string;
  shortCode?: string | null;
  printCopy?: boolean;
  totalOdds?: string | number | null;
  stake?: string | number | null;
  potentialPayout?: string | number | null;
  placedAt?: string | null;
  BetSelections?: SlipSelection[];
};

import JsBarcode from "jsbarcode";

function escapeHtml(v: string) {
  return v.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#039;";
      default: return c;
    }
  });
}

function formatDateTime(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function printKingsBetSlip(slip: SlipForPrint) {
  const selections = slip.BetSelections || [];
  const getSelectionOdds = (s: SlipSelection) => {
    const raw = Number(s.oddsAtPlacement || s?.snapshot?.outcome?.displayOdds || s?.snapshot?.outcome?.odds || 1);
    return Number.isFinite(raw) && raw > 0 ? Number(raw.toFixed(2)) : 1;
  };
  const calculatedTotalOdds = selections.reduce((p, s) => p * getSelectionOdds(s), 1);
  const totalOdds = Number(slip.totalOdds || calculatedTotalOdds);
  const stake = Number(slip.stake || 0) || 0;
  const possibleWinning = slip.potentialPayout != null ? Number(slip.potentialPayout) : stake * totalOdds;
  const ticketCode = String(slip.shortCode || slip.id.slice(0, 12)).toUpperCase();
  const copyLabel = slip.printCopy ? " // COPY" : "";
  const slipRef = String(slip.id || "").slice(0, 12).toUpperCase();
  const issuedAt = slip.placedAt || new Date().toISOString();
  const validUntil = new Date(new Date(issuedAt).getTime() + 30 * 24 * 3600 * 1000).toISOString();
  const logoUrl = `${window.location.origin}/brand/king5bet-logo-black.png`;

  let barcodeSvg = "";
  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, ticketCode, {
      format: "CODE128",
      displayValue: false,
      margin: 0,
      height: 38,
      width: 1.6,
    });
    barcodeSvg = new XMLSerializer().serializeToString(svg);
  } catch {
    barcodeSvg = "";
  }

  const rowsHtml = selections.map((s) => {
    const fixture = s?.Outcome?.Market?.Fixture || s?.snapshot?.fixture || {};
    const leagueName = fixture?.League?.name || fixture?.leagueName || "";
    const home = fixture?.homeTeam?.name || fixture?.homeTeamName || "";
    const away = fixture?.awayTeam?.name || fixture?.awayTeamName || "";
    const startsAt = fixture?.startsAt || "";

    const marketName = s?.Outcome?.Market?.name || s?.snapshot?.market?.name || "";
    const outcomeName = s?.Outcome?.name || s?.snapshot?.outcome?.name || "";
    const odds = getSelectionOdds(s).toFixed(2);

    return `
      <div class="sel">
        <div class="line">${escapeHtml(String(leagueName || "Sport"))}</div>
        <div class="line">${escapeHtml(`${formatDateTime(startsAt)} / ${home} V ${away}`)}</div>
        <div class="line code">${escapeHtml(String(s?.snapshot?.market?.key || ""))} ${escapeHtml(marketName)}</div>
        <div class="line pick"><span>${escapeHtml(outcomeName)}</span><span class="odds">${escapeHtml(odds)}</span></div>
      </div>
    `;
  }).join("\n");

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>KingsBet Ticket</title>
    <style>
      @page { margin: 4mm; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; display: flex; justify-content: center; background: #fff; }
      .ticket { width: 72mm; padding: 2mm 1mm; }
      .brand { display: flex; justify-content: center; margin: 0 auto 2mm; }
      .brand img { width: 44mm; max-height: 20mm; object-fit: contain; }
      .barcode { display: flex; justify-content: center; margin: 0 0 2mm; }
      .barcode svg { width: 66mm; height: 14mm; }
      .serial { text-align: center; font-size: 11px; font-weight: 800; margin-bottom: 1mm; }
      .meta { font-size: 10px; font-weight: 700; line-height: 1.35; }
      .meta .row { display: flex; gap: 2mm; }
      .meta .label { min-width: 19mm; }
      .hr { border-top: 1px solid #222; margin: 1mm 0; }
      .sel { padding: 1.4mm 0 1mm; border-bottom: 1px solid #222; }
      .line { font-size: 10px; font-weight: 700; line-height: 1.28; }
      .code { margin-top: 0.5mm; }
      .pick { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 0.5mm; font-weight: 900; }
      .odds { min-width: 12mm; text-align: right; font-weight: 900; }
      .totals { margin-top: 1.5mm; font-size: 11px; font-weight: 900; line-height: 1.45; }
      .totals .row { display:flex; justify-content:space-between; border-bottom: 1px solid #222; }
      .foot { margin-top: 2mm; font-size: 9px; color: #111; font-weight: 900; text-align: center; }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="brand"><img src="${escapeHtml(logoUrl)}" alt="KING5bet" /></div>
      ${barcodeSvg ? `<div class="barcode">${barcodeSvg}</div>` : ""}
      <div class="serial">SPORT // ${escapeHtml(ticketCode)}${copyLabel}</div>
      <div class="meta">
        <div class="row"><span class="label">Cashier</span><span>${escapeHtml(String((slip as any).cashierName || "MK6-1"))}</span></div>
        <div class="row"><span class="label">Date Issued:</span><span>${escapeHtml(formatDateTime(issuedAt))}</span></div>
        <div class="row"><span class="label">Valid until:</span><span>${escapeHtml(formatDateTime(validUntil))}</span></div>
        <div class="row"><span class="label">Short code:</span><span>${escapeHtml(ticketCode)}</span></div>
        <div class="row"><span class="label">Slip ref:</span><span>${escapeHtml(slipRef)}</span></div>
      </div>
      <div class="hr"></div>
      ${rowsHtml}
      <div class="totals">
        <div class="row"><span>Total: ${escapeHtml(stake.toFixed(2))} ETB</span><span></span></div>
        <div class="row"><span>Total Odds:</span><span>${escapeHtml(totalOdds.toFixed(2))}</span></div>
        <div class="row"><span>Possible Winning:</span><span>${escapeHtml(possibleWinning.toFixed(2))} ETB</span></div>
      </div>
      <div class="foot">Call us on telegram with @king5bet</div>
    </div>
    <script>
      window.onload = () => {
        window.focus();
        window.print();
        window.onafterprint = () => window.close();
      };
    </script>
  </body>
</html>`;

  // Some browsers return `null` when using `noopener` in feature string.
  // Open plainly and then null out `opener` for safety.
  const w = window.open("", "_blank", "width=380,height=700");
  if (!w) {
    alert("Pop-up blocked. Please allow pop-ups to print the ticket.");
    return;
  }
  try { (w as any).opener = null; } catch {}
  w.document.open();
  w.document.write(html);
  w.document.close();
}
