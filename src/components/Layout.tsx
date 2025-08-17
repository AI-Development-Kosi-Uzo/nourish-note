import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, ChefHat, BookOpen, ShoppingCart, BarChart3, CalendarDays, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Inventory', icon: Package },
  { path: '/recipes', label: 'Recipes', icon: ChefHat },
  { path: '/meals', label: 'Meals', icon: BookOpen },
  { path: '/planner', label: 'Planner', icon: CalendarDays },
  { path: '/recipe-generator', label: 'Generator', icon: Sparkles },
  { path: '/shopping', label: 'Shopping', icon: ShoppingCart },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-semibold">Food Tracker</h1>
        </div>
      </header>

      <main className="container px-4 py-6 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-7">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2 text-xs transition-colors',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}