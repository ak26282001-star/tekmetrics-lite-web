"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { Logo } from "@/components/landing/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/app", label: "Finder" },
  { href: "/app/invoices", label: "Invoices" },
]

export function AppHeader() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" || pathname.startsWith("/app/vehicles") : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Logo href="/app" className="shrink-0" />
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(isActive(item.href) ? "bg-accent text-foreground" : "text-muted-foreground")}
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="ml-auto hidden text-muted-foreground sm:inline-flex"
        >
          <Link href="/">
            Website
            <ExternalLink />
          </Link>
        </Button>
      </div>
    </header>
  )
}
