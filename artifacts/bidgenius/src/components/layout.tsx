import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from './auth-context';
import { 
  Gavel, LayoutDashboard, History, Settings, 
  LogOut, PlusCircle, Users, Menu, X, Coins, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const bidderNav = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Auctions', href: '/auctions', icon: Gavel },
  ];

  const adminNav = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Manage Auctions', href: '/admin/auctions', icon: Gavel },
    { label: 'Users & Credits', href: '/admin/users', icon: Users },
  ];

  const nav = isAdmin ? adminNav : bidderNav;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 glass-panel sticky top-0 z-50">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-8 h-8" />
          <span className="font-display font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">BidGenius</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white/70 hover:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) & Mobile Menu */}
      <AnimatePresence>
        {(isMobileMenuOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed md:sticky top-0 left-0 h-screen w-72 flex flex-col border-r border-white/10 glass-panel z-40"
          >
            <div className="p-8 hidden md:block">
              <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full group-hover:bg-primary transition-all duration-500"></div>
                  <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-10 h-10 relative z-10" />
                </div>
                <span className="font-display font-bold text-2xl tracking-widest text-glow">BIDGENIUS</span>
              </Link>
            </div>

            {user && !isAdmin && (
              <div className="px-6 pb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60 font-medium">Available Credits</span>
                    <Coins className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="text-2xl font-bold font-display tracking-tight text-white">
                    {new Intl.NumberFormat('en-US').format(user.availableCredits)}
                  </div>
                  {user.reservedCredits > 0 && (
                    <div className="mt-2 text-xs text-secondary flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      {new Intl.NumberFormat('en-US').format(user.reservedCredits)} reserved in active bids
                    </div>
                  )}
                </div>
              </div>
            )}

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
              <div className="text-xs font-semibold text-white/40 tracking-widest uppercase px-4 mb-4">Menu</div>
              {nav.map((item) => {
                const isActive = location === item.href || (location.startsWith(item.href) && item.href !== '/admin' && item.href !== '/dashboard');
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                      isActive 
                        ? 'bg-primary/20 text-primary-foreground border border-primary/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-primary' : ''} />
                    {item.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <Link 
                    href="/admin/auctions/new"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all font-medium"
                  >
                    <PlusCircle size={20} />
                    Create Auction
                  </Link>
                </div>
              )}
            </nav>

            <div className="p-4 mt-auto">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-lg font-display">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate text-white">{user?.name}</div>
                  <div className="text-xs text-white/50 truncate capitalize">{user?.role}</div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
