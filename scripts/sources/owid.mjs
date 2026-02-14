function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(",");
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const rows = [];
  for (const line of lines) {
    // naive CSV split; good enough for OWID numeric columns
    rows.push(line.split(","));
  }

  return { idx, rows };
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OWID fetch failed: ${r.status} ${url}`);
  return r.text();
}

const OWID_CO2_CSV = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv";

export async function fetchOwidCo2Dataset() {
  const text = await fetchText(OWID_CO2_CSV);
  return parseCsv(text);
}

export function latestFromOwid(parsed, columnName) {
  const { idx, rows } = parsed;
  const isoI = idx["iso_code"];
  const yearI = idx["year"];
  const colI = idx[columnName];

  if (colI === undefined) throw new Error(`OWID column not found: ${columnName}`);

  const latest = {};
  for (const r of rows) {
    const iso = r[isoI];
    const year = Number(r[yearI]);
    const vRaw = r[colI];

    if (!iso || !/^[A-Z]{3}$/.test(iso)) continue; // skip aggregates like OWID_WRL
    if (!Number.isFinite(year)) continue;
    if (vRaw === "" || vRaw === undefined) continue;

    const value = Number(vRaw);
    if (!Number.isFinite(value)) continue;

    const prev = latest[iso];
    if (!prev || year > prev.year) {
      latest[iso] = { year, value };
    }
  }

  return latest;
}
