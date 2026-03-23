import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G, Path, Rect, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TextureBackground = () => {
  const mapW = SCREEN_WIDTH;
  const mapH = SCREEN_HEIGHT * 2;
  const opacity = 0.15;
  const stroke = '#8B7355';

  // Compass rose center (bottom-left area, like the reference image)
  const cx1 = mapW * 0.15;
  const cy1 = mapH * 0.38;
  const r1 = 70;

  // Smaller compass/helm (top-right area)
  const cx2 = mapW * 0.82;
  const cy2 = mapH * 0.12;
  const r2 = 45;

  const compassStar = (cx: number, cy: number, r: number) => {
    const pts = 16;
    let d = '';
    for (let i = 0; i <= pts; i++) {
      const angle = (i * 360) / pts - 90;
      const rad = (angle * Math.PI) / 180;
      const outerR = i % 2 === 0 ? r : r * 0.4;
      const x = cx + outerR * Math.cos(rad);
      const y = cy + outerR * Math.sin(rad);
      d += (i === 0 ? 'M' : 'L') + `${x},${y} `;
    }
    return d + 'Z';
  };

  // Rhumb lines radiating from compass centers
  const rhumbLines = (cx: number, cy: number, count: number, length: number) => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 360) / count;
      const rad = (angle * Math.PI) / 180;
      lines.push({
        x1: cx,
        y1: cy,
        x2: cx + length * Math.cos(rad),
        y2: cy + length * Math.sin(rad),
      });
    }
    return lines;
  };

  // Generate grid lines directly (Pattern fills don't render in react-native-svg)
  const gridSpacing = 50;
  const verticalGridLines = Array.from({ length: Math.ceil(mapW / gridSpacing) + 1 }).map((_, i) => i * gridSpacing);
  const horizontalGridLines = Array.from({ length: Math.ceil(mapH / gridSpacing) + 1 }).map((_, i) => i * gridSpacing);

  // Generate paper fiber texture marks directly
  const fiberRows = Math.ceil(mapH / 60);
  const fiberCols = Math.ceil(mapW / 60);

  return (
    <View style={styles.textureContainer} pointerEvents="none">
      <Svg width={mapW} height={mapH} style={styles.textureSvg}>

        {/* Paper fiber texture - rendered directly instead of via Pattern */}
        {Array.from({ length: fiberRows }).map((_, row) =>
          Array.from({ length: fiberCols }).map((_, col) => {
            const ox = col * 60;
            const oy = row * 60;
            return (
              <G key={`fiber-${row}-${col}`}>
                <Line x1={ox + 5} y1={oy + 12} x2={ox + 15} y2={oy + 13} stroke="#E0DAD0" strokeWidth="0.5" opacity="0.4" />
                <Line x1={ox + 35} y1={oy + 8} x2={ox + 42} y2={oy + 9} stroke="#DDD7CB" strokeWidth="0.4" opacity="0.3" />
                <Line x1={ox + 48} y1={oy + 25} x2={ox + 56} y2={oy + 26} stroke="#E0DAD0" strokeWidth="0.5" opacity="0.35" />
                <Line x1={ox + 12} y1={oy + 38} x2={ox + 22} y2={oy + 39} stroke="#DDD7CB" strokeWidth="0.4" opacity="0.4" />
                <Circle cx={ox + 10} cy={oy + 20} r={0.6} fill="#D5CFC3" opacity="0.3" />
                <Circle cx={ox + 45} cy={oy + 15} r={0.5} fill="#DBD5C9" opacity="0.25" />
                <Circle cx={ox + 25} cy={oy + 42} r={0.6} fill="#D5CFC3" opacity="0.35" />
              </G>
            );
          })
        )}

        {/* Map grid overlay - rendered as direct lines */}
        {verticalGridLines.map((x, i) => (
          <Line key={`gv-${i}`} x1={x} y1={0} x2={x} y2={mapH} stroke={stroke} strokeWidth="0.5" opacity={0.045} />
        ))}
        {horizontalGridLines.map((y, i) => (
          <Line key={`gh-${i}`} x1={0} y1={y} x2={mapW} y2={y} stroke={stroke} strokeWidth="0.5" opacity={0.045} />
        ))}

        {/* Rhumb lines from bottom-left compass */}
        {rhumbLines(cx1, cy1, 32, Math.max(mapW, mapH)).map((l, i) => (
          <Line
            key={`rhumb1-${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={stroke}
            strokeWidth={i % 4 === 0 ? 0.8 : 0.4}
            opacity={i % 4 === 0 ? opacity : opacity * 0.5}
          />
        ))}

        {/* Rhumb lines from top-right compass */}
        {rhumbLines(cx2, cy2, 16, Math.max(mapW, mapH) * 0.6).map((l, i) => (
          <Line
            key={`rhumb2-${i}`}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={stroke}
            strokeWidth={0.4}
            opacity={opacity * 0.4}
          />
        ))}

        {/* Bottom-left compass rose */}
        <G opacity={opacity * 2.5}>
          <Circle cx={cx1} cy={cy1} r={r1} stroke={stroke} strokeWidth="1.2" fill="none" />
          <Circle cx={cx1} cy={cy1} r={r1 * 0.85} stroke={stroke} strokeWidth="0.6" fill="none" />
          <Circle cx={cx1} cy={cy1} r={r1 * 0.15} stroke={stroke} strokeWidth="0.8" fill={stroke} opacity="0.3" />
          <Path d={compassStar(cx1, cy1, r1 * 0.8)} stroke={stroke} strokeWidth="0.8" fill={stroke} opacity="0.15" />
          {/* Degree tick marks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            const inner = i % 9 === 0 ? r1 * 0.88 : r1 * 0.93;
            return (
              <Line
                key={`tick1-${i}`}
                x1={cx1 + inner * Math.cos(angle)}
                y1={cy1 + inner * Math.sin(angle)}
                x2={cx1 + r1 * Math.cos(angle)}
                y2={cy1 + r1 * Math.sin(angle)}
                stroke={stroke}
                strokeWidth={i % 9 === 0 ? 1 : 0.4}
              />
            );
          })}
        </G>

        {/* Top-right helm/compass */}
        <G opacity={opacity * 2}>
          <Circle cx={cx2} cy={cy2} r={r2} stroke={stroke} strokeWidth="1" fill="none" />
          <Circle cx={cx2} cy={cy2} r={r2 * 0.7} stroke={stroke} strokeWidth="0.5" fill="none" />
          <Circle cx={cx2} cy={cy2} r={r2 * 0.12} stroke={stroke} strokeWidth="0.6" fill={stroke} opacity="0.3" />
          <Path d={compassStar(cx2, cy2, r2 * 0.65)} stroke={stroke} strokeWidth="0.6" fill={stroke} opacity="0.12" />
          {/* Helm spokes */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            return (
              <Line
                key={`spoke-${i}`}
                x1={cx2 + r2 * 0.7 * Math.cos(angle)}
                y1={cy2 + r2 * 0.7 * Math.sin(angle)}
                x2={cx2 + r2 * 1.08 * Math.cos(angle)}
                y2={cy2 + r2 * 1.08 * Math.sin(angle)}
                stroke={stroke}
                strokeWidth="1.5"
              />
            );
          })}
          {/* Helm handle circles */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            return (
              <Circle
                key={`handle-${i}`}
                cx={cx2 + r2 * 1.12 * Math.cos(angle)}
                cy={cy2 + r2 * 1.12 * Math.sin(angle)}
                r={3}
                stroke={stroke}
                strokeWidth="0.8"
                fill="none"
              />
            );
          })}
        </G>

        {/* Decorative border dashes (top) */}
        {Array.from({ length: Math.ceil(mapW / 20) }).map((_, i) => (
          <React.Fragment key={`border-${i}`}>
            <Rect x={i * 20} y={0} width={10} height={6} fill={stroke} opacity={0.12} />
            <Rect x={i * 20 + 10} y={0} width={10} height={6} fill={stroke} opacity={0.04} />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  textureContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  textureSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default TextureBackground;
