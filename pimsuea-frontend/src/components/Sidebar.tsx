import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Palette, Package, Wallet, Menu, LogOut, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import logo from "@/assets/logo.svg";

// Separating the content component to avoid "component defined inside render" lint error
// Adding 'collapsed' prop for desktop view
const SidebarContent = ({ collapsed = false, onItemClick }: { collapsed?: boolean, onItemClick?: () => void }) => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { label: "หน้าหลัก", path: "/", icon: <Home className="w-5 h-5" /> },
    { label: "แคตตาล็อก", path: "/catalog", icon: <ShoppingBag className="w-5 h-5" /> },
    { label: "งานของฉัน", path: "/my-products", icon: <Palette className="w-5 h-5" /> },
    { label: "คำสั่งซื้อ", path: "/orders", icon: <Package className="w-5 h-5" /> },
    { label: "กระเป๋าเงิน", path: "/wallet", icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col h-full py-6">
      <div className={cn("px-6 mb-8 transition-all duration-300", collapsed ? "px-2 flex justify-center" : "")}>
        <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <img src={logo} alt="PimSuea" className="h-8 w-auto min-w-[2rem]" />
          {!collapsed && <span className="animate-in fade-in duration-300">PimSuea</span>}
        </Link>
      </div>

      <div className="flex-1 px-3 space-y-2">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={onItemClick}>
            <Button
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className={cn(
                "w-full text-base font-normal h-12 transition-all duration-300 relative group",
                location.pathname === item.path ? "text-primary bg-primary/10 font-semibold" : "text-gray-600 hover:bg-gray-100",
                collapsed ? "justify-center px-0" : "justify-start px-4"
              )}
            >
              {item.icon}
              {!collapsed && <span className="ml-3 animate-in fade-in duration-300 whitespace-nowrap">{item.label}</span>}
              
              {/* Tooltip for collapsed mode */}
              {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                      {item.label}
                  </div>
              )}
            </Button>
          </Link>
        ))}
      </div>

      <div className="px-3 mt-auto space-y-2 border-t pt-4">
        <Link to="/settings">
            <Button 
                variant="ghost" 
                className={cn(
                    "w-full text-gray-500 hover:text-gray-900",
                    collapsed ? "justify-center px-0" : "justify-start px-4"
                )}
            >
                <Settings className="w-5 h-5" />
                {!collapsed && <span className="ml-3 animate-in fade-in duration-300">ตั้งค่า</span>}
            </Button>
        </Link>
        <Button 
            variant="ghost" 
            className={cn(
                "w-full text-red-500 hover:text-red-600 hover:bg-red-50",
                collapsed ? "justify-center px-0" : "justify-start px-4"
            )}
            onClick={() => handleLogout()}
        >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-3 animate-in fade-in duration-300">ออกจากระบบ</span>}
        </Button>
      </div>
    </div>
  );
};

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false); // Mobile Sheet state
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Collapsed state
  const location = useLocation();

  // Auto-collapse on Design Page
  useEffect(() => {
    if (location.pathname.startsWith('/design')) {
        setIsCollapsed(true);
    }
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
            "hidden md:flex flex-col h-screen sticky top-0 border-r bg-white shrink-0 z-40 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
        
        {/* Collapse Toggle Button */}
        <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-10 h-6 w-6 rounded-full border bg-white shadow-md hover:bg-gray-100 z-50 text-gray-500"
            onClick={() => setIsCollapsed(!isCollapsed)}
        >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>
      </aside>

      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md bg-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent onItemClick={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
