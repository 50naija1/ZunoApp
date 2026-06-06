import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../services/context";

const ORANGE = "#f97316";

const COLORS = {
  home:    "#f97316",
  alerts:  "#f59e0b",
  jobs:    "#3b82f6",
  plans:   "#eab308",
  profile: "#22c55e",
  support: "#ffffff",
  artisan: "#f97316",
};

function TabIcon({
  iconName,
  iconNameOutline,
  focused,
  color,
  inactiveColor = "#5a5a6a",
}: {
  iconName: any;
  iconNameOutline: any;
  focused: boolean;
  color: string;
  inactiveColor?: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons
        name={focused ? iconName : iconNameOutline}
        size={26}
        color={focused ? color : inactiveColor}
      />
    </View>
  );
}

function PostJobIcon() {
  return (
    <View style={styles.postJobBtn}>
      <Ionicons name="add" size={32} color="#ffffff" />
    </View>
  );
}

function JobsIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.jobsBtn, focused && styles.jobsBtnFocused]}>
      <Ionicons name="document-text" size={28} color="#ffffff" />
    </View>
  );
}

function Navigation() {
  const { artisanToken, isLoadingAuth } = useAuth();

  const sharedScreenOptions = {
    headerShown: false,
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabLabel,
    tabBarActiveTintColor: ORANGE,
    tabBarInactiveTintColor: "#5a5a6a",
  };

  // ── Wait for AsyncStorage to restore token before showing any nav ──
  // This prevents the customer home page flashing when artisan reopens app
  if (isLoadingAuth) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingBrand}>Zuno</Text>
        <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ─── ARTISAN nav ───────────────────────────────────────────────────────────
  if (artisanToken) {
    return (
      <Tabs screenOptions={sharedScreenOptions}>

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
            tabBarIcon: ({ focused }) => <JobsIcon focused={focused} />,
            tabBarLabel: ({ focused }) => (
              <Text style={[styles.jobsLabel, focused && styles.jobsLabelFocused]}>Jobs</Text>
            ),
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

        {/* ALL hidden screens */}
        <Tabs.Screen name="support"       options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="search"        options={{ href: null }} />
        <Tabs.Screen name="post"          options={{ href: null }} />
        <Tabs.Screen name="context"       options={{ href: null }} />
        <Tabs.Screen name="socket"        options={{ href: null }} />
        <Tabs.Screen name="socketService" options={{ href: null }} />
        <Tabs.Screen name="services"      options={{ href: null }} />

      </Tabs>
    );
  }

  // ─── CUSTOMER nav ──────────────────────────────────────────────────────────
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
        name="post"
        options={{
          title: "Post Job",
          tabBarIcon: () => <PostJobIcon />,
          tabBarLabel: () => <Text style={styles.postJobLabel}>Post Job</Text>,
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

      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconName="chatbubble-ellipses"
              iconNameOutline="chatbubble-ellipses-outline"
              focused={focused}
              color={COLORS.support}
              inactiveColor="#ffffff"
            />
          ),
          tabBarActiveTintColor: COLORS.support,
          tabBarInactiveTintColor: "#ffffff",
        }}
      />

      {/* ALL hidden screens */}
      <Tabs.Screen name="search"        options={{ href: null }} />
      <Tabs.Screen name="jobs"          options={{ href: null }} />
      <Tabs.Screen name="plans"         options={{ href: null }} />
      <Tabs.Screen name="profile"       options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="context"       options={{ href: null }} />
      <Tabs.Screen name="socket"        options={{ href: null }} />
      <Tabs.Screen name="socketService" options={{ href: null }} />
      <Tabs.Screen name="services"      options={{ href: null }} />

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

const styles = StyleSheet.create({
  // ── Loading screen shown while token restores from AsyncStorage ──
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBrand: {
    color: "#f97316",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },

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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 34,
  },
  postJobBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
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
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  jobsBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    elevation: 10,
    shadowColor: "#3b82f6",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: "#0f0f0f",
  },
  jobsBtnFocused: {
    backgroundColor: "#2563eb",
    shadowOpacity: 0.75,
  },
  jobsLabel: {
    color: "#3b82f6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  jobsLabelFocused: {
    color: "#2563eb",
  },
});