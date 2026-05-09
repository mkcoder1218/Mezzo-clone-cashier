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
  return d.toLocaleString();
}

export function printKingsBetSlip(slip: SlipForPrint) {
  const selections = slip.BetSelections || [];
  const totalOdds = selections.reduce((p, s) => p * Number(s.oddsAtPlacement || s?.snapshot?.outcome?.odds || 1), 1);
  const stake = Number(slip.stake || 0) || 0;
  const possibleWinning = slip.potentialPayout != null ? Number(slip.potentialPayout) : stake * totalOdds;
  const ticketCode = slip.id.slice(0, 12).toUpperCase();

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
    const odds = Number(s.oddsAtPlacement || s?.snapshot?.outcome?.odds || 1).toFixed(2);

    return `
      <div class="sel">
        <div class="line dim">${escapeHtml(String(leagueName))}</div>
        <div class="line">${escapeHtml(`${home} v ${away}`)}</div>
        <div class="line dim">${escapeHtml(formatDateTime(startsAt))}</div>
        <div class="line">${escapeHtml(marketName)} <span class="odds">${escapeHtml(odds)}</span></div>
        <div class="line pick">${escapeHtml(outcomeName)}</div>
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
      @page { margin: 6mm; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111; display: flex; justify-content: center; }
      .ticket { width: 72mm; }
      .brand { text-align: center; font-weight: 900; font-size: 18px; letter-spacing: 0.5px; }
      .sub { text-align: center; font-weight: 700; font-size: 11px; margin-top: 2px; }
      .barcode { display: flex; justify-content: center; margin-top: 6px; }
      .barcode svg { width: 66mm; height: auto; }
      .meta { margin-top: 10px; font-size: 10px; font-weight: 700; }
      .meta .row { display: flex; justify-content: space-between; }
      .hr { border-top: 1px dashed #666; margin: 8px 0; }
      .sel { padding: 8px 0; border-bottom: 1px dashed #999; }
      .line { font-size: 10px; font-weight: 700; }
      .dim { color: #444; font-weight: 600; }
      .pick { margin-top: 2px; }
      .odds { float: right; font-weight: 900; }
      .totals { margin-top: 8px; font-size: 11px; font-weight: 900; }
      .foot { margin-top: 10px; font-size: 9px; color: #333; font-weight: 700; text-align: center; }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="brand">KingsBet</div>
      <div class="sub">Bet Ticket</div>
      ${barcodeSvg ? `<div class="barcode">${barcodeSvg}</div>` : ""}
      <div class="meta">
        <div class="row"><span>Ticket:</span><span>${escapeHtml(ticketCode)}</span></div>
        <div class="row"><span>Date:</span><span>${escapeHtml(formatDateTime(slip.placedAt || new Date().toISOString()))}</span></div>
      </div>
      <div class="hr"></div>
      ${rowsHtml}
      <div class="hr"></div>
      <div class="totals">
        <div class="row" style="display:flex;justify-content:space-between;"><span>Total Odds</span><span>${escapeHtml(totalOdds.toFixed(2))}</span></div>
        <div class="row" style="display:flex;justify-content:space-between;"><span>Stake</span><span>${escapeHtml(stake.toFixed(2))}</span></div>
        <div class="row" style="display:flex;justify-content:space-between;"><span>Possible Winning</span><span>${escapeHtml(possibleWinning.toFixed(2))}</span></div>
      </div>
      <div class="foot">Good luck.</div>
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
