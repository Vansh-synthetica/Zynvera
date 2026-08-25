import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import NetlifyBadgeRemover from "@/components/netlify-badge-remover"
import { WorkspaceProvider } from "@/lib/workspace-context"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zynvera - Institutional Learning Platform",
  description: "Zynvera connects students, teachers, and institutions in one comprehensive learning platform.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try{
            Object.defineProperty(window,'NetlifyHUD',{get:function(){return undefined},configurable:false});
            Object.defineProperty(window,'__netlifyHUD',{get:function(){return undefined},configurable:false});
          }catch(e){}
          var _nu=new MutationObserver(function(m){m.forEach(function(r){r.addedNodes.forEach(function(n){
            if(n.nodeType===1){
              var t=(n.tagName||'').toLowerCase(),c=(n.className||'').toLowerCase(),i=(n.id||'').toLowerCase();
              if(t==='netlify-hud'||c.indexOf('netlify')>=0||i.indexOf('netlify')>=0||c.indexOf('nhud')>=0||i.indexOf('nhud')>=0)n.remove();
            }
          })})});
          if(document.documentElement)_nu.observe(document.documentElement,{childList:true,subtree:true});
        ` }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <WorkspaceProvider>
              {children}
              <Toaster />
            <NetlifyBadgeRemover />
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
