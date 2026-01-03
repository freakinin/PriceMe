import { Home, PlusCircle, Package, Settings, LogOut } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Add Product',
    url: '/products/add',
    icon: PlusCircle,
  },
  {
    title: 'Products',
    url: '/products',
    icon: Package,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground [&_svg]:size-4 group-data-[collapsible=icon]:rounded-full">
                  <Package />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }}>
                  <span className="truncate font-semibold" style={{ color: 'hsl(0 0% 98%)' }}>PriceMe</span>
                  <span className="truncate text-xs group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>Pricing Tool</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }}>
                      <Link to={item.url} style={{ color: 'hsl(0 0% 98%)' }}>
                        <item.icon className="h-4 w-4 text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }} />
                        <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 85%)' }}>
              <span className="truncate" style={{ color: 'hsl(0 0% 85%)' }}>{user?.email || 'Not logged in'}</span>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent" style={{ color: 'hsl(0 0% 98%)' }}>
              <LogOut className="h-4 w-4 text-sidebar-foreground" style={{ color: 'hsl(0 0% 98%)' }} />
              <span className="group-data-[collapsible=icon]:hidden" style={{ color: 'hsl(0 0% 98%)' }}>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

