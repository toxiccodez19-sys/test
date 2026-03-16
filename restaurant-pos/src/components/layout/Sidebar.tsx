import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Grid3X3,
  ChefHat,
  Receipt,
  BarChart3,
} from "lucide-react";
import type { PageType } from "@/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  activeOrderCount: number;
}

const navItems: { page: PageType; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "orders", label: "Orders", icon: ShoppingCart },
  { page: "menu", label: "Menu", icon: UtensilsCrossed },
  { page: "tables", label: "Tables", icon: Grid3X3 },
  { page: "kitchen", label: "Kitchen", icon: ChefHat },
  { page: "billing", label: "Billing", icon: Receipt },
  { page: "reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ currentPage, onNavigate, activeOrderCount }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <UtensilsCrossed className="h-7 w-7 text-orange-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">RestoPOS</h1>
          <p className="text-xs text-gray-500">Restaurant Manager</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ page, label, icon: Icon }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              currentPage === page
                ? "bg-orange-50 text-orange-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
            {page === "orders" && activeOrderCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-xs text-white">
                {activeOrderCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
