import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Coins, Send, LayoutDashboard, History, CreditCard, Shield, LogOut, User as UserIcon, Menu } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  onTopUp?: () => void;
}

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Compose", url: "/compose", icon: Send },
  { title: "History", url: "/history", icon: History },
  { title: "Payments", url: "/payments", icon: CreditCard },
];

export function DashboardLayout({ children, title, onTopUp }: DashboardLayoutProps) {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background transition-colors duration-300">
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Send className="h-4 w-4 text-primary-foreground rotate-[-15deg]" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:inline-block">SMS Connect</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  location.pathname === item.url 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  location.pathname === "/admin" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <Coins className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-bold tabular-nums text-primary">{profile?.sms_token_balance ?? 0}</span>
            <span className="text-[10px] uppercase tracking-widest font-black text-primary/70">TK</span>
          </div>
          
          <div className="flex items-center gap-2">
            {onTopUp && (
              <Button size="sm" onClick={onTopUp} className="hidden sm:flex h-9 rounded-full px-5 font-bold shadow-sm transition-transform hover:scale-105 active:scale-95">
                Top Up
              </Button>
            )}
            
            <div className="h-4 w-[1px] bg-border mx-1" />
            
            <ModeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border bg-muted/30">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="font-bold">{profile?.name || "My Account"}</span>
                  <span className="text-xs text-muted-foreground font-normal">{profile?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="lg:hidden">
                  <Link to="/dashboard" className="flex items-center"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="lg:hidden">
                  <Link to="/compose" className="flex items-center"><Send className="mr-2 h-4 w-4" /> Compose</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center"><Shield className="mr-2 h-4 w-4" /> Admin Panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        {children}
      </main>
    </div>
);
}
