"use client"
import { Badge } from "@/components/ui/badge"
import { Users, GraduationCap, BookOpen } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      id: "student-portal",
      label: "Student",
      icon: GraduationCap,
      href: "/student-portal",
      badge: null,
    },
    {
      id: "social",
      label: "Social",
      icon: Users,
      href: "/social",
      badge: "3",
    },
    {
      id: "school-dashboard",
      label: "School",
      icon: BookOpen,
      href: "/school-dashboard",
      badge: null,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link key={item.id} href={item.href} className="flex-1">
              <div className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 hover:bg-gray-100/80 relative">
                <div className="relative">
                  <Icon className={`h-6 w-6 transition-colors ${isActive ? "text-blue-600" : "text-gray-600"}`} />
                  {item.badge && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0 min-w-[20px]">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${isActive ? "text-blue-600" : "text-gray-600"}`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
