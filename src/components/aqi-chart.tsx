import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AirPoint } from "@/lib/air";
import { formatHour, formatStamp } from "@/lib/format";

export default function AqiChart({ points }: { points: AirPoint[] }) {
  const data = points.map((point) => ({
    label: formatHour(point.t),
    full: formatStamp(point.t),
    aqi: point.aqi,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            interval={7}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={36}
            domain={[0, "auto"]}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--fg)",
              fontSize: 14,
            }}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as { full?: string } | undefined;
              return row?.full ?? "";
            }}
          />
          <Line
            type="monotone"
            dataKey="aqi"
            name="US AQI"
            stroke="var(--fg)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
