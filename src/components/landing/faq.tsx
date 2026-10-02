import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { SectionHeading } from "./section-heading"

const faqs = [
  {
    q: "Do I need special barcode scanners?",
    a: "No. Tekmetric Lite works with the camera on any iPhone or Android phone. If you already own USB or Bluetooth scanners, those work too.",
  },
  {
    q: "Can I import my existing parts list?",
    a: "Yes. Upload a CSV or Excel file and we'll map the columns automatically. On the Shop plan and above, our team will do the import for you for free.",
  },
  {
    q: "Does it work with my shop management software?",
    a: "Tekmetric Lite syncs parts and pricing with QuickBooks and exports clean CSVs for any other system. Direct integrations with popular shop management platforms are on the roadmap.",
  },
  {
    q: "What happens after my free trial?",
    a: "You choose a plan and keep going — all your data stays exactly where it is. If you decide it isn't for you, you can export everything and cancel with no fees.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit and at rest, backed up daily, and you control exactly which users can see costs and margins.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t bg-card/30 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions from the service desk"
          description="Can't find what you're looking for? Our support team is made of former service writers — reach out anytime."
          className="lg:mx-0 lg:text-left"
        />
        <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
