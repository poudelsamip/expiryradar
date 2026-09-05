import { useEffect } from 'react';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type RadarSweepProps = {
  size?: number;
};

// Rotating beam behind the hero mark, sells the "scanning" metaphor at a glance.
export function RadarSweep({ size = 280 }: RadarSweepProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 3600, easing: Easing.linear }), -1, false);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const center = size / 2;
  const angle = (68 * Math.PI) / 180;
  const edgeX = center + center * Math.sin(angle);
  const edgeY = center - center * Math.cos(angle);

  return (
    <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#bfdbfe" stopOpacity={0.32} />
            <Stop offset="1" stopColor="#bfdbfe" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Path
          d={`M${center} ${center} L${center} 0 A${center} ${center} 0 0 1 ${edgeX} ${edgeY} Z`}
          fill="url(#sweep)"
        />
      </Svg>
    </Animated.View>
  );
}
