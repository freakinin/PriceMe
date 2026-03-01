import { Home, PlusCircle, Package, Settings, LogOut, Box, Map, ShoppingCart, Tag, ChartScatter, BrainCircuit, Truck } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

interface AppSidebarProps {
  onSettingsOpen: () => void;
}

export function AppSidebar({ onSettingsOpen }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="PriceMe"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group/logo"
            >
              <Link to="/">
                <div className="flex h-8 w-8 items-center justify-center">
                  <ChartScatter className="size-6" style={{ color: 'hsl(var(--secondary))' }} />
                </div>
                <div className="grid flex-1 text-left leading-tight text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }}>
                  <span className="truncate font-bold text-2xl tracking-tight text-sidebar-foreground pt-1">PriceMe</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  tooltip="Home"
                  className="text-sidebar-foreground"
                  style={{ color: 'hsl(0 0% 98%)' }}
                >
                  <Link to="/" style={{ color: 'hsl(0 0% 98%)' }}>
                    <Home className="h-4 w-4 text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }} />
                    <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/products/add'}
                  tooltip="Add Product"
                  className="text-sidebar-foreground font-medium"
                  style={{ color: 'hsl(var(--secondary))' }}
                >
                  <Link to="/products/add">
                    <PlusCircle className="h-4 w-4" style={{ color: 'hsl(var(--secondary))' }} />
                    <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(var(--secondary))' }}>Add Product</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarSeparator className="my-2 bg-white/10" />

              {[
                { title: 'Coach', url: '/coach', icon: BrainCircuit },
                { title: 'On Sale', url: '/on-sale', icon: ShoppingCart },
                { title: 'Products', url: '/products', icon: Package },
                { title: 'Materials', url: '/materials', icon: Box },
                { title: 'Suppliers', url: '/suppliers', icon: Truck },
                { title: 'Categories', url: '/categories', icon: Tag },
              ].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                    className="text-sidebar-foreground"
                    style={{ color: 'hsl(0 0% 98%)' }}
                  >
                    <Link to={item.url} style={{ color: 'hsl(0 0% 98%)' }}>
                      <item.icon className="h-4 w-4 text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }} />
                      <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              onClick={onSettingsOpen}
              className="text-sidebar-foreground"
              style={{ color: 'hsl(0 0% 98%)' }}
            >
              <Settings className="h-4 w-4 text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }} />
              <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === '/roadmap'}
              tooltip="Roadmap"
              className="text-sidebar-foreground"
              style={{ color: 'hsl(0 0% 98%)' }}
            >
              <Link to="/roadmap" style={{ color: 'hsl(0 0% 98%)' }}>
                <Map className="h-4 w-4 text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }} />
                <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>Roadmap</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex w-full items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton
                asChild
                tooltip="Logout"
                className="p-0 h-auto w-auto bg-transparent hover:bg-transparent" // Make the button itself transparent for the avatar
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:cursor-pointer group-data-[collapsible=icon]:hover:bg-primary/90"
                  onClick={isCollapsed ? logout : undefined} // Only trigger logout on avatar click if collapsed
                >
                  {(user?.email || 'N').substring(0, 2).toUpperCase()}
                </div>
              </SidebarMenuButton>

              {!isCollapsed && ( // Only show the logout icon button if not collapsed
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Logout"
                  className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </SidebarMenuButton>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

