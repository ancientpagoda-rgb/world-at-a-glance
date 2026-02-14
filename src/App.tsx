import ChoroplethGrid from "./components/ChoroplethGrid";

export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 6px" }}>World at a Glance</h1>
      <div style={{ color: "#555", marginBottom: 14 }}>
        27 latest-value choropleths (daily refreshed)
      </div>
      <ChoroplethGrid />
    </div>
  );
}
