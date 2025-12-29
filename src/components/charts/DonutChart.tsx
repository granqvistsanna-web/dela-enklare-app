import { motion } from "framer-motion";

export interface DonutChartData {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 200, centerLabel, centerValue }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Ingen data tillgänglig
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2;
  const strokeWidth = size * 0.15;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;

  let currentAngle = -90; // Start at top

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />

          {/* Segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const segmentLength = (circumference * percentage) / 100;
            const offset = circumference - segmentLength;

            const segment = (
              <motion.circle
                key={index}
                cx={radius}
                cy={radius}
                r={innerRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-currentAngle * (circumference / 360)}
                className={item.color}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${segmentLength} ${circumference - segmentLength}` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            );

            currentAngle += (percentage / 100) * 360;

            return segment;
          })}
        </svg>

        {/* Center label */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <div className="text-2xl font-bold text-foreground">{centerValue}</div>
            )}
            {centerLabel && (
              <div className="text-xs text-muted-foreground">{centerLabel}</div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <motion.div
              key={index}
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-lg mr-1">{item.icon}</span>
              <span className="text-foreground flex-1 truncate">{item.label}</span>
              <span className="text-muted-foreground font-medium tabular-nums">
                {percentage}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
