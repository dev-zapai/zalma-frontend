import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import api from '@/shared/lib/api';
import { assetUrl } from '@/shared/lib/assets';
import { applyThemeColor } from '@/shared/lib/theme';

import {
  LayoutDashboard, Calendar, CalendarCheck, UserCog, Scissors, BarChart3, Bell,
  Settings, LogOut, Menu, ChevronDown, ChevronLeft, ChevronRight,
  UserCircle, Globe, MapPin, Dog, Heart, Plane, CreditCard, Handshake,
  Hourglass, Share2, Zap,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/shared/components/ui/tooltip';

// plans: which plans can see this nav item. undefined = all plans.
const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true, roles: ['admin', 'staff'] },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'staff'] },
  { to: '/dashboard/availability', icon: Calendar, label: 'Availability', roles: ['admin', 'staff'] },
  { to: '/dashboard/appointments', icon: CalendarCheck, label: 'Appointments', roles: ['admin', 'staff'] },
  { to: '/dashboard/waitlist', icon: Hourglass, label: 'Waitlist', roles: ['admin', 'staff'] },
  { to: '/dashboard/transfers', icon: Share2, label: 'Transfers', roles: ['admin'], plans: ['premium', 'ultimate'] },
  { to: '/dashboard/clients', icon: Heart, label: 'Clients', roles: ['admin', 'staff'] },
  { to: '/dashboard/pets', icon: Dog, label: 'Pets', roles: ['admin', 'staff'] },
  { to: '/dashboard/staff', icon: UserCog, label: 'Staff', roles: ['admin'] },
  { to: '/dashboard/absence', icon: Plane, label: 'Absence', roles: ['admin', 'staff'], plans: ['premium', 'ultimate'] },
  { to: '/dashboard/services', icon: Scissors, label: 'Services', roles: ['admin'] },
  { to: '/dashboard/automations', icon: Zap, label: 'Automations', roles: ['admin'], plans: ['premium', 'ultimate'] },
  { to: '/dashboard/partners', icon: Handshake, label: 'Partners', roles: ['admin'], plans: ['premium', 'ultimate'] },
  { to: '/dashboard/explore', icon: MapPin, label: 'Explore', roles: ['admin'], plans: ['ultimate'] },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin'] },
  { to: '/dashboard/website-setup', icon: Globe, label: 'Website', roles: ['admin'], plans: ['ultimate'] },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Billing', roles: ['admin'] },
  { to: '/dashboard/profile', icon: UserCircle, label: 'Profile', roles: ['admin', 'staff'] },
];

