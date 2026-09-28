import { useState } from "react";
import { Check, Crown, MessageCircle, Search, ShieldCheck, Star, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { enquiryErrorMessage, submitEnquiry } from "@/lib/enquiry";

const plans: readonly {
  name: string; price: string; icon: typeof Search; description: string;
  features: readonly string[]; button: string; badge?: string;
  featured?: boolean; premium?: boolean;
}[] = [
  {
    name: "Trademark Search",
    price: "Free",
    description: "Best for customers who want to check availability before filing.",
    features: ["Trademark Availability Search", "Similar Mark Search Report", "Class Suggestion", "Expert Consultation", "PDF Search Report"],
    button: "Check Availability",
    icon: Search,
  },
  {
    name: "Trademark Registration",
    price: "Inquiry for Best Deal",
    description: "Complete expert-assisted trademark application filing support.",
    features: ["Trademark Availability Search", "Correct Class Selection", "Trademark Application Filing", "Application Acknowledgement", "Application Number", "Filing Support", "Status Tracking"],
    button: "Register Trademark",
    icon: ShieldCheck,
    badge: "Most Popular",
    featured: true,
  },
  {
    name: "Trademark Premium",
    price: "Inquiry for Best Deal",
    description: "Extended filing, monitoring and examination-stage assistance.",
    features: ["Everything in Trademark Registration", "Trademark Monitoring", "Examination Report Guidance", "Hearing Support Guidance", "Objection Reply Drafting Support (if required)", "Status Tracking", "Priority Customer Support"],
    button: "Choose Premium",
    icon: Crown,
    badge: "Best Value",
    premium: true,
  },
] as const;

const comparison = [
  ["Trademark Search", true, true, true],
  ["Similar Mark Report", true, true, true],
  ["Class Selection", true, true, true],
  ["Application Filing", false, true, true],
  ["Application Number", false, true, true],
  ["Status Tracking", false, true, true],
  ["Monitoring", false, false, true],
  ["Examination Guidance", false, false, true],
  ["Hearing Support Guidance", false, false, true],
  ["Objection Reply Drafting Support", false, false, true],
  ["Priority Support", false, false, true],
] as const;

type FormState = {
  applicantName: string; mobile: string; email: string; businessName: string;
  proposedTrademark: string; businessActivity: string; trademarkType: string;
};

const emptyForm: FormState = { applicantName: "", mobile: "", email: "", businessName: "", proposedTrademark: "", businessActivity: "", trademarkType: "Wordmark" };

export function TrademarkPlans() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [submitError, setSubmitError] = useState("");

  const choosePlan = (plan: string) => { if (status === "loading") return; setSelectedPlan(plan); setStatus("idle"); setSubmitError(""); };
  const update = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    setSubmitError("");
    setStatus("loading");
    try {
      await submitEnquiry({ name: form.applicantName, phone: form.mobile, email: form.email, organizationName: form.businessName, service: "Trademark", message: `Plan: ${selectedPlan}\nTrademark: ${form.proposedTrademark}\nBusiness activity: ${form.businessActivity}\nType: ${form.trademarkType}`, selectedPlan, proposedTrademark: form.proposedTrademark, businessActivity: form.businessActivity, trademarkType: form.trademarkType, source: "trademark-plans" });
      setStatus("success");
    } catch (error) { setStatus("idle"); setSubmitError(enquiryErrorMessage(error)); }
  }

  return (
    <section className="bg-surface py-16 md:py-20" aria-labelledby="trademark-plans-title">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">Trademark Plans</p>
          <h2 id="trademark-plans-title" className="mt-2 text-3xl font-bold text-navy-dark sm:text-4xl">Choose the right trademark service</h2>
          <p className="mt-3 text-muted-foreground">Start with a search or choose end-to-end filing and ongoing support.</p>
        </div>

        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article key={plan.name} className={`relative flex flex-col rounded-3xl bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft ${plan.featured ? "border-2 border-orange shadow-soft" : plan.premium ? "border-2 border-amber-400" : "border border-border"}`}>
                {plan.badge && <span className={`absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${plan.premium ? "bg-amber-100 text-amber-800" : "bg-orange text-white"}`}>{plan.premium ? <Crown className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}{plan.badge}</span>}
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${plan.premium ? "bg-amber-100 text-amber-700" : "bg-navy-soft text-navy"}`}><Icon className="h-6 w-6" /></div>
                <h3 className="mt-5 text-xl font-bold text-navy-dark">{plan.name}</h3>
                <p className="mt-3 text-2xl font-extrabold text-orange">{plan.price}</p>
                {plan.name !== "Trademark Search" && <p className="mt-1 text-xs text-muted-foreground">Government fees extra, if applicable</p>}
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-navy-dark"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange" /><span>{feature}</span></li>)}
                </ul>
                <button type="button" onClick={() => choosePlan(plan.name)} className={`mt-7 min-h-12 rounded-full px-5 py-3 text-sm font-bold transition ${plan.featured ? "bg-orange text-white hover:brightness-110" : "bg-navy text-white hover:bg-navy-dark"}`}>{plan.button}</button>
              </article>
            );
          })}
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border p-6"><h3 className="text-2xl font-bold text-navy-dark">Compare trademark plans</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-navy text-white"><tr><th className="p-4">Features</th><th className="p-4 text-center">Search</th><th className="p-4 text-center">Registration ⭐</th><th className="p-4 text-center">Premium 👑</th></tr></thead>
              <tbody>{comparison.map(([feature, ...values]) => <tr key={feature} className="border-t border-border"><th className="p-4 font-semibold text-navy-dark">{feature}</th>{values.map((included, index) => <td key={index} className="p-4 text-center">{included ? <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="Included" /> : <X className="mx-auto h-5 w-5 text-muted-foreground/50" aria-label="Not included" />}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 rounded-xl border border-orange/20 bg-orange-soft p-4 text-sm leading-relaxed text-navy-dark"><strong>Note:</strong> Government fees are charged separately as per the applicable applicant category and number of classes. Professional service fees will be shared after reviewing your requirements.</p>
      </div>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && status !== "loading" && setSelectedPlan("")}>
        <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto">
          <DialogTitle className="text-2xl font-bold text-navy-dark">Trademark Plan Inquiry</DialogTitle>
          <DialogDescription>Share your details and our trademark expert will contact you.</DialogDescription>
          {status === "success" ? (
            <div className="py-14 text-center"><MessageCircle className="mx-auto h-14 w-14 rounded-full bg-emerald-100 p-3 text-emerald-600" /><h3 className="mt-4 text-xl font-bold text-navy-dark">Inquiry submitted</h3><p className="mt-2 text-sm text-muted-foreground">Thank you. Our trademark expert will contact you shortly.</p><button type="button" onClick={() => { setStatus("idle"); setForm(emptyForm); setSelectedPlan(""); }} className="mt-6 text-sm font-bold text-orange hover:underline">Close</button></div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
              {submitError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{submitError}</p>}
              <FormField label="Selected Plan"><input value={selectedPlan} readOnly className="field bg-muted" /></FormField>
              <FormField label="Applicant Name"><input required value={form.applicantName} onChange={(e) => update("applicantName", e.target.value)} className="field" /></FormField>
              <FormField label="Mobile Number"><input required type="tel" pattern="(?:\+91[ \-]?)?[6-9][0-9]{9}" value={form.mobile} onChange={(e) => update("mobile", e.target.value)} className="field" /></FormField>
              <FormField label="Email"><input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="field" /></FormField>
              <FormField label="Business Name"><input required value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="field" /></FormField>
              <FormField label="Proposed Trademark"><input required value={form.proposedTrademark} onChange={(e) => update("proposedTrademark", e.target.value)} className="field" /></FormField>
              <FormField label="Business Activity"><input required value={form.businessActivity} onChange={(e) => update("businessActivity", e.target.value)} className="field" /></FormField>
              <FormField label="Trademark Type"><select value={form.trademarkType} onChange={(e) => update("trademarkType", e.target.value)} className="field"><option>Wordmark</option><option>Logo</option><option>Both</option></select></FormField>
              <div className="sm:col-span-2"><button disabled={status === "loading"} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-dark disabled:opacity-70"><MessageCircle className="h-5 w-5" />{status === "loading" ? "Submitting..." : "Submit Inquiry"}</button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-navy-dark">{label} <span className="text-orange">*</span>{children}</label>;
}
