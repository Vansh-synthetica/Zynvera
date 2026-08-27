"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleComingSoon = (feature: string) => {
    window.location.assign(withBase('/auth/login'))
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-100/50 neo-sm"
          : "bg-white/80 backdrop-blur-xl border-b border-gray-100/30"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="font-medium text-xl tracking-tight hover:scale-105 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            Zynvera
          </Link>

          <nav className="hidden md:flex space-x-8">
            {[
              { href: "/", label: "Home" },
              { href: "/auth/login", label: "Students" },
              { href: "/auth/login", label: "Schools" },
              { href: "/auth/login", label: "Community" },
              { href: "/about", label: "About" },
            ].map((item, index) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] text-sm font-medium relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="ghost"
              className="text-sm font-medium hover:bg-gray-50 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
              onClick={() => window.location.assign(withBase('/auth/login'))}
            >
              Sign In
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-800 text-sm font-medium px-6 rounded-full transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] neo hover:neo hover:scale-105 animate-pulse-subtle"
              onClick={() => handleComingSoon("Get Access")}
            >
              Get Access
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
