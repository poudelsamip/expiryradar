import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_COLOR = '#2563eb';
const INACTIVE_COLOR = '#94a3b8';

const BAR_HEIGHT = 68;
const BUTTON_SIZE = 64;
// Roughly a third of the button sits above the bar. The container reserves that
// space as transparent padding instead of letting the button overflow, because
// Android drops touches on anything drawn outside its parent's bounds.
const OVERHANG = Math.round(BUTTON_SIZE / 3);

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const renderTab = (route: BottomTabBarProps['state']['routes'][number], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        className="flex-1 items-center justify-center gap-1 active:opacity-70"
      >
        {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
        <Text
          className="font-sans-semibold text-[11px]"
          style={{ color }}
          numberOfLines={1}
        >
          {options.title ?? route.name}
        </Text>
      </Pressable>
    );
  };

  // Two tabs sit on each side of the centered add button so it lands on the
  // exact middle of the bar.
  const half = Math.ceil(state.routes.length / 2);

  return (
    <View
      className="flex-row items-center"
      style={{
        height: BAR_HEIGHT + OVERHANG + insets.bottom,
        paddingTop: OVERHANG,
        paddingBottom: insets.bottom,
      }}
    >
      {/* The visible bar starts below the overhang; the strip above it is
          transparent so the screen shows through around the add button. */}
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 border-t border-ink-100 bg-white"
        style={{ top: OVERHANG }}
      />

      {state.routes.slice(0, half).map((route, index) => renderTab(route, index))}

      <View
        className="w-[80px] items-center"
        style={{ transform: [{ translateY: -(OVERHANG + (BAR_HEIGHT - BUTTON_SIZE) / 2) }] }}
      >
        <Pressable
          onPress={() => router.push('/add-item')}
          accessibilityRole="button"
          accessibilityLabel="Add item"
          hitSlop={6}
          className="overflow-hidden rounded-full active:opacity-90"
        >
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {state.routes.slice(half).map((route, index) => renderTab(route, index + half))}
    </View>
  );
}
