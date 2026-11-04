import { Tabs } from "expo-router/js-tabs";
import { TabBar } from "@/components/TabBar";
import { useHome, useNotifications } from "@/lib/queries";

export default function TabsLayout() {
  const home = useHome();
  const notes = useNotifications();
  const badges = { in: home.data?.comingIn.lateCount ?? 0, inbox: notes.data?.unread ?? 0 };
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} badges={badges} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="in" />
      <Tabs.Screen name="out" />
      <Tabs.Screen name="inbox" />
    </Tabs>
  );
}
