// MuseUsage.js — iPhone Scriptable widget for Muse usage
// 1. Install Scriptable (free, App Store)
// 2. Paste this file as a new script named "MuseUsage"
// 3. Long-press home screen -> + -> Scriptable -> pick this script
//
// No token needed. Usage numbers are not sensitive, so the data repo
// linuxdowill-hub/muse-usage-widget is public and the widget fetches
// muse-usage.json from raw.githubusercontent.com with no auth.

const DATA_URL = "https://raw.githubusercontent.com/linuxdowill-hub/muse-usage-widget/main/muse-usage.json";
const CACHE_NAME = "muse-usage-cache.json";

let lastError = "";

function colorFor(remaining) {
  // remaining: 0-100. <10 red, <25 yellow, else green.
  if (remaining == null) return new Color("#8E8E93");
  if (remaining < 10) return new Color("#FF3B30");
  if (remaining < 25) return new Color("#FFCC00");
  return new Color("#34C759");
}

function drawBar(pct, color, width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.setFillColor(new Color("#3A3A3C"));
  ctx.fillRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  const w = Math.max(height, Math.round(width * Math.min(100, Math.max(0, pct)) / 100));
  ctx.setFillColor(color);
  ctx.fillRoundedRect(new Rect(0, 0, w, height), height / 2, height / 2);
  return ctx.getImage();
}

async function fetchData() {
  const fm = FileManager.local();
  const cachePath = fm.joinPath(fm.documentsDirectory(), CACHE_NAME);
  try {
    const req = new Request(DATA_URL);
    req.timeoutInterval = 15;
    const data = await req.loadJSON();
    if (!data || !data.weekly || !data.additional || typeof data.weekly.remaining_pct !== "number") {
      throw new Error("数据格式不对: " + JSON.stringify(data).slice(0, 120));
    }
    data._stale = false;
    fm.writeString(cachePath, JSON.stringify(data));
    return data;
  } catch (e) {
    lastError = String(e.message || e).slice(0, 140);
    if (fm.fileExists(cachePath)) {
      try {
        const data = JSON.parse(fm.readString(cachePath));
        if (data && data.weekly && data.additional) {
          data._stale = true;
          return data;
        }
        fm.remove(cachePath);
      } catch (_ignored) {
        try { fm.remove(cachePath); } catch (_ignored2) {}
      }
    }
    return null;
  }
}

function addBarRow(w, label, remaining, note) {
  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const t = row.addText(label);
  t.font = Font.semiboldSystemFont(13);
  t.textColor = Color.white();
  row.addSpacer();
  const v = row.addText(remaining == null ? "--" : `${remaining}%`);
  v.font = Font.boldSystemFont(15);
  v.textColor = colorFor(remaining);
  w.addSpacer(3);
  const barImg = w.addImage(drawBar(remaining == null ? 0 : remaining, colorFor(remaining), 300, 10));
  barImg.imageSize = new Size(300, 10);
  w.addSpacer(3);
  const n = w.addText(note || "");
  n.font = Font.systemFont(11);
  n.textColor = new Color("#AEAEB2");
}

async function main() {
  const data = await fetchData();
  const w = new ListWidget();
  w.backgroundColor = new Color("#1C1C1E");
  w.setPadding(14, 14, 12, 14);

  const head = w.addStack();
  head.layoutHorizontally();
  head.centerAlignContent();
  const title = head.addText("Muse 用量");
  title.font = Font.boldSystemFont(16);
  title.textColor = Color.white();
  head.addSpacer();
  const dot = head.addText(data ? (data._stale ? "缓存" : "●") : "离线");
  dot.font = Font.systemFont(11);
  dot.textColor = data ? (data._stale ? new Color("#FFCC00") : new Color("#34C759")) : new Color("#FF3B30");
  w.addSpacer(8);

  if (!data || !data.weekly || !data.additional) {
    const e = w.addText("取不到数据，也没有缓存\n请检查网络");
    e.font = Font.systemFont(13);
    e.textColor = new Color("#FF3B30");
    if (lastError) {
      w.addSpacer(6);
      const d = w.addText(lastError);
      d.font = Font.systemFont(11);
      d.textColor = new Color("#AEAEB2");
    }
    if (config.runsInWidget) { Script.setWidget(w); } else { w.presentMedium(); }
    Script.complete();
    return;
  }

  // Weekly first (the headline quota), additional second (the real fuel:
  // weekly is often 0% while additional tokens are still usable).
  addBarRow(w, "周额度剩余", data.weekly.remaining_pct,
    data.weekly.countdown ? `重置倒计时 ${data.weekly.countdown}` : (data.weekly.reset_text || ""));
  w.addSpacer(10);
  addBarRow(w, "额外 Token 剩余", data.additional.remaining_pct,
    data.additional.left ? `还剩 ${data.additional.left} tokens` : "");

  w.addSpacer(8);
  const foot = w.addStack();
  foot.layoutHorizontally();
  const reset = foot.addText(data.weekly.reset_text ? `重置 ${data.weekly.reset_text}` : "");
  reset.font = Font.systemFont(11);
  reset.textColor = new Color("#AEAEB2");
  foot.addSpacer();
  const upd = foot.addText(data.updated_at ? `更新 ${data.updated_at.slice(5, 16).replace("T", " ")}` : "");
  upd.font = Font.systemFont(11);
  upd.textColor = new Color("#AEAEB2");

  if (config.runsInWidget) {
    Script.setWidget(w);
  } else {
    w.presentMedium();
  }
  Script.complete();
}

await main();
