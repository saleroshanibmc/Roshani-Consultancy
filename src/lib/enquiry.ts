export interface EnquiryPayload {
  name: string;
  phone: string;
  email: string;
  organizationName: string;
  service: string;
  message: string;
  website?: string;
  city?: string;
  field?: string;
  source?: string;
}

const WEB3FORMS_ACCESS_KEY = "2b653e2b-404c-47ee-94ab-64712b692f57";

export async function submitEnquiry(payload: EnquiryPayload & Record<string, string>) {
  const values = Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value?.trim()]),
  );
  if (!values.name || !values.service || !values.message) {
    throw new Error("Please complete the required fields.");
  }
  values.phone = values.phone?.replace(/[\s-]/g, "");
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(values.phone || "")) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }
  // The callback popup has no email field. Do not send an empty reply-to address.
  if (!values.email) delete values.email;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New inquiry: ${payload.service || payload.source || "Website"}`,
        from_name: "India Business Care Website",
        ...values,
      }),
    });

    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    if (!response.ok || result?.success !== true) {
      throw new Error(
        "We could not submit your inquiry. Your details have been kept. Please try again.",
      );
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "Submission confirmation timed out. Your details have been kept. Please contact us before retrying to avoid a duplicate inquiry.",
      );
    }
    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect. Check your internet connection and try again. Your details have been kept.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function enquiryErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "We could not submit your inquiry. Please try again.";
}
