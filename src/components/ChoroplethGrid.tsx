import { useEffect, useMemo, useState } from "react";
import MiniMap from "./MiniMap";
import { METRICS, type Metric } from "../metrics";

type MetaJson = {
  updatedAt: string;
  metrics: Metric[];
};

export default function ChoroplethGrid() {
  const [meta, setMeta] = useState<MetaJson | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/meta.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setMeta(j))
      .catch(() => {});
  }, []);

  const metrics = useMemo(() => meta?.metrics ?? METRICS, [meta]);

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 12, color: "#666" }}>
        Data updated: {meta?.updatedAt ?? "—"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {metrics.slice(0, 27).map((m) => (
          <MiniMap key={m.id} metric={m} />
        ))}
      </div>
    </div>
  );
}
