import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-gray-50/50 border-t border-gray-100/50 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="animate-slide-in-left">
            <Link
              href="/"
              className="font-medium text-xl tracking-tight mb-6 block hover:scale-105 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              Zynvera
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              AI-powered, barrier-free global classrooms for every student.
            </p>
          </div>

          <div className="animate-slide-in-up" style={{ animationDelay: "200ms" }}>
            <h3 className="font-medium mb-6 text-sm">Platform</h3>
            <ul className="space-y-4">
              {[
                { href: "/student-portal", label: "Student Portal" },
                { href: "/school-dashboard", label: "School Dashboard" },
              ].map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-900 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] text-sm relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-slide-in-right" style={{ animationDelay: "400ms" }}>
            <h3 className="font-medium mb-6 text-sm">Company</h3>
            <ul className="space-y-4">
              {[
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-500 hover:text-gray-900 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] text-sm relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full"></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="border-t border-gray-100/50 mt-16 pt-8 text-center animate-fade-in"
          style={{ animationDelay: "600ms" }}
        >
          <p className="text-gray-400 text-xs">&copy; 2026 Zynvera. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
