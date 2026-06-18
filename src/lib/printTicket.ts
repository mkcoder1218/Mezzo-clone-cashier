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

function isMobilePrintHost() {
  const ua = navigator.userAgent || "";
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (coarsePointer && window.innerWidth <= 900);
}

function fitReceiptLine(left: string, right: string, width = 32) {
  const l = String(left || "");
  const r = String(right || "");
  const gap = Math.max(1, width - l.length - r.length);
  return `${l}${" ".repeat(gap)}${r}`.slice(0, width);
}

function cleanBluetoothText(v: string) {
  return String(v || " ").replace(/[<>;]/g, " ").trim() || " ";
}

function toBluetoothPrintText(lines: string[], barcodeValue: string) {
  const parts = lines.map((line, index) => {
    const bold = index < 2 ? 1 : 0;
    const align = index < 2 ? 1 : 0;
    const format = index === 0 ? 3 : index === 1 ? 1 : 0;
    return `<${bold}${align}${format}>${cleanBluetoothText(line)}\n`;
  });
  parts.push(`<BARCODE>1#160#60#${cleanBluetoothText(barcodeValue)}`);
  return parts.join("");
}

export function printKingsBetSlip(slip: SlipForPrint) {
  const mobilePrintHost = isMobilePrintHost();
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

  const receiptLines: string[] = [
    "KING5BET",
    `SPORT ${ticketCode}${slip.printCopy ? " COPY" : ""}`,
    `Cashier: ${String((slip as any).cashierName || "MK6-1")}`,
    `Date: ${formatDateTime(issuedAt)}`,
    `Valid: ${formatDateTime(validUntil)}`,
    `Short code: ${ticketCode}`,
    `Slip ref: ${slipRef}`,
    "--------------------------------",
  ];

  const rowsHtml = selections.map((s) => {
    const fixture = s?.Outcome?.Market?.Fixture || s?.snapshot?.fixture || {};
    const leagueName = fixture?.League?.name || fixture?.leagueName || "";
    const home = fixture?.homeTeam?.name || fixture?.homeTeamName || "";
    const away = fixture?.awayTeam?.name || fixture?.awayTeamName || "";
    const startsAt = fixture?.startsAt || "";

    const marketName = s?.Outcome?.Market?.name || s?.snapshot?.market?.name || "";
    const outcomeName = s?.Outcome?.name || s?.snapshot?.outcome?.name || "";
    const odds = getSelectionOdds(s).toFixed(2);

    receiptLines.push(
      String(leagueName || "Sport").slice(0, 32),
      `${formatDateTime(startsAt)} / ${home} V ${away}`.slice(0, 32),
      `${String(s?.snapshot?.market?.key || "")} ${marketName}`.trim().slice(0, 32),
      fitReceiptLine(outcomeName, odds),
      "--------------------------------",
    );

    return `
      <div class="sel">
        <div class="line">${escapeHtml(String(leagueName || "Sport"))}</div>
        <div class="line">${escapeHtml(`${formatDateTime(startsAt)} / ${home} V ${away}`)}</div>
        <div class="line code">${escapeHtml(String(s?.snapshot?.market?.key || ""))} ${escapeHtml(marketName)}</div>
        <div class="line pick"><span>${escapeHtml(outcomeName)}</span><span class="odds">${escapeHtml(odds)}</span></div>
      </div>
    `;
  }).join("\n");

  receiptLines.push(
    fitReceiptLine(`Total: ${stake.toFixed(2)}`, "ETB"),
    fitReceiptLine("Total Odds:", totalOdds.toFixed(2)),
    fitReceiptLine("Possible Winning:", `${possibleWinning.toFixed(2)} ETB`),
    "Call us on telegram @king5bet",
    "\n\n\n",
  );

  const bluetoothPrintText = toBluetoothPrintText(receiptLines, ticketCode);
  const bluetoothPrintUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;package=mate.bluetoothprint;S.android.intent.extra.TEXT=${encodeURIComponent(bluetoothPrintText)};end`;

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>KingsBet Ticket</title>
    <style>
      ${mobilePrintHost ? `
      @page { size: 80mm 297mm; margin: 2mm; }
      html, body { width: 80mm; min-height: 100%; margin: 0; padding: 0; background: #fff; }
      body { font-family: Arial, Helvetica, sans-serif; color: #111; display: block; }
      .ticket { width: 76mm; padding: 1mm; box-sizing: border-box; }
      ` : `
      @page { margin: 4mm; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; display: flex; justify-content: center; background: #fff; }
      .ticket { width: 72mm; padding: 2mm 1mm; }
      `}
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
      .print-actions { position: sticky; bottom: 0; display: flex; justify-content: center; padding: 8px; background: #fff; border-top: 1px solid #ddd; }
      .print-actions a, .print-actions button { width: 72mm; max-width: calc(100vw - 16px); border: 0; background: #111; color: #fff; font: 800 14px Arial, Helvetica, sans-serif; padding: 11px 12px; border-radius: 3px; text-align: center; text-decoration: none; box-sizing: border-box; }
      @media print {
        ${mobilePrintHost ? `
        html, body { width: 80mm; margin: 0; padding: 0; background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        body { display: block; }
        .ticket { display: block !important; width: 76mm; margin: 0; padding: 1mm; }
        ` : `
        body { display: block; background: #fff; }
        .ticket { display: block !important; margin: 0 auto; }
        `}
        body > *:not(.ticket) { display: none !important; }
        .print-actions, button { display: none !important; }
      }
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
    ${mobilePrintHost ? `<div class="print-actions"><a id="printTicketButton" href="${escapeHtml(bluetoothPrintUrl)}">Print Ticket</a></div>` : ""}
    <script>
      const receiptLines = ${JSON.stringify(receiptLines)};
      async function printMiniTicket() {
        if (!("usb" in navigator)) {
          return false;
        }

        const usb = navigator.usb;
        let device = null;
        const knownDevices = await usb.getDevices();
        device = knownDevices[0] || null;
        if (!device) {
          try {
            device = await usb.requestDevice({ filters: [] });
          } catch {
            return false;
          }
        }
        if (!device) {
          return false;
        }

        await device.open();
        if (device.configuration === null) await device.selectConfiguration(1);
        const iface = device.configuration.interfaces.find((item) =>
          item.alternates.some((alt) => alt.endpoints.some((ep) => ep.direction === "out"))
        );
        if (!iface) throw new Error("No printer output channel found.");
        const alternate = iface.alternates[0];
        if (!iface.claimed) await device.claimInterface(iface.interfaceNumber);
        if (alternate.alternateSetting) await device.selectAlternateInterface(iface.interfaceNumber, alternate.alternateSetting);
        const endpoint = alternate.endpoints.find((ep) => ep.direction === "out");
        if (!endpoint) throw new Error("No printer output endpoint found.");

        const text = "\\x1b@\\x1ba\\x01" + receiptLines.slice(0, 2).join("\\n") + "\\n\\x1ba\\x00" + receiptLines.slice(2).join("\\n") + "\\n\\x1dV\\x00";
        const bytes = new TextEncoder().encode(text);
        for (let offset = 0; offset < bytes.length; offset += 512) {
          await device.transferOut(endpoint.endpointNumber, bytes.slice(offset, offset + 512));
        }
        return true;
      }

      function printPreviewFallback() {
        window.print();
      }

      function attachPrintButton() {
        const button = document.getElementById("printTicketButton");
        if (!button) return;
        button.addEventListener("click", () => {
          button.textContent = "Opening Printer...";
        });
      }

      window.onload = () => {
        window.focus();
        const isMobilePrintHost = ${JSON.stringify(mobilePrintHost)};
        if (isMobilePrintHost) {
          attachPrintButton();
        } else {
          window.print();
          window.onafterprint = () => window.close();
        }
      };
    </script>
  </body>
</html>`;

  if (mobilePrintHost) {
    const existing = document.getElementById("thermal-ticket-preview");
    existing?.remove();

    const previewDoc = new DOMParser().parseFromString(html, "text/html");
    const overlay = document.createElement("div");
    overlay.id = "thermal-ticket-preview";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "99999";
    overlay.style.overflow = "auto";
    overlay.style.background = "#fff";
    overlay.style.color = "#111";

    const style = previewDoc.querySelector("style");
    if (style) overlay.appendChild(style.cloneNode(true));

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.style.position = "sticky";
    closeButton.style.top = "0";
    closeButton.style.zIndex = "2";
    closeButton.style.width = "100%";
    closeButton.style.border = "0";
    closeButton.style.background = "#333";
    closeButton.style.color = "#fff";
    closeButton.style.font = "800 14px Arial, Helvetica, sans-serif";
    closeButton.style.padding = "12px";
    closeButton.onclick = () => overlay.remove();
    overlay.appendChild(closeButton);

    Array.from(previewDoc.body.children).forEach((child) => {
      if (child.tagName.toLowerCase() !== "script") overlay.appendChild(child.cloneNode(true));
    });

    document.body.appendChild(overlay);
    const button = overlay.querySelector<HTMLElement>("#printTicketButton");
    button?.addEventListener("click", () => {
      button.textContent = "Opening Printer...";
    });
    return;
  }

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
