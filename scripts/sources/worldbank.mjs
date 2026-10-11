const WB = "https://api.worldbank.org/v2";

async function fetchJson(url, { timeoutMs = 60000, retries = 4 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(new Error("timeout")), timeoutMs);
    try {
      const r = await fetch(url, { signal: ac.signal });
      if (!r.ok) throw new Error(`WorldBank fetch failed: ${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, Math.min(1000 * 2 ** (attempt - 1), 10000)));
      }
    } finally {
      clearTimeout(t);
    }
  }
  throw lastErr;
}

export async function fetchWorldBankIndicator(indicatorId) {
  let page = 1;
  let pages = 1;
  const out = [];

  while (page <= pages) {
    const url = `${WB}/country/all/indicator/${encodeURIComponent(indicatorId)}?format=json&per_page=20000&page=${page}`;
    const json = await fetchJson(url);

    const meta = json?.[0];
    const rows = json?.[1] ?? [];
    pages = meta?.pages ?? 1;

    for (const row of rows) {
      if (row) out.push(row);
    }
    page++;
  }

  return out;
}

export function toLatestByIso3(rows) {
  const latest = {};
  for (const r of rows) {
    const iso3 = r.countryiso3code;
    const year = Number(r.date);
    const value = r.value;

    if (!iso3 || !Number.isFinite(year) || value === null || value === undefined) continue;

    const prev = latest[iso3];
    if (!prev || year > prev.year) {
      latest[iso3] = { year, value: Number(value) };
    }
  }
  return latest;
}
