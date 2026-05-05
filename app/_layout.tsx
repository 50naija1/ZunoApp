import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { AuthProvider, useAuth } from "./context";

function Navigation() {
  const { artisanToken } = useAuth();

  if (artisanToken) {
    // ARTISAN NAV — 6 items
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopColor: "#eeeeee",
            height: 70,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: "#f97316",
          tabBarInactiveTintColor: "#999999",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color }) => (
              <Ionicons name="notifications" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ color }) => (
              <Ionicons name="briefcase" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plans"
          options={{
            title: "Plans",
            tabBarIcon: ({ color }) => (
              <Ionicons name="star" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: "Support",
            tabBarIcon: ({ color }) => (
              <Ionicons name="chatbubble" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="post" options={{ href: null }} />
        <Tabs.Screen name="artisan" options={{ href: null }} />
      </Tabs>
    );
  }

  // CLIENT NAV — 5 items
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#eeeeee",
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#999999",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "",
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: "#f97316",
              alignItems: "center", justifyContent: "center",
              marginBottom: 20,
              elevation: 10,
            }}>
              <Ionicons name="add" size={32} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="artisan"
        options={{
          title: "Artisan",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="plans" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
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