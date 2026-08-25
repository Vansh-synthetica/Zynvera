'use client'

import { useEffect } from 'react'

/**
 * Removes Netlify's injected HUD/badge (shadow-DOM script) — we run
 * on our own domain and don't want platform chrome.
 */
export default function NetlifyBadgeRemover() {
  useEffect(() => {
    // Block the Netlify HUD from initializing.
    try {
      // @ts-ignore
      if (typeof window !== 'undefined') {
        // @ts-ignore
        window.NetlifyHUD = undefined
        // @ts-ignore
        window.__netlifyHUD = undefined
      }
    } catch {}

    const kill = () => {
      // Remove the injection script.
      document.querySelectorAll('script[src*="netlify"], script[src*="hud"]').forEach(el => {
        if (el.getAttribute('src')?.includes('netlify')) el.remove()
      })
      // Remove any rendered badge containers.
      document.querySelectorAll(
        '[data-netlify-site-id], netlify-hud, [data-netlify-hud], #netlify-toast, .nhud-badge, .nhud-container, [class*="netlify"]'
      ).forEach(el => el.remove())
      // The HUD attaches containers directly to html/body.
      document.querySelectorAll('body > div, html > div').forEach(el => {
        const cls = el.className || ''
        const id = el.id || ''
        if (cls.includes('netlify') || id.includes('netlify') || cls.includes('nhud') || id.includes('nhud')) {
          el.remove()
        }
      })
    }

    kill()
    const obs = new MutationObserver(kill)
    obs.observe(document.documentElement, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [])

  return null
}
