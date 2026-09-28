import { useState } from "react";
import { Building2, Check, Crown, Gift, MessageCircle, Star, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { enquiryErrorMessage, submitEnquiry } from "@/lib/enquiry";

const plans: readonly {
  name: string; price: string; icon: typeof Building2; description: string;
  features: readonly string[]; gifts?: readonly string[]; badge?: string;
  featured?: boolean; premium?: boolean;
}[] = [
  {
    name: "Starter Plan", price: "₹10,999/-*", icon: Building2,
    description: "For entrepreneurs who want to start a new company.",
    features: ["Company Name Approval", "DIN (2 Directors)", "DSC (2 Directors)", "Certificate of Incorporation", "PAN", "TAN"],
  },
  {
    name: "Business Plan", price: "₹19,999/-*", icon: Star, badge: "Most Popular", featured: true,
    description: "The recommended package for launching a new business.",
    features: ["Everything in Starter Plan", "GST Registration", "MSME Registration", "Professional Tax Registration (Applicable State)", "Shop Act Registration", "Bank Account Assistance"],
    gifts: ["Business Document Kit", "Company Compliance Calendar"],
  },
  {
    name: "Premium Plan", price: "Enquire for the Best Deal", icon: Crown, badge: "Growth Plan", premium: true,
    description: "For professional and growth-oriented businesses.",
    features: ["Everything in Business Plan", "Startup India Registration", "Import Export Code (IEC)", "Trademark Search Report", "Organization DSC", "First Board Resolution Draft", "MOA & AOA Soft Copy", "Share Certificate Draft", "One Year Basic Compliance Support"],
    gifts: ["GST Invoice Format", "HR Document Kit", "Digital Company Folder"],
  },
] as const;

const comparison = [
  ["Company Name Approval", true, true, true], ["DIN & DSC (2 Directors)", true, true, true],
  ["Certificate of Incorporation, PAN & TAN", true, true, true], ["GST & MSME Registration", false, true, true],
  ["Professional Tax & Shop Act", false, true, true], ["Bank Account Assistance", false, true, true],
  ["Startup India & IEC", false, false, true], ["Trademark Search Report", false, false, true],
  ["Corporate Document Drafts", false, false, true], ["One Year Basic Compliance Support", false, false, true],
] as const;

type FormState = { name: string; phone: string; email: string; companyName: string; directors: string; state: string; activity: string };
const emptyForm: FormState = { name: "", phone: "", email: "", companyName: "", directors: "2", state: "", activity: "" };

export function CompanyRegistrationPlans() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [opened, setOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitEnquiry({ name: form.name, phone: form.phone, email: form.email, organizationName: form.companyName, service: "Company Registration", message: `Plan: ${selectedPlan}\nDirectors: ${form.directors}\nState: ${form.state}\nBusiness activity: ${form.activity}`, selectedPlan, directors: form.directors, state: form.state, businessActivity: form.activity, source: "company-registration-plans" });
      setOpened(true);
    } catch (error) { setSubmitError(enquiryErrorMessage(error)); }
    finally { setSubmitting(false); }
  }

  return (
    <section className="bg-surface py-16 md:py-20" aria-labelledby="company-plans-title">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-wider text-orange">Company Registration Plans</p><h2 id="company-plans-title" className="mt-2 text-3xl font-bold text-navy-dark sm:text-4xl">Choose Your Company Registration Plan</h2><p className="mt-3 text-muted-foreground">Select the package that best suits your business needs.</p></div>
        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => { const Icon = plan.icon; return (
            <article key={plan.name} className={`relative flex flex-col rounded-3xl bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft ${plan.featured ? "border-2 border-orange shadow-soft" : plan.premium ? "border-2 border-amber-400" : "border border-border"}`}>
              {plan.badge && <span className={`absolute right-5 top-5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${plan.premium ? "bg-amber-100 text-amber-800" : "bg-orange text-white"}`}><Star className="h-3.5 w-3.5" />{plan.badge}</span>}
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${plan.premium ? "bg-amber-100 text-amber-700" : "bg-navy-soft text-navy"}`}><Icon className="h-6 w-6" /></div>
              <h3 className="mt-5 text-xl font-bold text-navy-dark">{plan.name}</h3><p className="mt-3 text-3xl font-extrabold text-orange">{plan.price}</p><p className="mt-4 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-3">{plan.features.map((item) => <li key={item} className="flex items-start gap-2 text-sm text-navy-dark"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange" />{item}</li>)}</ul>
              {"gifts" in plan && plan.gifts && <div className="mt-5 rounded-xl bg-orange-soft p-4"><p className="flex items-center gap-2 text-xs font-extrabold uppercase text-orange"><Gift className="h-4 w-4" />Free</p><ul className="mt-2 space-y-1 text-sm text-navy-dark">{plan.gifts.map((gift) => <li key={gift}>{gift}</li>)}</ul></div>}
              <button type="button" onClick={() => { if (submitting) return; setSelectedPlan(plan.name); setOpened(false); setSubmitError(""); }} className={`mt-7 min-h-12 rounded-full px-5 py-3 text-sm font-bold text-white transition ${plan.featured ? "bg-orange hover:brightness-110" : "bg-navy hover:bg-navy-dark"}`}>{plan.premium ? "Enquire Now" : "Select Plan"}</button>
            </article>
          ); })}
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><div className="border-b border-border p-6"><h3 className="text-2xl font-bold text-navy-dark">Compare company registration plans</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-navy text-white"><tr><th className="p-4">Services</th><th className="p-4 text-center">Starter</th><th className="p-4 text-center">Business ⭐</th><th className="p-4 text-center">Premium 👑</th></tr></thead><tbody>{comparison.map(([label, ...values]) => <tr key={label} className="border-t border-border"><th className="p-4 font-semibold text-navy-dark">{label}</th>{values.map((value, i) => <td key={i} className="p-4 text-center">{value ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : <X className="mx-auto h-5 w-5 text-muted-foreground/50" />}</td>)}</tr>)}</tbody></table></div></div>
        <p className="mt-6 rounded-xl border border-orange/20 bg-orange-soft p-4 text-sm leading-relaxed text-navy-dark"><strong>*Important:</strong> Government fees, stamp duty and statutory charges may vary based on the state, authorised capital and applicable registrations. Services are subject to eligibility, documents and approval by the respective authority.</p>
      </div>

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && !submitting && setSelectedPlan("")}><DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto"><DialogTitle className="text-2xl font-bold text-navy-dark">Company Registration Inquiry</DialogTitle><DialogDescription>Your selected plan is auto-filled. Complete the details to send your inquiry.</DialogDescription>
        {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}{opened ? <div className="py-12 text-center"><MessageCircle className="mx-auto h-14 w-14 rounded-full bg-emerald-100 p-3 text-emerald-600" /><h3 className="mt-4 text-xl font-bold text-navy-dark">Inquiry submitted</h3><p className="mt-2 text-sm text-muted-foreground">Thank you. Our team will contact you shortly.</p></div> :
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Selected Plan"><input value={selectedPlan} readOnly className="field bg-muted" /></Field><Field label="Applicant Name"><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="field" /></Field><Field label="Mobile Number"><input required type="tel" pattern="(?:\+91[ \-]?)?[6-9][0-9]{9}" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="field" /></Field><Field label="Email"><input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="field" /></Field><Field label="Proposed Company Name"><input required value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="field" /></Field><Field label="Number of Directors"><input required min="2" type="number" value={form.directors} onChange={(e) => update("directors", e.target.value)} className="field" /></Field><Field label="State"><input required value={form.state} onChange={(e) => update("state", e.target.value)} className="field" /></Field><Field label="Business Activity"><input required value={form.activity} onChange={(e) => update("activity", e.target.value)} className="field" /></Field><div className="sm:col-span-2"><button disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-dark disabled:opacity-70"><MessageCircle className="h-5 w-5" />{submitting ? "Submitting..." : "Submit Inquiry"}</button></div></form>}
      </DialogContent></Dialog>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-navy-dark">{label} <span className="text-orange">*</span>{children}</label>; }
