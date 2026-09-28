import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Handshake,
  Headphones,
  IndianRupee,
  Laptop,
  Megaphone,
  Network,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PageHero } from "@/components/PageHero";
import { enquiryErrorMessage, submitEnquiry } from "@/lib/enquiry";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/partner-with-us")({
  head: () => ({
    meta: [
      { title: "Partner With India Business Care | Franchise & Professional Network" },
      {
        name: "description",
        content:
          "Join India Business Care as a franchise, professional or referral partner and grow with our technology, training and marketing support.",
      },
      { property: "og:url", content: "/partner-with-us" },
      ...seoHead({ title: "India Business Care Franchise & Partner Network", description: "Join India Business Care as a franchise, professional or referral partner and grow with training, technology and marketing support across India.", path: "/partner-with-us" }).meta,
    ],
    links: seoHead({ title: "Partner With India Business Care", description: "Join our franchise and professional partner network.", path: "/partner-with-us" }).links,
  }),
  component: PartnerWithUs,
});

const professionals = [
  "Chartered Accountant (CA)", "Company Secretary (CS)", "Cost Accountant (CMA)",
  "Advocate", "Tax Consultant", "GST Practitioner", "Business Consultant",
  "Digital Marketing Agency", "CSC / Cyber Cafe", "Freelancer", "Existing Consultancy Firm",
  "Labour Law Consultant", "HR Consultant",
];

const reasons = [
  [ShieldCheck, "Trusted Brand"], [Laptop, "100% Digital Process"], [Headphones, "Dedicated Support Team"],
  [TrendingUp, "Business Growth Opportunities"], [Megaphone, "Marketing Assistance"],
  [IndianRupee, "Transparent Revenue Sharing"], [Network, "Pan India Network"],
  [BadgeCheck, "Training & Knowledge Support"],
] as const;

const programs = [
  {
    icon: Building2,
    name: "Franchise Partner",
    description: "Start your own India Business Care franchise and build a successful business consultancy in your city with complete branding, training, technology and marketing support.",
    benefits: ["Brand License", "Business Setup Support", "Website & CRM Access", "Complete Training", "Marketing Support", "Dedicated Relationship Manager", "Priority Technical Support"],
    button: "Apply for Franchise",
  },
  {
    icon: BriefcaseBusiness,
    name: "Professional Partner",
    description: "Join our professional network to receive client referrals, project assignments and long-term collaboration opportunities across India.",
    benefits: ["Client Referrals", "Revenue Sharing", "Dedicated Support Team", "Project-Based Work", "Pan India Opportunities", "Technology Platform"],
    button: "Join Professional Network",
  },
  {
    icon: Handshake,
    name: "Referral Partner",
    description: "Refer business clients and earn attractive commission without making an investment.",
    benefits: ["No Investment", "Unlimited Referrals", "Monthly Commission", "Marketing Materials", "Dedicated Support"],
    button: "Become a Referral Partner",
  },
] as const;

