import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type LogoProps = {
  size?: number;
};

export function Logo({ size = 72 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <Defs>
        <LinearGradient id="badge" x1="0" y1="0" x2="72" y2="72">
          <Stop offset="0" stopColor="#60a5fa" />
          <Stop offset="1" stopColor="#1d4ed8" />
        </LinearGradient>
      </Defs>

      <Rect width={72} height={72} rx={20} fill="url(#badge)" />

      <Circle cx={36} cy={36} r={19} stroke="#eff6ff" strokeOpacity={0.35} strokeWidth={1.5} />
      <Circle cx={36} cy={36} r={12.5} stroke="#eff6ff" strokeOpacity={0.5} strokeWidth={1.5} />

      <Path d="M36 36 L36 17 A19 19 0 0 1 52.4 45.5 Z" fill="#eff6ff" fillOpacity={0.25} />

      <Circle cx={36} cy={36} r={3.5} fill="#eff6ff" />
      <Circle cx={47} cy={26} r={3} fill="#f59e0b" />
    </Svg>
  );
}
