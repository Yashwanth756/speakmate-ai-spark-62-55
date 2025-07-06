
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Mic, 
  MessageSquare, 
  Award, 
  Book, 
  BarChart, 
  Headphones, 
  Zap,
  Settings,
  Play,
  ArrowLeft,
  Trophy // Import Trophy icon for Quick Quiz
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { title } from "process";

const navItems = [
  // { title: "teacher dashboard", route: "/teacher/dashboard", icon: ArrowLeft },
  { title: "Dashboard", route: "/", icon: LayoutDashboard },
  { title: "Speaking Practice", route: "/speaking", icon: Mic },
  { title: "Conversation AI", route: "/conversation", icon: MessageSquare },
  { title: "Word Puzzles", route: "/word-puzzle", icon: Play },
  // { title: "Reflex Challenge", route: "/reflex", icon: Zap },
  { title: "Pronunciation Mirror", route: "/pronunciation", icon: Headphones },
  { title: "Story Builder", route: "/story", icon: Book },
  { title: "Vocabulary Trainer", route: "/vocabulary", icon: Book },
  { title: "Grammar Clinic", route: "/grammar", icon: Book },
  // Insert Quick Quiz here (below Grammar Clinic)
  { title: "Quick Quiz", route: "/quick-quiz", icon: Trophy },
  // Progress Report now follows
  { title: "Progress Report", route: "/progress", icon: BarChart },
  { title: "Settings", route: "/settings", icon: Settings }
];

export function AppSidebar() {
  // Get current path to highlight active route
  const currentPath = window.location.pathname;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Hide sidebar on teacher dashboard route
  if (
    currentPath === "/teacher/dashboard"
  ) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-playfair text-xl text-primary flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-pulse">Echo.ai</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={currentPath === item.route}
                    onMouseEnter={() => {
                      setHoveredItem(item.title);
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link 
                      to={item.route} 
                      className={`flex items-center gap-3 text-base py-2 px-3 rounded-lg transition-all duration-300 hover:bg-primary/20 ${
                        hoveredItem === item.title ? 'scale-105' : ''
                      } ${currentPath === item.route ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/10'}`}
                    >
                      <item.icon className={`w-5 h-5 ${currentPath === item.route ? 'animate-pulse' : ''}`} />
                      <span className="transition-all duration-300">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AppSidebar;
