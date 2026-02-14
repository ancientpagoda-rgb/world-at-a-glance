import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import type { Metric } from "../metrics";
import SvgChoropleth from "./SvgChoropleth";
import Legend from "./Legend";
import { formatNumber } from "../format";

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

export default function FocusModal({
  metric,
  onClose,
}: {
  metric: Metric;
  onClose: () => void;
}) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry> | null>(null);
  const [latest, setLatest] = useState<LatestFile | null>(null);
  const [hover, setHover] = useState<{ name: string; year?: number; value?: number } | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(GEO_URL(base)).then((r) => r.json()).then(setGeo);
    fetch(`${base}data/latest/${metric.id}.json`).then((r) => r.json()).then(setLatest);
  }, [metric.id]);

  const nameByIso3 = useMemo(() => {
    const m = new Map<string, string>();
    if (!geo) return m;
    for (const f of geo.features as any[]) {
      const iso3: string | undefined = f?.properties?.ISO_A3 || f?.properties?.iso_a3;
      const name: string | undefined = f?.properties?.ADMIN || f?.properties?.name;
      if (iso3 && name) m.set(iso3, name);
    }
    return m;
  }, [geo]);

  const vals = useMemo(() => {
    if (!latest) return [] as Array<{ iso3: string; year: number; value: number }>;
    return Object.entries(latest.values)
      .filter(([, v]) => Number.isFinite(v.value))
      .map(([iso3, v]) => ({ iso3, year: v.year, value: v.value }))
      .sort((a, b) => b.value - a.value);
  }, [latest]);

  const breaks = useMemo(() => {
    const numbers = vals.map((x) => x.value);
    return numbers.length ? getBreaks(numbers) : [0, 0, 0, 0];
  }, [vals]);

  const fmt = (x: number) => formatNumber(x, metric.unit);

  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "white",
          width: "min(1100px, 96vw)",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{metric.name}</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {metric.id} • {latest?.updatedAt ? `updated ${new Date(latest.updatedAt).toLocaleString()}` : ""}
              {hover?.name ? (
                <span style={{ marginLeft: 10, color: "#333" }}>
                  • {hover.name}: {hover.value !== undefined ? fmt(hover.value) : "—"} {hover.year ? `(${hover.year})` : ""}
                </span>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "8px 10px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: "0 14px 14px" }}>
          <Legend breaks={breaks} fmt={fmt} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14, padding: "0 14px 14px" }}>
          <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
            {geo && latest ? (
              <SvgChoropleth
                geo={geo}
                values={latest.values}
                breaks={breaks}
                width={780}
                height={440}
                onHover={(p) => setHover({ name: p.name, year: p.year, value: p.value })}
                onLeave={() => setHover(null)}
              />
            ) : (
              <div style={{ padding: 14, fontSize: 12, color: "#666" }}>Loading…</div>
            )}
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: 10, borderBottom: "1px solid #f0f0f0", fontWeight: 650 }}>
              Top countries
            </div>
            <div style={{ maxHeight: 440, overflow: "auto" }}>
              {vals.slice(0, 50).map((r, i) => (
                <div
                  key={r.iso3}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "34px 1fr auto",
                    gap: 8,
                    alignItems: "baseline",
                    padding: "8px 10px",
                    borderBottom: "1px solid #f6f6f6",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#666" }}>{i + 1}.</span>
                  <span>
                    {nameByIso3.get(r.iso3) ?? r.iso3}
                    <span style={{ marginLeft: 8, color: "#888", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {r.iso3}
                    </span>
                  </span>
                  <span style={{ fontWeight: 650 }}>{fmt(r.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
