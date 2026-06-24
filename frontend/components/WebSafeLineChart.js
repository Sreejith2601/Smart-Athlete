/**
 * WebSafeLineChart.js
 *
 * A cross-platform SVG line chart that works on both native (iOS/Android)
 * and web. It replaces react-native-chart-kit (which has web canvas issues)
 * with a hand-crafted SVG implementation using react-native-svg.
 *
 * react-native-svg is already bundled with Expo and is fully web-compatible
 * via svgo/svg polyfills included in expo's web build.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// react-native-svg is Expo-bundled and web-safe via the Metro alias
import Svg, { Polyline, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

/**
 * @param {object}   props
 * @param {number[]} props.data        — Array of numeric values
 * @param {string[]} props.labels      — X-axis labels (same length as data)
 * @param {number}   props.width       — Chart width in px
 * @param {number}   props.height      — Chart height in px (default 180)
 * @param {string}   props.color       — Line/dot colour (default '#38BDF8')
 * @param {string}   props.labelColor  — Axis label colour (default '#64748B')
 */
export default function WebSafeLineChart({
  data = [4, 6, 5, 8, 7, 5, 4],
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  width = 300,
  height = 180,
  color = '#38BDF8',
  labelColor = '#64748B',
}) {
  const paddingLeft = 24;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 28; // room for x-axis labels

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;

  // Convert data → SVG coords
  const points = data.map((val, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  // Horizontal grid lines (4 segments)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(fraction => {
    const y = paddingTop + fraction * chartHeight;
    return y;
  });

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.15" />
          <Stop offset="1" stopColor={color} stopOpacity="0.01" />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {gridLines.map((y, i) => (
        <Line
          key={i}
          x1={paddingLeft}
          y1={y}
          x2={width - paddingRight}
          y2={y}
          stroke="rgba(226,232,240,0.5)"
          strokeWidth="1"
        />
      ))}

      {/* Area fill below the line */}
      {points.length > 1 && (
        <Polyline
          points={[
            `${points[0].x},${paddingTop + chartHeight}`,
            ...points.map(p => `${p.x},${p.y}`),
            `${points[points.length - 1].x},${paddingTop + chartHeight}`,
          ].join(' ')}
          fill="url(#chartGrad)"
          stroke="none"
        />
      )}

      {/* Line */}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="5"
          fill="#FFFFFF"
          stroke={color}
          strokeWidth="2"
        />
      ))}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = paddingLeft + (i / (labels.length - 1)) * chartWidth;
        return (
          <SvgText
            key={i}
            x={x}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill={labelColor}
            fontWeight="600"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
