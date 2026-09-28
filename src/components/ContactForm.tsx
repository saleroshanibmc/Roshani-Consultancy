import { useMemo, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { serviceWhatsappLink } from "@/data/site";
import { SERVICES } from "@/data/services";
import { enquiryErrorMessage, submitEnquiry } from "@/lib/enquiry";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().trim().regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid WhatsApp number"),
  email: z.string().trim().email("Enter a valid email address").max(120),
  organizationName: z.string().trim().min(2, "Please enter your business or organization name").max(120),
  service: z.string().trim().min(1, "Please select a service"),
  message: z.string().trim().min(10, "Please add a short message").max(1000),
  website: z.string().max(0).optional(),
});

type FormState = Record<string, string>;
type Status = "idle" | "loading" | "success" | "error";

export function ContactForm({ defaultService, showIntro = false }: { defaultService?: string; showIntro?: boolean }) {
  const serviceOptions = useMemo(() => SERVICES.map((service) => service.title), []);
  const [state, setState] = useState<FormState>({ service: defaultService || "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState("");

  const set = (key: string, value: string) => {
    setState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    if (status === "success") setStatus("idle");
  };

  const selectedService = state.service || defaultService || "";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("idle");
    setSubmitError("");

    const parsed = schema.safeParse({
      name: state.name?.trim() || "",
      phone: state.phone?.replace(/[\s-]/g, "").trim() || "",
      email: state.email?.trim() || "",
      organizationName: state.organizationName?.trim() || "",
      service: selectedService,
      message: state.message?.trim() || "",
      website: state.website || "",
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStatus("loading");
    try {
      await submitEnquiry(parsed.data);
      setStatus("success");
    } catch (error) {
      setSubmitError(enquiryErrorMessage(error));
      setStatus("error");
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-white p-5 shadow-soft sm:p-6 lg:p-7" aria-label="Service inquiry form" noValidate>
      {showIntro && (
        <div className="mb-5">
          <h2 className="text-xl font-bold text-navy-dark">Get Expert Assistance</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Share your details and our team will respond with the next steps for this service.</p>
        </div>
      )}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={state.website || ""} onChange={(e) => set("website", e.target.value)} className="hidden" aria-hidden />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Full Name" name="name" value={state.name || ""} error={errors.name} onChange={set} />
        <Field label="WhatsApp Number" name="phone" type="tel" value={state.phone || ""} error={errors.phone} onChange={set} />
        <Field label="Email Address" name="email" type="email" value={state.email || ""} error={errors.email} onChange={set} />
        <Field label="Business / Organization Name" name="organizationName" value={state.organizationName || ""} error={errors.organizationName} onChange={set} />
        <SelectField label="Selected Service" name="service" value={selectedService} error={errors.service} onChange={set} options={serviceOptions} locked={Boolean(defaultService)} />
      </div>
      <div className="mt-4">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-navy-dark">Message <span className="text-orange">*</span></label>
        <textarea id="message" name="message" rows={3} value={state.message || ""} onChange={(e) => set("message", e.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20" />
        {errors.message && <ErrorText id="message-error">{errors.message}</ErrorText>}
      </div>
      {status === "success" && (
        <div className="mt-4 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 p-4 text-sm text-navy-dark" role="status">
          <div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#25D366]" /><p>Your inquiry has been submitted. You can also continue on WhatsApp for the fastest response.</p></div>
          <a href={serviceWhatsappLink(selectedService)} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> Continue on WhatsApp</a>
        </div>
      )}
      {status === "error" && <p className="mt-4 text-sm text-destructive" role="alert">{submitError}</p>}
      <button type="submit" disabled={status === "loading"} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-navy/30 disabled:cursor-not-allowed disabled:opacity-70">
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {status === "loading" ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}

function Field({ label, name, value, error, onChange, type = "text" }: { label: string; name: string; value: string; error?: string; onChange: (name: string, value: string) => void; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-navy-dark">{label} <span className="text-orange">*</span></label>
      <input id={name} name={name} type={type} value={value} onChange={(e) => onChange(name, e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20" />
      {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
    </div>
  );
}

function SelectField({ label, name, value, error, onChange, options, locked = false }: { label: string; name: string; value: string; error?: string; onChange: (name: string, value: string) => void; options: string[]; locked?: boolean }) {
  return (
    <div className="lg:col-span-2">
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-navy-dark">{label} <span className="text-orange">*</span></label>
      <select id={name} name={name} value={value} onChange={(e) => onChange(name, e.target.value)} disabled={locked} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:cursor-not-allowed disabled:opacity-80">
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <ErrorText id={`${name}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children, id }: { children: React.ReactNode; id?: string }) {
  return <p id={id} className="mt-1 text-xs text-destructive">{children}</p>;
}
