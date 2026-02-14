import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.resolve(__dirname, "../public/geo/countries_simplified.geojson");
const url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

fs.mkdirSync(path.dirname(outPath), { recursive: true });

if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
  console.log("geojson already present");
} else {
  console.log("downloading", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`geo download failed: ${r.status}`);
  const text = await r.text();
  fs.writeFileSync(outPath, text);
  console.log("wrote", outPath);
}

export {};
