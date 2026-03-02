import {
  Home,
  PlusCircle,
  Package,
  Settings,
  LogOut,
  Box,
  Map,
  ShoppingCart,
  Tag,
  ChartScatter,
  BrainCircuit,
  Truck,
} from 'lucide-react';
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
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';

interface AppSidebarProps {
  onSettingsOpen: () => void;
}

const mainNavItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Coach', url: '/coach', icon: BrainCircuit },
  { title: 'On Sale', url: '/on-sale', icon: ShoppingCart },
];

const manageNavItems = [
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Materials', url: '/materials', icon: Box },
  { title: 'Suppliers', url: '/suppliers', icon: Truck },
  { title: 'Categories', url: '/categories', icon: Tag },
];

export function AppSidebar({ onSettingsOpen }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const initials = (user?.email || user?.name || 'PM')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      {/* ── Logo ── */}
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="PriceMe">
              <Link to="/">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'hsl(22 68% 52% / 0.18)' }}>
                  <ChartScatter className="size-5" style={{ color: 'hsl(22 68% 52%)' }} />
                </div>
                <div className="flex flex-col gap-0 leading-none">
                  <span className="font-bold text-lg tracking-tight"
                    style={{ color: 'hsl(35 15% 94%)', fontFamily: '"Playfair Display", Georgia, serif' }}>
                    PriceMe
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.15em]"
                    style={{ color: 'hsl(35 10% 60%)' }}>
                    Pricing Studio
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* ── Add Product CTA ── */}
        <SidebarMenu className="mt-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === '/products/add'}
              tooltip="Add Product"
              className="font-semibold transition-all"
              style={{
                background: 'hsl(22 68% 52%)',
                color: '#fff',
                borderRadius: '0.5rem',
              }}
            >
              <Link to="/products/add">
                <PlusCircle className="h-4 w-4" />
                <span>Add Product</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation ── */}
      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupLabel
            className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'hsl(35 10% 52%)' }}
          >
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-1" style={{ background: 'hsl(25 18% 14%)' }} />

        <SidebarGroup>
          <SidebarGroupLabel
            className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'hsl(35 10% 52%)' }}
          >
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t px-3 py-3" style={{ borderColor: 'hsl(25 18% 14%)' }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === '/roadmap'}
              tooltip="Roadmap"
            >
              <Link to="/roadmap">
                <Map className="h-4 w-4" />
                <span>Roadmap</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" onClick={onSettingsOpen}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* ── User row ── */}
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold cursor-default select-none"
                style={{
                  background: 'hsl(22 68% 52% / 0.2)',
                  color: 'hsl(22 68% 65%)',
                }}
              >
                {initials}
              </div>
              {!isCollapsed && (
                <>
                  <p className="flex-1 min-w-0 text-[11px] truncate" style={{ color: 'hsl(35 10% 60%)' }}>
                    {user?.email}
                  </p>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="shrink-0 rounded p-0.5 transition-colors"
                    style={{ color: 'hsl(35 10% 50%)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'hsl(35 15% 88%)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'hsl(35 10% 50%)')}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