// Sidebar width constraints — collapsed state appears below COLLAPSE_THRESHOLD
const SIDEBAR_MIN_EXPANDED = 180;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const COLLAPSE_THRESHOLD = 140; // dragged below this → snap to collapsed

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifBadge, setNotifBadge] = useState(0);
  const [partnerBadge, setPartnerBadge] = useState(0);

  // Poll action-items count for bell badge
  useEffect(() => {
    const fetchCount = () => {
      api.get('/g/notifications/action-items')
        .then(r => setNotifBadge(r.data?.summary?.total || 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Poll partner unread count for badge
  useEffect(() => {
    const fetchPartner = () => {
      api.get('/partners/unread-count')
        .then(r => setPartnerBadge(r.data?.total_unread || 0))
        .catch(() => {});
    };
    fetchPartner();
    const interval = setInterval(fetchPartner, 300000);
    return () => clearInterval(interval);
  }, []);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    if (saved) return parseInt(saved, 10) || SIDEBAR_DEFAULT_WIDTH;
    // Migrate from old "sidebar-collapsed" boolean if present
    return localStorage.getItem('sidebar-collapsed') === 'true'
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_DEFAULT_WIDTH;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantPlan, setTenantPlan] = useState('growth');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const userRole = profile?.role || 'staff';
  const isAdmin = profile?.is_admin || profile?.role === 'admin';

  // Derived: are we in collapsed (icon-only) mode?
  const collapsed = sidebarWidth < COLLAPSE_THRESHOLD;

  // Persist width whenever it changes (after the user stops dragging)
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('sidebar-width', String(sidebarWidth));
    }
  }, [sidebarWidth, isDragging]);

  // Drag handlers — track via window so the cursor can leave the handle
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      // Snap to collapsed below threshold; clamp to min/max otherwise
      const x = e.clientX;
      if (x < COLLAPSE_THRESHOLD) {
        setSidebarWidth(SIDEBAR_COLLAPSED_WIDTH);
      } else {
        setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_EXPANDED, x)));
      }
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    // Lock body cursor + selection while dragging
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isDragging]);

  useEffect(() => {
    if (!profile) return;
    api.get('/tenant/me')
      .then(res => {
        if (res.data?.theme_color) applyThemeColor(res.data.theme_color);
        if (res.data?.plan) setTenantPlan(res.data.plan);
      })
      .catch(() => {})
      .finally(() => setTenantLoading(false));
  }, [profile]);

  const handleSignOut = async () => {
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--ring');
    document.documentElement.style.removeProperty('--chart-1');
    await signOut();
    navigate('/');
  };

  const toggleCollapsed = () => {
    setSidebarWidth(collapsed ? SIDEBAR_DEFAULT_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
  };

  // Called by child pages (e.g. BillingPage after plan upgrade) to refresh nav gating
  const refreshTenantPlan = useCallback(() => {
    api.get('/tenant/me')
      .then(res => { if (res.data?.plan) setTenantPlan(res.data.plan); })
      .catch(() => {});
  }, []);

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = ({ isCollapsed = false }) => (
    <div className="flex flex-col h-full">
      <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center' : 'px-5'}`}>
        <NavLink
          to="/dashboard"
          end
          onClick={() => setSidebarOpen(false)}
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="Go to Dashboard"
        >
          <img
            src={`${process.env.PUBLIC_URL || ''}/${isCollapsed ? 'zalma_short_logo.png' : 'zalma_logo.png'}`}
            alt="Zalma"
            style={{ height: isCollapsed ? '28px' : '26px', width: 'auto' }}
          />
        </NavLink>
      </div>
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${isCollapsed ? 'flex flex-col items-center' : 'px-3'}`}>
        {NAV_ITEMS.filter(item => {
          const roleOk = !item.roles || item.roles.includes(userRole) || (isAdmin && item.roles.includes('admin'));
          // 'growth'/'premium'/'ultimate' are the canonical post-rename values.
          // Only the clearly-legacy keys get translated. Do NOT rewrite a
          // bare 'growth' here: on the new scheme it IS the lowest tier,
          // and rewriting it to 'premium' would leak Premium-only nav items.
          let normalisedPlan = tenantPlan;
          if (tenantPlan === 'basic') normalisedPlan = 'growth';
          else if (tenantPlan === 'advanced') normalisedPlan = 'ultimate';
          const planOk = !item.plans || item.plans.includes(normalisedPlan);
          return roleOk && planOk;
        }).map((item) => {
          const link = (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2.5 w-full'
                } ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="relative">
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label === 'Notifications' && notifBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                    {notifBadge > 99 ? '99+' : notifBadge}
                  </span>
                )}
                {item.label === 'Partners' && partnerBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                    {partnerBadge > 99 ? '99+' : partnerBadge}
                  </span>
                )}
              </span>
              {!isCollapsed && item.label}
            </NavLink>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          return link;
        })}
      </nav>

      {!isCollapsed ? (
        <div className="hidden lg:block px-3 pb-1">
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Collapse
          </button>
        </div>
      ) : (
        <div className="hidden lg:flex justify-center pb-1">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleCollapsed}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand</TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className={`border-t border-slate-100 ${isCollapsed ? 'flex justify-center p-2' : 'p-3'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="user-menu-btn"
              className={`rounded-lg hover:bg-slate-50 ${isCollapsed ? 'w-full flex justify-center py-2.5' : 'w-full flex items-center gap-3 px-3 py-2.5 text-left'}`}
            >
              {profile?.photo_url ? (
                <img src={assetUrl(profile.photo_url)} alt={profile.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? 'start' : 'end'} side={isCollapsed ? 'right' : 'top'} className="w-56">
            <DropdownMenuItem data-testid="sign-out-btn" onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div data-testid="dashboard-layout" className="flex h-screen bg-slate-50/50">
        <aside
          className={`relative hidden lg:flex flex-col bg-white border-r border-slate-200/60 shrink-0 ${
            isDragging ? '' : 'transition-[width] duration-150'
          }`}
          style={{ width: `${sidebarWidth}px` }}
        >
          <SidebarContent isCollapsed={collapsed} />

          {/* Drag handle - sits on the right edge, full height, invisible until hover */}
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={() => setSidebarWidth(SIDEBAR_DEFAULT_WIDTH)}
            title="Drag to resize · double-click to reset"
            className={`absolute top-0 right-0 h-full w-1.5 -mr-0.5 cursor-col-resize z-20 group ${
              isDragging ? '' : 'transition-colors'
            }`}
          >
            <div
              className={`h-full w-full ${
                isDragging
                  ? 'bg-primary/60'
                  : 'bg-transparent group-hover:bg-primary/30'
              } ${isDragging ? '' : 'transition-colors'}`}
            />
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
              <SidebarContent isCollapsed={false} />
            </aside>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 h-16 flex items-center gap-4 border-b border-slate-200/60 bg-white/95 backdrop-blur-lg px-6">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)} data-testid="mobile-sidebar-btn">
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex-1" />
            <div className="text-sm text-slate-500 capitalize">
              {profile?.is_owner ? 'Owner' : isAdmin ? 'Admin' : profile?.role}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <Outlet context={{ tenantPlan, refreshTenantPlan }} />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
