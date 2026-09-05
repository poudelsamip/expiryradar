import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type PulseProps = {
  delay: number;
  color?: string;
};

// Expanding ring behind a blip, gives the "just detected on radar" feel.
function Pulse({ delay, color = 'bg-brand-300' }: PulseProps) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(2, { duration: 1800, easing: Easing.out(Easing.ease) }), -1)
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }), -1)
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View className={`absolute h-9 w-9 rounded-full ${color}`} style={style} />;
}

type BlipConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  x: number;
  y: number;
  delay: number;
};

const BLIPS: BlipConfig[] = [
  { icon: 'fast-food-outline', x: -94, y: -30, delay: 0 },
  { icon: 'document-text-outline', x: 76, y: -72, delay: 300 },
  { icon: 'card-outline', x: 96, y: 46, delay: 600 },
  { icon: 'refresh-outline', x: -82, y: 72, delay: 900 },
];

type RadarBlipsProps = {
  size?: number;
};

// Category icons scattered around the radar like items the app has "found".
export function RadarBlips({ size = 280 }: RadarBlipsProps) {
  const center = size / 2;

  return (
    <View className="absolute" style={{ width: size, height: size }} pointerEvents="none">
      {BLIPS.map(({ icon, x, y, delay }) => (
        <View
          key={icon}
          className="absolute h-9 w-9 items-center justify-center"
          style={{ left: center + x - 18, top: center + y - 18 }}
        >
          <Pulse delay={delay} />
          <View className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-ink-900/70">
            <Ionicons name={icon} size={15} color="#dbeafe" />
          </View>
        </View>
      ))}
    </View>
  );
}

type CalloutExample = {
  label: string;
  sub: string;
  dotClass: string;
  textClass: string;
};

// Rotates through the app's main categories so the splash doesn't read as food-only.
const CALLOUT_EXAMPLES: CalloutExample[] = [
  { label: 'Milk', sub: 'Expires in 2 days', dotClass: 'bg-amber-500', textClass: 'text-amber-400' },
  { label: 'Passport', sub: 'Expires in 3 weeks', dotClass: 'bg-sky-500', textClass: 'text-sky-400' },
  { label: 'Netflix', sub: 'Renews in 5 days', dotClass: 'bg-violet-500', textClass: 'text-violet-400' },
];

// Concrete "expiring soon" example, grounds the pitch in a real item instead of an icon.
export function ExpiryCallout() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % CALLOUT_EXAMPLES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const example = CALLOUT_EXAMPLES[index];

  return (
    <Animated.View
      key={example.label}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className="absolute -right-3 top-4 flex-row items-center gap-2 rounded-2xl border border-white/15 bg-ink-900/85 py-2 pl-2 pr-3"
    >
      <View className="h-6 w-6 items-center justify-center">
        <Pulse delay={0} color={example.dotClass} />
        <View className={`h-2.5 w-2.5 rounded-full ${example.dotClass}`} />
      </View>
      <View>
        <Text className="font-sans-semibold text-[11px] text-white">{example.label}</Text>
        <Text className={`font-sans-medium text-[10px] ${example.textClass}`}>{example.sub}</Text>
      </View>
    </Animated.View>
  );
}
