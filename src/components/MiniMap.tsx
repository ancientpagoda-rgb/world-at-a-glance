import maplibregl, { Map } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Metric } from "../metrics";

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

function colorFor(value: number, breaks: number[]) {
  const colors = ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"]; // 5-step
  if (value <= breaks[0]) return colors[0];
  if (value <= breaks[1]) return colors[1];
  if (value <= breaks[2]) return colors[2];
  if (value <= breaks[3]) return colors[3];
  return colors[4];
}

export default function MiniMap({ metric }: { metric: Metric }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const [geo, setGeo] = useState<FeatureCollection<Geometry> | null>(null);
  const [latest, setLatest] = useState<LatestFile | null>(null);

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

  useEffect(() => {
    if (!containerRef.current || !geo || !latest) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Some environments (certain headless browsers / locked-down GPUs) don't support WebGL.
    if (!maplibregl.supported()) {
      containerRef.current.innerHTML =
        '<div style="padding:10px;font:12px system-ui;color:#666">WebGL not supported in this browser.</div>';
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          empty: {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          },
        },
        layers: [
          {
            id: "bg",
            type: "background",
            paint: { "background-color": "#ffffff" },
          },
        ],
      } as any,
      center: [10, 20],
      zoom: 0.7,
      interactive: true,
    });

    mapRef.current = map;

    const colored: FeatureCollection<Geometry> = {
      ...geo,
      features: geo.features.map((f: any) => {
        const iso3 = f.properties?.ISO_A3 || f.properties?.iso_a3;
        const rec = iso3 ? latest.values[iso3] : undefined;
        const value = rec?.value;
        const year = rec?.year;
        const fill = Number.isFinite(value) ? colorFor(value, breaks) : "#eeeeee";

        return {
          ...f,
          properties: {
            ...f.properties,
            __value: value ?? null,
            __year: year ?? null,
            __fill: fill,
          },
        };
      }),
    };

    map.on("load", () => {
      map.addSource("countries", {
        type: "geojson",
        data: colored,
      });

      map.addLayer({
        id: "fills",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": ["get", "__fill"],
          "fill-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "outlines",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#999",
          "line-width": 0.4,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });

      map.on("mousemove", "fills", (e: any) => {
        map.getCanvas().style.cursor = "pointer";
        const feat = e.features?.[0];
        if (!feat) return;

        const name = feat.properties?.ADMIN || feat.properties?.name || "—";
        const v = feat.properties?.__value;
        const y = feat.properties?.__year;

        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font: 12px system-ui;">
              <div style="font-weight:600">${name}</div>
              <div>${metric.name}: ${v ?? "—"} ${metric.unit ?? ""}</div>
              <div style="color:#666">Year: ${y ?? "—"}</div>
            </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "fills", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geo, latest, metric.name, metric.unit, breaks]);

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "10px 10px 8px" }}>
        <div style={{ fontWeight: 650, fontSize: 13, lineHeight: 1.2 }}>{metric.name}</div>
        <div style={{ fontSize: 12, color: "#666" }}>{yearLabel}</div>
      </div>
      <div ref={containerRef} style={{ height: 220, width: "100%" }} />
    </div>
  );
}
