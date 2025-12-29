import { motion } from "framer-motion";

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  formatValue?: (value: number) => string;
}

export function BarChart({ data, height = 200, formatValue }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Ingen data tillgänglig
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-muted-foreground pr-2">
          <span>{formatValue ? formatValue(maxValue) : `${Math.round(maxValue)} kr`}</span>
          <span>{formatValue ? formatValue(maxValue / 2) : `${Math.round(maxValue / 2)} kr`}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-12 right-0 top-0 bottom-6">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Grid lines */}
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
              strokeDasharray="4"
            />
            <line
              x1="0"
              y1="100%"
              x2="100%"
              y2="100%"
              stroke="currentColor"
              strokeWidth="1"
              className="text-border"
            />

            {/* Bars */}
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * 100;
              const x = `${index * barWidth + barWidth * 0.2}%`;
              const barWidthPercent = `${barWidth * 0.6}%`;

              return (
                <g key={index}>
                  <motion.rect
                    x={x}
                    y={`${100 - barHeight}%`}
                    width={barWidthPercent}
                    height="0%"
                    fill="currentColor"
                    className={item.color || "text-primary"}
                    rx="4"
                    initial={{ height: "0%" }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex mt-2 ml-12">
        {data.map((item, index) => (
          <div
            key={index}
            className="text-xs text-muted-foreground text-center"
            style={{ width: `${barWidth}%` }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