function PartnerWithUs() {
  const [selectedProgram, setSelectedProgram] = useState("Franchise Partner");

  const chooseProgram = (name: string) => {
    setSelectedProgram(name);
    window.setTimeout(() => document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Grow With Us"
        title="Partner With India Business Care"
        description="Join our franchise, professional or referral partner network and build new opportunities with a trusted Pan India business support platform."
        breadcrumbs={[{ label: "Partner With Us" }]}
      />

      <section className="bg-white py-16 md:py-20">
        <div className="container-x text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-orange">Our Partner Community</p>
          <h2 className="mt-2 text-3xl font-bold text-navy-dark sm:text-4xl">Who Can Join?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Professionals, entrepreneurs and service providers who want to grow their practice or create a new business opportunity.</p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {professionals.map((item) => (
              <div key={item} className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange/30 hover:shadow-soft">
                <Users className="mb-2 h-5 w-5 text-orange" />
                <span className="text-sm font-semibold text-navy-dark">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-soft py-16 md:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-orange">The India Business Care Advantage</p>
            <h2 className="mt-2 text-3xl font-bold text-navy-dark sm:text-4xl">Why Partner With Us?</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(([Icon, title]) => (
              <div key={title} className="rounded-2xl border border-white bg-white p-6 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-soft text-orange"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 font-bold text-navy-dark">{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container-x">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-orange">Choose Your Path</p>
            <h2 className="mt-2 text-3xl font-bold text-navy-dark sm:text-4xl">Three Ways to Partner With Us</h2>
          </div>
          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
            {programs.map((program) => (
              <article key={program.name} className="flex flex-col rounded-3xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft sm:p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-soft text-navy"><program.icon className="h-6 w-6" /></div>
                <h3 className="mt-5 text-xl font-bold text-navy-dark">{program.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{program.description}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {program.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2 text-sm text-navy-dark"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange" />{benefit}</li>)}
                </ul>
                <button type="button" onClick={() => chooseProgram(program.name)} className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-dark">
                  {program.button}<ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PartnerForm selectedProgram={selectedProgram} setSelectedProgram={setSelectedProgram} />
    </SiteLayout>
  );
}

function PartnerForm({ selectedProgram, setSelectedProgram }: { selectedProgram: string; setSelectedProgram: (value: string) => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    // React clears currentTarget after the synchronous event handler returns.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus("loading");
    try {
      await submitEnquiry({ name: String(form.get("name")), phone: String(form.get("mobile")), email: String(form.get("email")), organizationName: String(form.get("profession")), service: "Partner Application", message: `Program: ${form.get("program")}\nState: ${form.get("state")}\nCity: ${form.get("city")}\nProfession: ${form.get("profession")}`, program: String(form.get("program")), state: String(form.get("state")), city: String(form.get("city")), profession: String(form.get("profession")), source: "partner-with-us" });
    } catch (error) {
      setSubmitError(enquiryErrorMessage(error));
      setStatus("error");
      return;
    }
    formElement.reset();
    setStatus("success");
  };

  return (
    <section id="partner-form" className="scroll-mt-28 gradient-navy py-16 text-white md:py-20">
      <div className="container-x grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange">Take the Next Step</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Become a Partner</h2>
          <p className="mt-4 max-w-xl leading-relaxed text-white/80">Complete the form and our partnership team will review your details and contact you to discuss the next steps.</p>
          <div className="mt-7 flex items-center gap-3 text-sm text-white/90"><Handshake className="h-5 w-5 text-orange" />Let us build and grow together.</div>
        </div>
        <form onSubmit={submit} className="grid gap-4 rounded-3xl bg-white p-5 text-ink shadow-xl sm:grid-cols-2 sm:p-8">
          <Field label="Full Name"><input name="name" required autoComplete="name" className="field" /></Field>
          <Field label="Mobile Number"><input name="mobile" required type="tel" inputMode="tel" pattern="(?:\+91[ \-]?)?[6-9][0-9]{9}" autoComplete="tel" className="field" /></Field>
          <Field label="Email Address"><input name="email" required type="email" autoComplete="email" className="field" /></Field>
          <Field label="State"><input name="state" required autoComplete="address-level1" className="field" /></Field>
          <Field label="City"><input name="city" required autoComplete="address-level2" className="field" /></Field>
          <Field label="Interested In">
            <select name="program" required value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="field">
              {programs.map((program) => <option key={program.name}>{program.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Profession / Business Type"><select name="profession" required defaultValue="" className="field"><option value="" disabled>Select your profession</option>{professionals.map((item) => <option key={item}>{item}</option>)}</select></Field></div>
          <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground sm:col-span-2"><input required type="checkbox" className="mt-0.5 h-4 w-4 accent-orange" /><span>I agree to be contacted by India Business Care regarding this partnership application.</span></label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={status === "loading"} aria-busy={status === "loading"} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-orange px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">{status === "loading" ? "Submitting…" : "Submit Partnership Application"}<ArrowRight className="h-4 w-4" /></button>
            {status === "success" && <p role="status" className="mt-3 text-sm text-green-700">Your partnership application has been submitted. Our team will contact you to discuss the next steps.</p>}
            {status === "error" && <p role="alert" className="mt-3 text-sm text-destructive">{submitError}</p>}
            <p className="mt-3 text-center text-xs text-muted-foreground">Your details are sent securely to our partnership team.</p>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-navy-dark">{label} <span className="text-orange">*</span>{children}</label>;
}
