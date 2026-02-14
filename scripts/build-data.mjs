import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchWorldBankIndicator, toLatestByIso3 } from "./sources/worldbank.mjs";
import { fetchOwidCo2Dataset, latestFromOwid } from "./sources/owid.mjs";

const METRICS_LIST = [
  // Demographics
  { id: "SP.POP.TOTL", name: "Population", unit: "people", source: "worldbank" },
  { id: "SP.POP.GROW", name: "Population growth", unit: "%", source: "worldbank" },
  { id: "SP.URB.TOTL.IN.ZS", name: "Urban population", unit: "%", source: "worldbank" },
  { id: "SP.DYN.LE00.IN", name: "Life expectancy", unit: "years", source: "worldbank" },
  { id: "SP.DYN.TFRT.IN", name: "Fertility rate", unit: "births/woman", source: "worldbank" },

  // Economy
  { id: "NY.GDP.MKTP.CD", name: "GDP", unit: "current US$", source: "worldbank" },
  { id: "NY.GDP.PCAP.CD", name: "GDP per capita", unit: "current US$", source: "worldbank" },
  { id: "NY.GDP.MKTP.KD.ZG", name: "GDP growth", unit: "%", source: "worldbank" },
  { id: "FP.CPI.TOTL.ZG", name: "Inflation (CPI)", unit: "%", source: "worldbank" },
  { id: "SL.UEM.TOTL.ZS", name: "Unemployment", unit: "%", source: "worldbank" },
  { id: "NE.EXP.GNFS.ZS", name: "Exports", unit: "% of GDP", source: "worldbank" },
  { id: "NE.IMP.GNFS.ZS", name: "Imports", unit: "% of GDP", source: "worldbank" },
  { id: "NE.CON.GOVT.ZS", name: "Gov. final consumption", unit: "% of GDP", source: "worldbank" },

  // Health / development
  { id: "SH.DYN.MORT", name: "Under-5 mortality", unit: "per 1,000", source: "worldbank" },
  { id: "SH.STA.MMRT", name: "Maternal mortality", unit: "per 100,000", source: "worldbank" },
  { id: "SH.MED.PHYS.ZS", name: "Physicians", unit: "per 1,000", source: "worldbank" },
  { id: "SH.MED.BEDS.ZS", name: "Hospital beds", unit: "per 1,000", source: "worldbank" },
  { id: "EG.ELC.ACCS.ZS", name: "Access to electricity", unit: "%", source: "worldbank" },
  { id: "IT.NET.USER.ZS", name: "Internet users", unit: "%", source: "worldbank" },

  // Education
  { id: "SE.ADT.LITR.ZS", name: "Adult literacy", unit: "%", source: "worldbank" },
  { id: "SE.SEC.ENRR", name: "Secondary enrollment", unit: "%", source: "worldbank" },
  { id: "SE.TER.ENRR", name: "Tertiary enrollment", unit: "%", source: "worldbank" },

  // OWID
  { id: "co2_per_capita", name: "CO₂ per capita", unit: "tonnes/person", source: "owid" },
  { id: "co2", name: "CO₂ (total)", unit: "million tonnes", source: "owid" },
  { id: "energy_per_capita", name: "Energy per capita", unit: "kWh/person", source: "owid" },
  { id: "co2_per_unit_energy", name: "CO₂ per unit energy", unit: "kg per kWh (approx)", source: "owid" },
  { id: "consumption_co2_per_capita", name: "Consumption CO₂ per capita", unit: "tonnes/person", source: "owid" },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.resolve(__dirname, "../public/data");
const LATEST_DIR = path.join(OUT_DIR, "latest");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

async function main() {
  // ensure geo exists
  await import("./fetch-geo.mjs");

  ensureDir(LATEST_DIR);

  const updatedAt = new Date().toISOString();
  const owidParsed = await fetchOwidCo2Dataset();

  for (const m of METRICS_LIST) {
    let values;

    if (m.source === "worldbank") {
      const rows = await fetchWorldBankIndicator(m.id);
      values = toLatestByIso3(rows);
    } else {
      values = latestFromOwid(owidParsed, m.id);
    }

    writeJson(path.join(LATEST_DIR, `${m.id}.json`), {
      metricId: m.id,
      updatedAt,
      values,
    });

    console.log(`wrote latest/${m.id}.json (${Object.keys(values).length} countries)`);
  }

  writeJson(path.join(OUT_DIR, "meta.json"), {
    updatedAt,
    metrics: METRICS_LIST,
    notes: "Latest available value per country; built daily by GitHub Actions.",
  });

  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
