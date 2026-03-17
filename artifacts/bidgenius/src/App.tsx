import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth-context";
import { Layout } from "@/components/layout";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Auctions from "@/pages/auctions";
import AuctionDetail from "@/pages/auction-detail";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAuctionsList from "@/pages/admin/auctions/index";
import AdminNewAuction from "@/pages/admin/auctions/new";
import AdminAuctionDetail from "@/pages/admin/auctions/detail";
import AdminUsers from "@/pages/admin/users";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, isLoading, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading...</div>;
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (adminOnly && !isAdmin) {
    setLocation('/dashboard');
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function RootRedirect() {
  const { user, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading) {
      if (!user) setLocation('/login');
      else if (isAdmin) setLocation('/admin');
      else setLocation('/dashboard');
    }
  }, [isLoading, user, isAdmin, setLocation]);

  return <div className="min-h-screen bg-background" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      
      {/* Bidder Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/auctions"><ProtectedRoute component={Auctions} /></Route>
      <Route path="/auctions/:id"><ProtectedRoute component={AuctionDetail} /></Route>
      
      {/* Admin Routes */}
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/auctions"><ProtectedRoute component={AdminAuctionsList} adminOnly /></Route>
      <Route path="/admin/auctions/new"><ProtectedRoute component={AdminNewAuction} adminOnly /></Route>
      <Route path="/admin/auctions/:id"><ProtectedRoute component={AdminAuctionDetail} adminOnly /></Route>
      <Route path="/admin/users"><ProtectedRoute component={AdminUsers} adminOnly /></Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
