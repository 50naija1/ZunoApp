import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "./context";

const ORANGE = "#f97316";

// ─── Colors per tab ───────────────────────────────────────────────────────────
const COLORS = {
  home:    "#f97316",
  alerts:  "#f59e0b",
  jobs:    "#3b82f6",
  plans:   "#eab308",
  profile: "#22c55e",
  support: "#a855f7",
  search:  "#06b6d4",
  artisan: "#f97316",
};

// ─── Clean icon — colored when focused, grey when not. No dot. ────────────────
function TabIcon({
  iconName,
  iconNameOutline,
  focused,
  color,
}: {
  iconName: any;
  iconNameOutline: any;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? iconName : iconNameOutline}
        size={28}
        color={focused ? color : "#5a5a6a"}
      />
    </View>
  );
}

// ─── Post Job centre button (customer only) ───────────────────────────────────
function PostJobIcon() {
  return (
    <View style={styles.postJobBtn}>
      <Ionicons name="add" size={34} color="#ffffff" />
    </View>
  );
}

function Navigation() {
  const { artisanToken } = useAuth();

  const sharedScreenOptions = {
    headerShown: false,
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabLabel,
    tabBarActiveTintColor: ORANGE,
    tabBarInactiveTintColor: "#5a5a6a",
  };

  // ─── ARTISAN nav ──────────────────────────────────────────────────────────
  if (artisanToken) {
    return (
      <Tabs screenOptions={sharedScreenOptions}>

        {/* index hidden — artisan tab is Home */}
        <Tabs.Screen name="index" options={{ href: null }} />

        <Tabs.Screen
          name="artisan"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="home" iconNameOutline="home-outline" focused={focused} color={COLORS.home} />
            ),
            tabBarActiveTintColor: COLORS.home,
          }}
        />

        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="notifications" iconNameOutline="notifications-outline" focused={focused} color={COLORS.alerts} />
            ),
            tabBarActiveTintColor: COLORS.alerts,
          }}
        />

        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="document-text" iconNameOutline="document-text-outline" focused={focused} color={COLORS.jobs} />
            ),
            tabBarActiveTintColor: COLORS.jobs,
          }}
        />

        <Tabs.Screen
          name="plans"
          options={{
            title: "Plans",
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="star" iconNameOutline="star-outline" focused={focused} color={COLORS.plans} />
            ),
            tabBarActiveTintColor: COLORS.plans,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="person" iconNameOutline="person-outline" focused={focused} color={COLORS.profile} />
            ),
            tabBarActiveTintColor: COLORS.profile,
          }}
        />

        <Tabs.Screen
          name="support"
          options={{
            title: "Support",
            tabBarIcon: ({ focused }) => (
              <TabIcon iconName="chatbubble" iconNameOutline="chatbubble-outline" focused={focused} color={COLORS.support} />
            ),
            tabBarActiveTintColor: COLORS.support,
          }}
        />

        {/* ─── ALL hidden screens — keep functions, remove icons ─────────── */}
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="search"        options={{ href: null }} />
        <Tabs.Screen name="post"          options={{ href: null }} />
        <Tabs.Screen name="context"       options={{ href: null }} />

      </Tabs>
    );
  }

  // ─── CUSTOMER nav ─────────────────────────────────────────────────────────
  return (
    <Tabs screenOptions={sharedScreenOptions}>

      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" iconNameOutline="home-outline" focused={focused} color={COLORS.home} />
          ),
          tabBarActiveTintColor: COLORS.home,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="search" iconNameOutline="search-outline" focused={focused} color={COLORS.search} />
          ),
          tabBarActiveTintColor: COLORS.search,
        }}
      />

      {/* Centre Post Job button */}
      <Tabs.Screen
        name="post"
        options={{
          title: "Post Job",
          tabBarIcon: () => <PostJobIcon />,
          tabBarLabel: () => <Text style={styles.postJobLabel}>Post Job</Text>,
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="notifications" iconNameOutline="notifications-outline" focused={focused} color={COLORS.alerts} />
          ),
          tabBarActiveTintColor: COLORS.alerts,
        }}
      />

      <Tabs.Screen
        name="artisan"
        options={{
          title: "Artisan",
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" iconNameOutline="person-outline" focused={focused} color={COLORS.artisan} />
          ),
          tabBarActiveTintColor: COLORS.artisan,
        }}
      />

      {/* Hidden artisan-side screens */}
      <Tabs.Screen name="jobs"          options={{ href: null }} />
      <Tabs.Screen name="plans"         options={{ href: null }} />
      <Tabs.Screen name="profile"       options={{ href: null }} />
      <Tabs.Screen name="support"       options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="context"       options={{ href: null }} />

    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0f0f0f",
    borderTopColor: "#1e1e1e",
    borderTopWidth: 1,
    height: 82,
    paddingBottom: 14,
    paddingTop: 8,
    elevation: 24,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 34,
  },
  postJobBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    elevation: 10,
    shadowColor: ORANGE,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#0f0f0f",
  },
  postJobLabel: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});