import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Bell, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function NavigationHeader() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const { data: unreadEmails = [] } = useQuery({
    queryKey: ["/api/emails/unread"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-gray-900">JobFlow</h1>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/applications">
                <Button 
                  variant={location === "/applications" ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Applications
                </Button>
              </Link>
              <Link href="/contacts">
                <Button 
                  variant={location === "/contacts" ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Contacts
                </Button>
              </Link>
              <Link href="/resumes">
                <Button 
                  variant={location === "/resumes" ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Resumes
                </Button>
              </Link>
              <Link href="/auto-apply">
                <Button 
                  variant={location === "/auto-apply" ? "default" : "ghost"}
                  className="text-sm font-medium"
                >
                  Auto-Apply
                </Button>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadEmails.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadEmails.length > 9 ? "9+" : unreadEmails.length}
                  </Badge>
                )}
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={user?.profileImageUrl || ""} 
                  alt={`${user?.firstName || ""} ${user?.lastName || ""}`} 
                />
                <AvatarFallback>
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || "User"
                }
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
