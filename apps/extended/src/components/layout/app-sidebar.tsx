"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Library,
  FileText,
  Settings,
  Calculator,
  Layers,
  Check,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Edition configuration - Extended Edition
const CURRENT_EDITION = "EXTENDED";

const editions = [
  {
    id: "SBO",
    name: "SBO Edition",
    port: 3002,
    description: "Small Business Owner",
    color: "from-blue-500 to-blue-700",
    textColor: "text-blue-600",
  },
  {
    id: "EXTENDED",
    name: "Extended",
    port: 3003,
    description: "BIM & Kengetallen",
    color: "from-purple-500 to-purple-700",
    textColor: "text-purple-600",
  },
  {
    id: "ESTIMATOR",
    name: "Estimator Pro",
    port: 3004,
    description: "Enterprise",
    color: "from-amber-500 to-amber-700",
    textColor: "text-amber-600",
  },
];

const currentEditionConfig = editions.find((e) => e.id === CURRENT_EDITION) || editions[0];

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projecten",
    url: "/projects",
    icon: FolderOpen,
  },
  {
    title: "Begrotingen",
    url: "/estimates",
    icon: FileText,
  },
  {
    title: "Kostenbibliotheek",
    url: "/library",
    icon: Library,
  },
];

const settingsItems = [
  {
    title: "Instellingen",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const handleEditionSwitch = (port: number) => {
    const currentPath = window.location.pathname;
    window.location.href = `http://localhost:${port}${currentPath}`;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${currentEditionConfig.color} shadow-md`}>
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">OpenCalc</span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Extended Edition</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + "/")}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Beheer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Edition Switcher */}
        <SidebarGroup>
          <SidebarGroupLabel>Editie</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <Layers className="h-4 w-4" />
                      <span className="flex-1 text-left">{currentEditionConfig.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${currentEditionConfig.textColor} bg-current/10`}>
                        :{currentEditionConfig.port}
                      </span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>Switch Editie</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {editions.map((edition) => (
                      <DropdownMenuItem
                        key={edition.id}
                        onClick={() => handleEditionSwitch(edition.port)}
                        className="cursor-pointer"
                      >
                        <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${edition.color} mr-2`} />
                        <div className="flex-1">
                          <div className="font-medium">{edition.name}</div>
                          <div className="text-xs text-muted-foreground">{edition.description}</div>
                        </div>
                        {edition.id === CURRENT_EDITION && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="w-full h-auto py-2 hover:bg-purple-50/80">
              <Link href="/settings">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${currentEditionConfig.color} flex items-center justify-center shadow-sm`}>
                    <span className="text-sm font-semibold text-white">O</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">OpenCalc Gebruiker</p>
                    <p className="text-xs text-muted-foreground truncate">Publieke toegang</p>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
