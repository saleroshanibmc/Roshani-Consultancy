import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import popupImage from "@/assets/popup_image.jpg";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { enquiryErrorMessage, submitEnquiry } from "@/lib/enquiry";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, "Please enter a valid phone number"),
  city: z.string().trim().min(2, "Please enter your city").max(80),
  field: z.string().trim().min(2, "Please enter your business field").max(120),
});

type LeadState = {
  name: string;
  phone: string;
  city: string;
  field: string;
};

const initialState: LeadState = { name: "", phone: "", city: "", field: "" };
const sessionKey = "india-business-care-lead-popup-shown";

export function LeadPopup() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadState, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(sessionKey)) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(sessionKey, "true");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  const updateField = (name: keyof LeadState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "loading") return;
    setSubmitError("");

    const parsed = leadSchema.safeParse({
      ...form,
      phone: form.phone.replace(/[\s-]/g, ""),
    });

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof LeadState, string>> = {};
      parsed.error.issues.forEach((issue) => {
        nextErrors[issue.path[0] as keyof LeadState] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    setStatus("loading");
    try {
      await submitEnquiry({
        ...parsed.data,
        email: "",
        organizationName: "",
        service: parsed.data.field,
        message: `Lead popup enquiry from ${parsed.data.city}. Business field: ${parsed.data.field}`,
        source: "lead-popup",
      });
      setStatus("success");
      window.setTimeout(() => setOpen(false), 1800);
    } catch (error) {
      setStatus("idle");
      setSubmitError(enquiryErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl gap-0 overflow-y-auto border-0 p-0 sm:rounded-2xl">
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-[510px] overflow-hidden bg-navy md:block">
            <img
              src={popupImage}
              alt="India Business Care consultation"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-light">
                India Business Care
              </p>
              <p className="mt-3 text-2xl font-bold leading-tight">
                Build your business with expert guidance.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                Share your details and our team will contact you shortly.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7 md:p-8">
            <DialogTitle className="pr-8 text-2xl font-bold text-navy-dark">
              Get a Free Consultation
            </DialogTitle>
            <DialogDescription className="mt-2 leading-relaxed">
              Tell us a little about your requirement. Our business expert will get in touch with
              you.
            </DialogDescription>

            {status === "success" ? (
              <div
                className="flex min-h-80 flex-col items-center justify-center text-center"
                role="status"
              >
                <CheckCircle2 className="h-14 w-14 text-[#25A65A]" />
                <h3 className="mt-4 text-xl font-bold text-navy-dark">Thank you!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your details have been submitted. Our team will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <LeadField
                  label="Name"
                  name="name"
                  value={form.name}
                  error={errors.name}
                  onChange={updateField}
                />
                <LeadField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  error={errors.phone}
                  onChange={updateField}
                />
                <LeadField
                  label="City"
                  name="city"
                  value={form.city}
                  error={errors.city}
                  onChange={updateField}
                />
                <LeadField
                  label="Business Field"
                  name="field"
                  value={form.field}
                  error={errors.field}
                  onChange={updateField}
                  placeholder="e.g. Retail, Manufacturing, Services"
                />
                {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-orange px-5 py-3 text-sm font-bold text-white transition hover:bg-orange/90 focus:outline-none focus:ring-2 focus:ring-orange/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === "loading" ? "Submitting..." : "Request a Call Back"}
                </button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  By submitting, you agree to be contacted regarding our services.
                </p>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeadField({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  name: keyof LeadState;
  value: string;
  error?: string;
  onChange: (name: keyof LeadState, value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`lead-${name}`} className="mb-1.5 block text-sm font-semibold text-navy-dark">
        {label} <span className="text-orange">*</span>
      </label>
      <input
        id={`lead-${name}`}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `lead-${name}-error` : undefined}
        className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/20"
      />
      {error && (
        <p id={`lead-${name}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
