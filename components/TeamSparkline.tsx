// ============================================================
// TeamSparkline.tsx — Sparkline minimalista para o Painel da Equipe
// Gráfico compacto de 6 pontos com polyline suave + marcador
// ============================================================
import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';

interface TeamSparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export default function TeamSparkline({
  data,
  color,
  width = 96,
  height = 28,
}: TeamSparklineProps) {
  const padding = 3;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const allZero = data.every((v) => v === 0);
  const maxVal = Math.max(...data, 1);

  const points = data
    .map((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = allZero
        ? height / 2
        : padding + chartHeight - (value / maxVal) * chartHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const lastPoint = data.length > 0
    ? {
        x: padding + ((data.length - 1) / (data.length - 1)) * chartWidth,
        y: allZero
          ? height / 2
          : padding + chartHeight - (data[data.length - 1] / maxVal) * chartHeight,
      }
    : { x: 0, y: 0 };

  const maxY = padding;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {!allZero && (
          <Line
            x1={padding}
            y1={maxY}
            x2={width - padding}
            y2={maxY}
            stroke={color}
            strokeWidth={0.5}
            strokeDasharray="2,2"
            opacity={0.3}
          />
        )}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={allZero ? 0.3 : 1}
        />
        {!allZero && (
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={2.5}
            fill={color}
          />
        )}
      </Svg>
    </View>
  );
}
