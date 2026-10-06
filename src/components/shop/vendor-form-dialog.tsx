"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { saveVendor, type VendorInput } from "@/app/app/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Vendor } from "@/lib/shop/types"
import { SAMPLE_SEARCH_WORD, hasPlaceholder, toSearchTemplate } from "@/lib/shop/vendor-links"
import { useServerAction } from "./use-server-action"

export function VendorFormDialog({
  open,
  onOpenChange,
  vendor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit vendor" : "Add parts vendor"}</DialogTitle>
          <DialogDescription>Your parts dealer&apos;s website and account details.</DialogDescription>
        </DialogHeader>
        <VendorForm vendor={vendor} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function VendorForm({ vendor, onClose }: { vendor?: Vendor; onClose: () => void }) {
  const [form, setForm] = React.useState<VendorInput>(() => ({
    name: vendor?.name ?? "",
    website: vendor?.website ?? "",
    searchUrl: vendor?.searchUrl ?? "",
    accountNumber: vendor?.accountNumber ?? "",
    phone: vendor?.phone ?? "",
    contactName: vendor?.contactName ?? "",
    notes: vendor?.notes ?? "",
  }))
  const { run, pending, error } = useServerAction()

  const set = (key: keyof VendorInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const template = toSearchTemplate(form.searchUrl)
  const searchState = !form.searchUrl.trim() ? null : hasPlaceholder(template) ? "ok" : "missing"

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        run(() => saveVendor(vendor?.id ?? null, form), onClose)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="v-name" label="Vendor name">
          <Input id="v-name" value={form.name} onChange={set("name")} placeholder="NAPA Auto Parts" />
        </Field>
        <Field id="v-website" label="Website / ordering portal">
          <Input
            id="v-website"
            value={form.website}
            onChange={set("website")}
            placeholder="napaonline.com"
            inputMode="url"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
        <Label htmlFor="v-search">Search link (optional — fills in the vehicle and part for you)</Label>
        <ol className="list-decimal space-y-0.5 pl-5 text-xs text-muted-foreground">
          <li>
            On the vendor&apos;s website, search for{" "}
            <code className="rounded bg-muted px-1 font-mono text-foreground">{SAMPLE_SEARCH_WORD}</code>.
          </li>
          <li>Copy the link from the browser&apos;s address bar and paste it here.</li>
        </ol>
        <Input
          id="v-search"
          value={form.searchUrl}
          onChange={set("searchUrl")}
          placeholder={`https://dealer.com/search?q=${SAMPLE_SEARCH_WORD}`}
          inputMode="url"
          autoComplete="off"
          className="font-mono text-xs"
        />
        {searchState === "ok" && (
          <p className="text-xs text-success">
            Got it — orders will search for the vehicle and part, e.g. “2019 Honda CR-V brake pads”.
          </p>
        )}
        {searchState === "missing" && (
          <p className="text-xs text-warning">
            This link doesn&apos;t contain “{SAMPLE_SEARCH_WORD}”. Search for exactly that word, then copy the
            link again.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="v-account" label="Account #">
          <Input
            id="v-account"
            value={form.accountNumber}
            onChange={set("accountNumber")}
            autoComplete="off"
          />
        </Field>
        <Field id="v-phone" label="Phone">
          <Input id="v-phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="off" />
        </Field>
        <Field id="v-contact" label="Rep / contact">
          <Input id="v-contact" value={form.contactName} onChange={set("contactName")} autoComplete="off" />
        </Field>
      </div>

      <Field id="v-notes" label="Notes">
        <Textarea
          id="v-notes"
          value={form.notes}
          onChange={set("notes")}
          rows={2}
          placeholder="Delivery twice a day, cutoff 2pm…"
        />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {vendor ? "Save vendor" : "Add vendor"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
