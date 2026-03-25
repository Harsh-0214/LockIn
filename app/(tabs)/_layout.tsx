import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '@/constants/colors';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  activeIcon: IoniconsName;
  inactiveIcon: IoniconsName;
}

const TABS: TabConfig[] = [
  { name: 'index', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { name: 'body', activeIcon: 'barbell', inactiveIcon: 'barbell-outline' },
  { name: 'notes', activeIcon: 'document-text', inactiveIcon: 'document-text-outline' },
  { name: 'calendar', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { name: 'focus', activeIcon: 'flame', inactiveIcon: 'flame-outline' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.inactiveIcon}
                size={26}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
