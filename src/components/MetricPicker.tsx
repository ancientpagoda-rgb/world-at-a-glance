import { useMemo } from "react";
import type { Metric } from "../metrics";

export default function MetricPicker({
  metrics,
  query,
  setQuery,
  favorites,
  toggleFavorite,
}: {
  metrics: Metric[];
  query: string;
  setQuery: (s: string) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return metrics;
    return metrics.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
    );
  }, [metrics, query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search metrics…"
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #ddd",
          fontSize: 13,
        }}
      />

      <div style={{ fontSize: 12, color: "#666" }}>
        Tip: star favorites to build your dashboard grid.
      </div>

      <div style={{ maxHeight: 420, overflow: "auto", border: "1px solid #eee", borderRadius: 10 }}>
        {filtered.map((m) => {
          const fav = favorites.has(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggleFavorite(m.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "10px 10px",
                border: "none",
                borderBottom: "1px solid #f0f0f0",
                background: "white",
                cursor: "pointer",
                textAlign: "left",
              }}
              title={m.id}
            >
              <span style={{ fontSize: 13 }}>
                {m.name}
                <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>{m.unit ?? ""}</span>
              </span>
              <span style={{ fontSize: 16, color: fav ? "#c08a00" : "#bbb" }}>
                {fav ? "★" : "☆"}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: "#666" }}>
        Favorites: <b>{favorites.size}</b>
      </div>
    </div>
  );
}
