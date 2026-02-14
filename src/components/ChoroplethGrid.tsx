import { useEffect, useMemo, useState } from "react";
import MiniMap from "./MiniMap";
import MetricPicker from "./MetricPicker";
import FocusModal from "./FocusModal";
import { METRICS, type Metric } from "../metrics";

type MetaJson = {
  updatedAt: string;
  metrics: Metric[];
};

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem("wag:favorites");
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  try {
    localStorage.setItem("wag:favorites", JSON.stringify([...favs]));
  } catch {
    // ignore
  }
}

export default function ChoroplethGrid() {
  const [meta, setMeta] = useState<MetaJson | null>(null);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [focus, setFocus] = useState<Metric | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/meta.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setMeta(j))
      .catch(() => {});
  }, []);

  const metrics = useMemo(() => meta?.metrics ?? METRICS, [meta]);

  const gridMetrics = useMemo(() => {
    const favList = metrics.filter((m) => favorites.has(m.id));
    if (favList.length > 0) return favList.slice(0, 27);
    return metrics.slice(0, 27);
  }, [metrics, favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return next;
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, alignItems: "start" }}>
      <div style={{ position: "sticky", top: 12 }}>
        <div style={{ marginBottom: 10, fontSize: 12, color: "#666" }}>
          Data updated: {meta?.updatedAt ?? "—"}
        </div>
        <MetricPicker
          metrics={metrics}
          query={query}
          setQuery={setQuery}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#444" }}>
            Showing <b>{gridMetrics.length}</b> map tiles
            {favorites.size ? (
              <span style={{ color: "#777" }}> • from your favorites</span>
            ) : (
              <span style={{ color: "#777" }}> • default set</span>
            )}
          </div>
          <button
            onClick={() => {
              setFavorites(new Set());
              saveFavorites(new Set());
            }}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: "6px 10px",
              background: "white",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Clear favorites
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {gridMetrics.map((m) => (
            <div key={m.id} style={{ position: "relative" }}>
              <button
                onClick={() => setFocus(m)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  zIndex: 2,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: "6px 10px",
                  background: "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Focus
              </button>
              <MiniMap metric={m} />
            </div>
          ))}
        </div>
      </div>

      {focus ? <FocusModal metric={focus} onClose={() => setFocus(null)} /> : null}
    </div>
  );
}
