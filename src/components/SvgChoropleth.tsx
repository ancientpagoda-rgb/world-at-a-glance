import type { FeatureCollection, Geometry } from "geojson";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { useMemo } from "react";

export default function SvgChoropleth({
  geo,
  values,
  breaks,
  width,
  height,
  onHover,
  onLeave,
}: {
  geo: FeatureCollection<Geometry>;
  values: Record<string, { year: number; value: number }>;
  breaks: number[]; // 4 breakpoints => 5 buckets
  width: number;
  height: number;
  onHover?: (p: { name: string; iso3?: string; year?: number; value?: number }) => void;
  onLeave?: () => void;
}) {
  const { projection, pathGen, features } = useMemo(() => {
    const projection = geoNaturalEarth1();
    projection.fitSize([width, height], geo as any);
    const pathGen = geoPath(projection as any);

    const palette = ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"];
    const colorFor = (value: number) => {
      if (value <= breaks[0]) return palette[0];
      if (value <= breaks[1]) return palette[1];
      if (value <= breaks[2]) return palette[2];
      if (value <= breaks[3]) return palette[3];
      return palette[4];
    };

    const features = geo.features.map((f: any) => {
      const iso3: string | undefined = f.properties?.ISO_A3 || f.properties?.iso_a3;
      const name: string = f.properties?.ADMIN || f.properties?.name || "—";
      const rec = iso3 ? values[iso3] : undefined;
      const v = rec?.value;
      const y = rec?.year;
      const fill = Number.isFinite(v) ? colorFor(v) : "#eeeeee";
      return { f, iso3, name, v, y, fill };
    });

    return { projection, pathGen, features };
  }, [geo, values, breaks, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={0} y={0} width={width} height={height} fill="#fff" />
      <g>
        {features.map(({ f, iso3, name, v, y, fill }, i) => {
          const d = pathGen(f as any) || "";
          return (
            <path
              key={iso3 ?? name + i}
              d={d}
              fill={fill}
              stroke="#999"
              strokeWidth={0.35}
              onMouseMove={() => onHover?.({ name, iso3, year: y, value: v })}
              onMouseLeave={() => onLeave?.()}
            />
          );
        })}
      </g>
    </svg>
  );
}
