/**
 * Shared layout primitives for product PDF deliverables.
 *
 * Constraints (pdf-lib StandardFonts):
 *   - Fonts are Helvetica / Helvetica-Bold / Courier in WinAnsi encoding.
 *   - Any character outside WinAnsi (box-drawing, arrows, em-quad math, most
 *     emoji) will throw at render time. Stick to ASCII + Latin-1 + the small
 *     set of WinAnsi extras (bullet •, em-dash —, middot ·, copyright ©, …).
 */

import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

export const PAGE_W = 595; // A4 portrait
export const PAGE_H = 842;
export const MARGIN_X = 56;
export const MARGIN_TOP = 64;
export const MARGIN_BOTTOM = 56;

export const BRAND = rgb(0.06, 0.09, 0.16);
export const ACCENT = rgb(0.0, 0.32, 0.78);
export const MUTED = rgb(0.42, 0.45, 0.5);
export const CODE_BG = rgb(0.96, 0.97, 0.99);
export const CODE_FG = rgb(0.12, 0.14, 0.18);
export const RULE = rgb(0.86, 0.88, 0.92);

export interface DocCtx {
  pdf: PDFDocument;
  body: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
  page: PDFPage;
  y: number;
  pageNo: number;
  // Static header band text (rendered on every page after the cover).
  headerLeft: string;
  headerRight: string;
}

export function drawPageChrome(ctx: DocCtx): void {
  if (ctx.pageNo <= 1) return;
  ctx.page.drawText(ctx.headerLeft, {
    x: MARGIN_X,
    y: PAGE_H - 36,
    size: 9,
    font: ctx.body,
    color: MUTED,
  });
  const rightW = ctx.body.widthOfTextAtSize(ctx.headerRight, 9);
  ctx.page.drawText(ctx.headerRight, {
    x: PAGE_W - MARGIN_X - rightW,
    y: PAGE_H - 36,
    size: 9,
    font: ctx.body,
    color: MUTED,
  });
  ctx.page.drawLine({
    start: { x: MARGIN_X, y: PAGE_H - 44 },
    end: { x: PAGE_W - MARGIN_X, y: PAGE_H - 44 },
    thickness: 0.5,
    color: RULE,
  });
  ctx.page.drawText(String(ctx.pageNo), {
    x: PAGE_W / 2 - 4,
    y: 32,
    size: 9,
    font: ctx.body,
    color: MUTED,
  });
}

export function newPage(ctx: DocCtx): void {
  ctx.page = ctx.pdf.addPage([PAGE_W, PAGE_H]);
  ctx.pageNo += 1;
  ctx.y = PAGE_H - MARGIN_TOP;
  drawPageChrome(ctx);
}

export function ensureSpace(ctx: DocCtx, needed: number): void {
  if (ctx.y - needed < MARGIN_BOTTOM) newPage(ctx);
}

export function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawHeading(ctx: DocCtx, text: string, level: 1 | 2 | 3): void {
  const size = level === 1 ? 22 : level === 2 ? 15 : 12;
  const gapBefore = level === 1 ? 0 : level === 2 ? 18 : 12;
  const gapAfter = level === 1 ? 14 : level === 2 ? 10 : 8;
  ensureSpace(ctx, size + gapBefore + gapAfter);
  ctx.y -= gapBefore;
  ctx.page.drawText(text, {
    x: MARGIN_X,
    y: ctx.y - size,
    size,
    font: ctx.bold,
    color: level === 1 ? BRAND : level === 2 ? ACCENT : BRAND,
  });
  ctx.y -= size + gapAfter;
}

export function drawParagraph(ctx: DocCtx, text: string): void {
  const size = 10.5;
  const lineH = 14;
  const maxW = PAGE_W - 2 * MARGIN_X;
  const lines = wrap(ctx.body, text, size, maxW);
  for (const line of lines) {
    ensureSpace(ctx, lineH);
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.y - size,
      size,
      font: ctx.body,
      color: BRAND,
    });
    ctx.y -= lineH;
  }
  ctx.y -= 6;
}

export function drawBullets(ctx: DocCtx, items: string[]): void {
  const size = 10.5;
  const lineH = 14;
  const indent = 18;
  const maxW = PAGE_W - 2 * MARGIN_X - indent;
  for (const it of items) {
    const lines = wrap(ctx.body, it, size, maxW);
    ensureSpace(ctx, lineH * lines.length);
    ctx.page.drawText("\u2022", {
      x: MARGIN_X + 2,
      y: ctx.y - size,
      size,
      font: ctx.bold,
      color: ACCENT,
    });
    lines.forEach((line, i) => {
      ctx.page.drawText(line, {
        x: MARGIN_X + indent,
        y: ctx.y - size - i * lineH,
        size,
        font: ctx.body,
        color: BRAND,
      });
    });
    ctx.y -= lineH * lines.length + 2;
  }
  ctx.y -= 4;
}

