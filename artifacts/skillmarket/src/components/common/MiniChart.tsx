import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint { month: string; value: number }

interface Props {
  data: DataPoint[];
  type?: "area" | "bar";
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  label?: string;
}

function fmt(v: number, prefix = "", suffix = "") {
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(1)}M${suffix}`;
  if (v >= 1_000) return `${prefix}${(v / 1_000).toFixed(0)}k${suffix}`;
  return `${prefix}${v}${suffix}`;
}

export default function MiniChart({
  data,
  type = "area",
  color = "#6366f1",
  valuePrefix = "",
  valueSuffix = "",
  height = 160,
  label,
}: Props) {
  if (!data || data.length === 0) return null;

  const CustomTooltip = ({ active, payload, label: lbl }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-xs">
        <p className="text-gray-500 mb-0.5">{lbl}</p>
        <p className="font-bold text-gray-900">{valuePrefix}{payload[0].value.toLocaleString()}{valueSuffix}</p>
      </div>
    );
  };

  return (
    <div>
      {label && <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">{label}</p>}
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, valuePrefix, valueSuffix)} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v, valuePrefix, valueSuffix)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
              fill={`url(#grad-${color.replace("#", "")})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
