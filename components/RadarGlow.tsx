import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';

type RadarGlowProps = {
  size?: number;
  className?: string;
};

// Faint concentric rings used as a decorative accent behind branded surfaces
// (splash background, auth headers). Purely visual — no interaction.
export function RadarGlow({ size = 420, className }: RadarGlowProps) {
  const center = size / 2;
  const rings = [0.98, 0.78, 0.58, 0.38, 0.2];

  return (
    <View className={className} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((ratio, index) => (
          <Circle
            key={index}
            cx={center}
            cy={center}
            r={center * ratio}
            stroke="#eff6ff"
            strokeOpacity={0.06 + index * 0.015}
            strokeWidth={1}
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}
