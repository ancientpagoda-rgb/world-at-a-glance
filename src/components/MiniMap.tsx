import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useState } from "react";
import type { Metric } from "../metrics";
import SvgChoropleth from "./SvgChoropleth";

type LatestFile = {
  metricId: string;
  updatedAt: string;
  values: Record<string, { year: number; value: number }>;
};

const GEO_URL = (base: string) => `${base}geo/countries_simplified.geojson`;

function getBreaks(vals: number[]) {
  const v = vals.slice().sort((a, b) => a - b);
  const q = (p: number) => v[Math.floor(p * (v.length - 1))];
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

export default function MiniMap({ metric }: { metric: Metric }) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry> | null>(null);
  const [latest, setLatest] = useState<LatestFile | null>(null);
  const [hover, setHover] = useState<{ name: string; year?: number; value?: number } | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;

    fetch(GEO_URL(base))
      .then((r) => r.json())
      .then(setGeo);

    fetch(`${base}data/latest/${metric.id}.json`)
      .then((r) => r.json())
      .then(setLatest);
  }, [metric.id]);

  const { breaks, yearLabel } = useMemo(() => {
    if (!latest) return { breaks: [0, 0, 0, 0], yearLabel: "Latest" };

    const vals = Object.values(latest.values)
      .map((x) => x.value)
      .filter((x) => Number.isFinite(x));

    const years = Object.values(latest.values).map((x) => x.year);
    const freq = new Map<number, number>();
    for (const y of years) freq.set(y, (freq.get(y) ?? 0) + 1);
    const bestYear = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      breaks: vals.length ? getBreaks(vals) : [0, 0, 0, 0],
      yearLabel: bestYear ? `Latest (${bestYear})` : "Latest",
    };
  }, [latest]);

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 10px 8px" }}>
        <div style={{ fontWeight: 650, fontSize: 13, lineHeight: 1.2 }}>{metric.name}</div>
        <div style={{ fontSize: 12, color: "#666" }}>
          {yearLabel}
          {hover?.name ? (
            <span style={{ marginLeft: 8, color: "#444" }}>
              • {hover.name}: {hover.value ?? "—"} {metric.unit ?? ""} {hover.year ? `(${hover.year})` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <div style={{ height: 220, width: "100%" }}>
        {geo && latest ? (
          <SvgChoropleth
            geo={geo}
            values={latest.values}
            breaks={breaks}
            width={520}
            height={220}
            onHover={(p) => setHover({ name: p.name, year: p.year, value: p.value })}
            onLeave={() => setHover(null)}
          />
        ) : (
          <div style={{ padding: 10, fontSize: 12, color: "#666" }}>Loading…</div>
        )}
      </div>
    </div>
  );
}
