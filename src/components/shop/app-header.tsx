"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, FileText, Search, Store, Wrench } from "lucide-react"

import { Logo } from "@/components/landing/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NewJobOrderButton } from "./new-job-order"

const nav = [
  { href: "/app", label: "Finder", short: "Finder", icon: Search },
  { href: "/app/jobs", label: "Pending jobs", short: "Jobs", icon: Wrench },
  { href: "/app/invoices", label: "Invoices", short: "Invoices", icon: FileText },
  { href: "/app/vendors", label: "Vendors", short: "Vendors", icon: Store },
]

function useIsActive() {
  const pathname = usePathname()
  return (href: string) =>
    href === "/app" ? pathname === "/app" || pathname.startsWith("/app/vehicles") : pathname.startsWith(href)
}

export function AppHeader() {
  const isActive = useIsActive()

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Logo href="/app" className="shrink-0" />
          {/* Tablet / desktop: links in the top bar. Phones use the bottom tab bar below. */}
          <nav className="hidden items-center gap-1 sm:flex">
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
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden text-muted-foreground lg:inline-flex">
              <Link href="/">
                Website
                <ExternalLink />
              </Link>
            </Button>
            <NewJobOrderButton className="shrink-0" />
          </div>
        </div>
      </header>

      {/* Phones: every section always one tap away */}
      <nav
        aria-label="App sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden print:hidden"
      >
        <ul className="grid grid-cols-4">
          {nav.map(({ href, short, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {short}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
