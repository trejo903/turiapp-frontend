import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarLabelStyle:{fontSize:12},
        headerTitleAlign:"left"
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:"Inicio",
          tabBarIcon:({color,size})=>(
            <MaterialCommunityIcons name="home" color={color} size={size}/>
          )
        }}
      />
      <Tabs.Screen
        name="usuario"
        options={{
          title:"Usuario",
          tabBarIcon:({color,size})=>(
            <MaterialCommunityIcons name="account" color={color} size={size}/>
          )
        }}
      />
    </Tabs>
  )
}
