const COLORS = ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"];

export default function Legend({
  breaks,
  fmt,
}: {
  breaks: number[]; // 4 breaks
  fmt: (x: number) => string;
}) {
  const labels = [
    `≤ ${fmt(breaks[0])}`,
    `≤ ${fmt(breaks[1])}`,
    `≤ ${fmt(breaks[2])}`,
    `≤ ${fmt(breaks[3])}`,
    `> ${fmt(breaks[3])}`,
  ];

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {labels.map((lab, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: COLORS[i],
              border: "1px solid #bbb",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, color: "#555" }}>{lab}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            background: "#eee",
            border: "1px solid #bbb",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 12, color: "#555" }}>No data</span>
      </div>
    </div>
  );
}