export function drawCode(ctx: DocCtx, code: string): void {
  const size = 9;
  const lineH = 12;
  const padX = 10;
  const padY = 8;
  const maxW = PAGE_W - 2 * MARGIN_X - 2 * padX;
  const lines: string[] = [];
  for (const raw of code.split("\n")) {
    if (ctx.mono.widthOfTextAtSize(raw, size) <= maxW) {
      lines.push(raw);
    } else {
      let buf = "";
      for (const ch of raw) {
        const candidate = buf + ch;
        if (ctx.mono.widthOfTextAtSize(candidate, size) > maxW) {
          lines.push(buf);
          buf = "  " + ch;
        } else {
          buf = candidate;
        }
      }
      if (buf) lines.push(buf);
    }
  }
  const boxH = padY * 2 + lines.length * lineH;
  ensureSpace(ctx, boxH + 6);
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - boxH,
    width: PAGE_W - 2 * MARGIN_X,
    height: boxH,
    color: CODE_BG,
    borderColor: RULE,
    borderWidth: 0.5,
  });
  lines.forEach((line, i) => {
    ctx.page.drawText(line, {
      x: MARGIN_X + padX,
      y: ctx.y - padY - (i + 1) * lineH + 3,
      size,
      font: ctx.mono,
      color: CODE_FG,
    });
  });
  ctx.y -= boxH + 10;
}

export interface CoverOpts {
  title: string;
  subtitle: string;
  version: string; // e.g. "1.1"
  releaseMonth: string; // e.g. "May 2026"
}

export function drawCover(ctx: DocCtx, opts: CoverOpts): void {
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_H - 200,
    width: PAGE_W,
    height: 200,
    color: BRAND,
  });
  ctx.page.drawText("CopyPasteLearn", {
    x: MARGIN_X,
    y: PAGE_H - 90,
    size: 14,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText(opts.title, {
    x: MARGIN_X,
    y: PAGE_H - 140,
    size: 28,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.page.drawText(opts.subtitle, {
    x: MARGIN_X,
    y: PAGE_H - 170,
    size: 12,
    font: ctx.body,
    color: rgb(0.85, 0.88, 0.95),
  });

  ctx.page.drawText(`Version ${opts.version} \u00b7 ${opts.releaseMonth}`, {
    x: MARGIN_X,
    y: 130,
    size: 11,
    font: ctx.body,
    color: MUTED,
  });
  ctx.page.drawText("Open Empower B.V.", {
    x: MARGIN_X,
    y: 110,
    size: 11,
    font: ctx.bold,
    color: BRAND,
  });
  ctx.page.drawText("De Boelelaan 471, 1082 RK Amsterdam, The Netherlands", {
    x: MARGIN_X,
    y: 94,
    size: 10,
    font: ctx.body,
    color: MUTED,
  });
  ctx.page.drawText("VAT NL866954958B01 \u00b7 support@copypastelearn.com", {
    x: MARGIN_X,
    y: 80,
    size: 10,
    font: ctx.body,
    color: MUTED,
  });
}

export function drawToc(ctx: DocCtx, entries: string[]): void {
  drawHeading(ctx, "Contents", 1);
  const size = 11;
  const lineH = 18;
  entries.forEach((entry, i) => {
    ensureSpace(ctx, lineH);
    ctx.page.drawText(`${i + 1}.  ${entry}`, {
      x: MARGIN_X,
      y: ctx.y - size,
      size,
      font: ctx.body,
      color: BRAND,
    });
    ctx.y -= lineH;
  });
}

export interface InitDocOpts {
  title: string;
  subject: string;
  keywords: string[];
  headerLeft: string;
  headerRight?: string;
}

export async function initDoc(opts: InitDocOpts): Promise<DocCtx> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(opts.title);
  pdf.setAuthor("Open Empower B.V. (CopyPasteLearn)");
  pdf.setSubject(opts.subject);
  pdf.setKeywords(opts.keywords);

  const body = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  return {
    pdf,
    body,
    bold,
    mono,
    page: pdf.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN_TOP,
    pageNo: 1,
    headerLeft: opts.headerLeft,
    headerRight: opts.headerRight ?? "CopyPasteLearn \u00b7 Open Empower B.V.",
  };
}
