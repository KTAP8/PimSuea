import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Palette, Package, Wallet, Menu, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { label: "หน้าหลัก", path: "/", icon: <Home className="w-5 h-5 mr-3" /> },
    { label: "แคตตาล็อก", path: "/catalog", icon: <ShoppingBag className="w-5 h-5 mr-3" /> },
    { label: "งานของฉัน", path: "/my-products", icon: <Palette className="w-5 h-5 mr-3" /> },
    { label: "คำสั่งซื้อ", path: "/orders", icon: <Package className="w-5 h-5 mr-3" /> },
    { label: "กระเป๋าเงิน", path: "/wallet", icon: <Wallet className="w-5 h-5 mr-3" /> },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8">
        <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
          🐯 <span>PimSuea</span>
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
            <Button
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-base font-normal h-12",
                location.pathname === item.path ? "text-primary bg-primary/10 font-semibold" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {item.icon}
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="px-4 mt-auto space-y-2 border-t pt-4">
        <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-gray-900">
                <Settings className="w-5 h-5 mr-3" />
                ตั้งค่า
            </Button>
        </Link>
        <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleLogout()}
        >
            <LogOut className="w-5 h-5 mr-3" />
            ออกจากระบบ
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r bg-white shrink-0 z-40">
        <SidebarContent />
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
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
