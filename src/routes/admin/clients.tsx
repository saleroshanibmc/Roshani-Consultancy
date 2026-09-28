import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Check,
  Download,
  Edit3,
  ImageOff,
  LogOut,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { getClientInitials, type ClientRecord } from "@/data/clients";

type AdminClient = ClientRecord & { clientName?: string; updatedAt?: string };
type ImportReport = {
  total: number;
  imported: number;
  updated: number;
  duplicates: number;
  invalid: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
};
type AdminService = { id: number; service_name: string; slug: string };
type Tab = "clients" | "form" | "import" | "services" | "settings";
const emptyClient = (): Partial<AdminClient> => ({
  companyName: "",
  clientName: "",
  natureOfBusiness: "",
  city: "",
  services: [],
  displayOrder: 0,
  isFeatured: false,
  isPublished: true,
});
function cookie(name: string) {
  return (
    document.cookie
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") || ""
  );
}
async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("content-type", "application/json");
  if (!["GET", "HEAD"].includes(options.method || "GET"))
    headers.set("x-csrf-token", decodeURIComponent(cookie("client_admin_csrf")));
  const response = await fetch(path, { ...options, headers, credentials: "same-origin" });
  const data = await response.json().catch(() => { throw new Error("Unexpected server response. Please try again."); });
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
export const Route = createFileRoute("/admin/clients")({
  head: () => ({
    meta: [
      { title: "Client Management | India Business Care" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminClients,
});

function AdminClients() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [tab, setTab] = useState<Tab>("clients");
  const [editing, setEditing] = useState<Partial<AdminClient>>(emptyClient());
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    setError("");
    try {
      const session = await api("/api/admin/session");
      setAuthenticated(session.authenticated);
      if (!session.authenticated) return;
      const data = await api("/api/admin/clients");
      setClients(data.clients);
    } catch (err) {
      setAuthenticated((current) => current ?? false);
      setError(err instanceof Error ? err.message : "Could not load clients.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  if (authenticated === null) return <Centered>Checking secure sessionâ€¦</Centered>;
  if (!authenticated) return <Login onSuccess={load} />;
  const filtered = clients.filter((c) =>
    [c.companyName, c.clientName, c.city, c.natureOfBusiness, ...c.services]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const id = editing.id;
      await api(id ? `/api/admin/clients/${id}` : "/api/admin/clients", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(editing),
      });
      setMessage(id ? "Client updated." : "Client added.");
      setEditing(emptyClient());
      setTab("clients");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save client.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this client permanently? This cannot be undone.")) return;
    await api(`/api/admin/clients/${id}`, { method: "DELETE" });
    setMessage("Client deleted.");
    await load();
  };
  const bulk = async (action: string) => {
    if (!selected.length) return;
    if (action === "delete" && !confirm(`Delete ${selected.length} selected clients permanently?`))
      return;
    await api("/api/admin/clients/bulk", {
      method: "POST",
      body: JSON.stringify({ ids: selected.map(Number), action }),
    });
    setSelected([]);
    setMessage("Bulk action completed.");
    await load();
  };
  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  };
  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">
              India Business Care
            </p>
            <h1 className="text-xl font-bold text-navy-dark">Client Portfolio Admin</h1>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside
          className="h-fit rounded-2xl border border-border bg-white p-3 shadow-sm"
          aria-label="Client admin navigation"
        >
          {(
            [
              ["clients", "All Clients"],
              ["form", "Add New Client"],
              ["import", "Import from Excel"],
              ["services", "Services"],
              ["settings", "Client Settings"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                if (key === "form") setEditing(emptyClient());
              }}
              className={`mb-1 block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${tab === key ? "bg-navy text-white" : "hover:bg-navy-soft"}`}
            >
              {label}
            </button>
          ))}
        </aside>
        <main>
          {message && <Notice onClose={() => setMessage("")}>{message}</Notice>}
          {error && <ErrorNotice>{error}</ErrorNotice>}
          {tab === "clients" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search clients"
                    className="h-10 w-full rounded-xl border border-border bg-white pl-10 pr-3"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditing(emptyClient());
                    setTab("form");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add Client
                </button>
              </div>
              {selected.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3 text-sm">
                  <strong>{selected.length} selected</strong>
                  {[
                    ["publish", "Publish"],
                    ["unpublish", "Unpublish"],
                    ["feature", "Feature"],
                    ["unfeature", "Remove featured"],
                    ["delete", "Delete"],
                  ].map(([a, l]) => (
                    <button
                      key={a}
                      onClick={() => void bulk(a)}
                      className="rounded-full border border-border px-3 py-1.5 font-semibold hover:bg-navy-soft"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-navy-soft text-navy-dark">
                    <tr>
                      {[
                        "",
                        "Logo",
                        "Company",
                        "Contact person",
                        "Business",
                        "City",
                        "Services",
                        "Featured",
                        "Published",
                        "Order",
                        "Actions",
                      ].map((h) => (
                        <th key={h} className="px-3 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr key={client.id} className="border-t border-border align-top">
                        <td className="px-3 py-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(client.id)}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, client.id]
                                  : selected.filter((id) => id !== client.id),
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-4">
                          {client.logo ? (
                            <img
                              src={client.logo}
                              alt=""
                              className="h-10 w-10 rounded-lg object-contain"
                            />
                          ) : (
                            <span
                              className="grid h-10 w-10 place-items-center rounded-lg bg-orange-soft text-xs font-bold text-orange"
                              title="Logo missing"
                            >
                              {getClientInitials(client.companyName)}
                            </span>
                          )}
                        </td>
                        <td className="max-w-[220px] px-3 py-4 font-semibold text-navy-dark">
                          {client.companyName}
                        </td>
                        <td className="px-3 py-4">{client.clientName || "â€”"}</td>
                        <td className="px-3 py-4">{client.natureOfBusiness}</td>
                        <td className="px-3 py-4">{client.city}</td>
                        <td className="max-w-[260px] px-3 py-4">
                          {client.services.join(", ") || "â€”"}
                        </td>
                        <td className="px-3 py-4">{client.isFeatured ? "Yes" : "No"}</td>
                        <td className="px-3 py-4">{client.isPublished ? "Published" : "Hidden"}</td>
                        <td className="px-3 py-4">{client.displayOrder}</td>
                        <td className="px-3 py-4">
                          <div className="flex gap-2">
                            <button
                              aria-label={`Edit ${client.companyName}`}
                              onClick={() => {
                                setEditing(client);
                                setTab("form");
                              }}
                              className="rounded-lg border border-border p-2 text-navy"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              aria-label={`Delete ${client.companyName}`}
                              onClick={() => void remove(client.id)}
                              className="rounded-lg border border-red-200 p-2 text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filtered.length && (
                  <p className="p-10 text-center text-muted-foreground">
                    No clients match your search.
                  </p>
                )}
              </div>
            </section>
          )}
          {tab === "form" && (
            <ClientForm
              client={editing}
              setClient={setEditing}
              onSubmit={save}
              saving={saving}
              onCancel={() => setTab("clients")}
              onUploaded={load}
            />
          )}{" "}
          {tab === "import" && (
            <ImportPanel
              onImported={async () => {
                await load();
                setMessage("Import completed.");
              }}
            />
          )}{" "}
          {tab === "services" && <ServicesPanel />} {tab === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}
function Login({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Centered>
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-border bg-white p-7 text-left shadow-soft"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-orange">
          Secure administration
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy-dark">Client Portfolio Login</h1>
        <label className="mt-6 block text-sm font-semibold">
          Admin password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-2 h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button disabled={pending} className="mt-5 w-full rounded-full bg-orange px-5 py-3 font-semibold text-white disabled:opacity-70">
          {pending ? "Logging in..." : "Log in"}
        </button>
      </form>
    </Centered>
  );
}
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4 text-center text-muted-foreground">
      {children}
    </div>
  );
}
function Field({
  label,
  required,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  required?: boolean;
  value: unknown;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <input
        type={type}
        required={required}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-2 w-full rounded-xl border border-border bg-white p-3 font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
      />
    </label>
  );
}
function ClientForm({
  client,
  setClient,
  onSubmit,
  onCancel,
  onUploaded,
  saving,
}: {
  client: Partial<AdminClient>;
  setClient: (value: Partial<AdminClient>) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  onUploaded: () => Promise<void>;
  saving: boolean;
}) {
  const [service, setService] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState("");
  const change = (key: keyof AdminClient, value: unknown) => setClient({ ...client, [key]: value });
  const addService = () => {
    const value = service.trim();
    if (value && !client.services?.includes(value))
      change("services", [...(client.services || []), value]);
    setService("");
  };
  const upload = async () => {
    if (!client.id || !logo) return;
    setLogoError("");
    try {
      const form = new FormData();
      form.set("logo", logo);
      await api(`/api/admin/clients/${client.id}/logo`, { method: "POST", body: form });
      setLogo(null);
      await onUploaded();
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : "Upload failed.");
    }
  };
  const removeLogo = async () => {
    if (!client.id || !confirm("Remove this client logo?")) return;
    try {
      await api(`/api/admin/clients/${client.id}/logo`, { method: "DELETE" });
      change("logo", undefined);
      await onUploaded();
    } catch (e) {
      setLogoError(e instanceof Error ? e.message : "Could not remove logo.");
    }
  };
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel title={client.id ? "Edit Client" : "Add New Client"}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Company Name"
            required
            value={client.companyName}
            onChange={(v) => change("companyName", v)}
          />
          <Field
            label="Client / Contact Person Name"
            value={client.clientName}
            onChange={(v) => change("clientName", v)}
          />
          <Field
            label="Nature of Business"
            required
            value={client.natureOfBusiness}
            onChange={(v) => change("natureOfBusiness", v)}
          />
          <Field label="City" required value={client.city} onChange={(v) => change("city", v)} />
          <Field
            label="Website URL"
            type="url"
            value={client.websiteUrl}
            onChange={(v) => change("websiteUrl", v)}
          />
          <Field
            label="Display Order"
            type="number"
            value={client.displayOrder}
            onChange={(v) => change("displayOrder", Number(v))}
          />
        </div>
        <div className="mt-4">
          <TextArea
            label="Short Description"
            value={client.shortDescription}
            onChange={(v) => change("shortDescription", v)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-5">
          <Toggle
            label="Featured Client"
            checked={Boolean(client.isFeatured)}
            onChange={(v) => change("isFeatured", v)}
          />
          <Toggle
            label="Published"
            checked={client.isPublished !== false}
            onChange={(v) => change("isPublished", v)}
          />
        </div>
      </Panel>
      <Panel title="Client / Company Logo">
        <p className="text-sm text-muted-foreground">
          Recommended: 500 Ã— 500 px. PNG, JPG, JPEG, WEBP or sanitized SVG. Maximum 2 MB.
        </p>
        <div className="mt-4 rounded-2xl border-2 border-dashed border-border p-5">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              if (f && f.size > 2 * 1024 * 1024) {
                setLogoError("Logo must be 2 MB or smaller.");
                setLogo(null);
              } else {
                setLogoError("");
                setLogo(f);
              }
            }}
          />
          {client.logo && (
            <img
              src={client.logo}
              alt={client.logoAltText || `${client.companyName} logo`}
              className="mb-3 h-24 w-40 rounded-xl bg-white object-contain p-2"
            />
          )}
          {logo && <p className="mt-2 text-sm">Selected: {logo.name}</p>}
          {logoError && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {logoError}
            </p>
          )}
          {client.id && logo && (
            <button
              type="button"
              onClick={() => void upload()}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
            >
              <Upload className="h-4 w-4" />
              Upload / Replace Logo
            </button>
          )}
          {client.id && client.logo && (
            <button
              type="button"
              onClick={() => void removeLogo()}
              className="ml-2 mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
            >
              <Trash2 className="h-4 w-4" /> Remove Logo
            </button>
          )}
          {!client.id && (
            <p className="mt-2 text-xs text-muted-foreground">
              Save the client first, then upload its logo.
            </p>
          )}
        </div>
        <div className="mt-4">
          <Field
            label="Logo Alt Text"
            value={client.logoAltText}
            onChange={(v) => change("logoAltText", v)}
          />
        </div>
      </Panel>
      <Panel title="Services Provided">
        <div className="flex gap-2">
          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addService();
              }
            }}
            placeholder="Type a service and press Add"
            className="h-11 flex-1 rounded-xl border border-border px-3"
          />
          <button
            type="button"
            onClick={addService}
            className="rounded-xl bg-navy px-4 font-semibold text-white"
          >
            Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {client.services?.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() =>
                change(
                  "services",
                  client.services?.filter((v) => v !== item),
                )
              }
              className="rounded-full bg-navy-soft px-3 py-1.5 text-sm font-medium text-navy"
              title="Remove service"
            >
              {item} Ã—
            </button>
          ))}
        </div>
      </Panel>
      <Panel title="Case Study Details">
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Client Requirement"
            value={client.projectRequirement}
            onChange={(v) => change("projectRequirement", v)}
          />
          <TextArea
            label="Solution Provided"
            value={client.solutionProvided}
            onChange={(v) => change("solutionProvided", v)}
          />
          <TextArea
            label="Result / Outcome"
            value={client.resultSummary}
            onChange={(v) => change("resultSummary", v)}
          />
          <TextArea
            label="Client Testimonial"
            value={client.testimonial}
            onChange={(v) => change("testimonial", v)}
          />
          <Field
            label="Testimonial Person Name"
            value={client.testimonialPersonName}
            onChange={(v) => change("testimonialPersonName", v)}
          />
          <Field
            label="Person Designation"
            value={client.testimonialPersonDesignation}
            onChange={(v) => change("testimonialPersonDesignation", v)}
          />
        </div>
      </Panel>
      <div className="flex gap-3">
        <button disabled={saving} className="rounded-full bg-orange px-6 py-3 font-semibold text-white disabled:opacity-70">
          {saving ? "Saving..." : client.id ? "Update Client" : "Add Client"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-6 py-3 font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-orange"
      />
      {label}
    </label>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-navy-dark">{title}</h2>
      {children}
    </section>
  );
}
const aliases: Record<string, string[]> = {
  clientName: [
    "client",
    "clientname",
    "claint",
    "claintname",
    "contactperson",
    "contactpersonname",
  ],
  companyName: ["company", "companyname", "businessname", "organization", "organisation"],
  natureOfBusiness: ["natureofbusiness", "businesstype", "businesscategory", "nature"],
  city: ["city", "location", "place"],
  services: ["service", "services", "serviceweoffer", "servicesprovided"],
  websiteUrl: ["website", "websiteurl", "url"],
  shortDescription: ["shortdescription", "description"],
};
const headerKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function mapRows(matrix: string[][]) {
  const headers = matrix[0] || [];
  const mapping: Record<string, number> = {};
  for (const [field, names] of Object.entries(aliases)) {
    const index = headers.findIndex((h) => names.includes(headerKey(h)));
    if (index >= 0) mapping[field] = index;
  }
  return matrix
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => ({
      clientName: row[mapping.clientName] || "",
      companyName: row[mapping.companyName] || "",
      natureOfBusiness: row[mapping.natureOfBusiness] || "Other",
      city: row[mapping.city] || "Not specified",
      services: (row[mapping.services] || "")
        .split(/[,;|]+/)
        .map((v) => v.trim())
        .filter(Boolean),
      websiteUrl: row[mapping.websiteUrl] || "",
      shortDescription: row[mapping.shortDescription] || "",
      isPublished: true,
      isFeatured: false,
    }));
}
function parseCsv(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === '"' && quoted && value[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && value[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
function ImportPanel({ onImported }: { onImported: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mode, setMode] = useState("skip");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const preview = async (selected: File) => {
    setError("");
    setFile(null);
    setRows([]);
    setReport(null);
    if (selected.size > 10 * 1024 * 1024) {
      setError("Spreadsheet must be 10 MB or smaller.");
      return;
    }
    try {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      let matrix: string[][];
      if (ext === "csv") {
        matrix = parseCsv(await selected.text());
      } else if (ext === "xlsx" || ext === "xls") {
        const workbook = XLSX.read(await selected.arrayBuffer(), { type: "array", dense: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false });
      } else {
        throw new Error("Use an .xlsx, .xls or .csv file.");
      }
      setFile(selected);
      setRows(mapRows(matrix));
      setReport(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read spreadsheet.");
    }
  };
  const run = async () => {
    if (!file || pending) return;
    setPending(true);
    setError("");
    try {
      const result = await api("/api/admin/import", {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, duplicateMode: mode, rows }),
      });
      setReport(result);
      await onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setPending(false);
    }
  };
  const download = () => {
    if (!report) return;
    const csv = [
      "Row,Reason",
      ...report.errors.map(
        (e: { row: number; reason: string }) =>
          `${e.row},"${String(e.reason).replaceAll('"', '""')}"`,
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "client-import-errors.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Panel title="Import from Excel / CSV">
      <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
        <Upload className="mx-auto h-7 w-7 text-orange" />
        <p className="mt-2 text-sm text-muted-foreground">
          Upload XLSX, XLS or CSV, maximum 10 MB. Flexible headings include â€œClaint Nameâ€ and
          â€œService We Offerâ€.
        </p>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={pending}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void preview(f);
          }}
          className="mt-4"
        />
      </div>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {rows.length > 0 && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <strong>{rows.length} valid data rows detected</strong>
            <label className="text-sm">
              Duplicates{" "}
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="ml-2 rounded-lg border border-border p-2"
              >
                <option value="skip">Skip existing</option>
                <option value="update">Update existing</option>
                <option value="new">Import as new</option>
              </select>
            </label>
            <button
              onClick={() => void run()}
              disabled={pending}
              className="rounded-full bg-orange px-5 py-2.5 text-sm font-semibold text-white"
            >
              Import Clients
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr>
                  {["Company", "Client", "Business", "City", "Services"].map((h) => (
                    <th className="border-b p-2" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {[
                      row.companyName,
                      row.clientName,
                      row.natureOfBusiness,
                      row.city,
                      (row.services as string[]).join(", "),
                    ].map((v, j) => (
                      <td key={j} className="border-b p-2">
                        {String(v || "â€”")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {report && (
        <div className="mt-5 rounded-2xl bg-navy-soft p-5">
          <h3 className="font-bold text-navy-dark">Import report</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-6">
            {[
              ["Total", report.total],
              ["Imported", report.imported],
              ["Updated", report.updated],
              ["Duplicates", report.duplicates],
              ["Invalid", report.invalid],
              ["Failed", report.failed],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-white p-3">
                <strong className="block text-lg">{v}</strong>
                {l}
              </div>
            ))}
          </div>
          {report.errors.length > 0 && (
            <button
              onClick={download}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy"
            >
              <Download className="h-4 w-4" />
              Download error report
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}
function ServicesPanel() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const load = async () => {
    try {
      setServices((await api("/api/admin/services")).services);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load services.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError("");
    if (!name.trim()) { setError("Please enter a service name."); return; }
    setPending(true);
    try {
      await api("/api/admin/services", { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add service.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel title="Services">
      <form onSubmit={add} className="flex gap-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New service name"
          className="h-11 flex-1 rounded-xl border border-border px-3"
        />
        <button disabled={pending} className="rounded-xl bg-navy px-5 font-semibold text-white disabled:opacity-70">{pending ? "Adding..." : "Add Service"}</button>
      </form>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="mt-5 flex flex-wrap gap-2">
        {services.map((service) => (
          <span
            key={service.id}
            className="rounded-full bg-navy-soft px-3 py-1.5 text-sm font-medium text-navy"
          >
            {service.service_name}
          </span>
        ))}
      </div>
    </Panel>
  );
}
function SettingsPanel() {
  const [showName, setShowName] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/admin/settings")
      .then((data) => { setShowName(data.settings?.show_client_name_publicly === "true"); setLoaded(true); })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load settings."));
  }, []);
  const save = async () => {
    if (pending || !loaded) return;
    setPending(true);
    setSaved(false);
    setError("");
    try {
    await api("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ showClientNamePublicly: showName }),
    });
    setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  };
  return (
    <Panel title="Client Settings">
      <Toggle
        label="Show client/contact person name publicly"
        checked={showName}
        onChange={(value) => { if (pending || !loaded) return; setShowName(value); setSaved(false); }}
      />
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Privacy protection defaults to OFF. Personal names should only be shown after explicit
        client consent.
      </p>
      <button
        onClick={() => void save()}
        disabled={pending || !loaded}
        className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white"
      >
        Save Settings
      </button>
      {saved && <span className="ml-3 text-sm font-semibold text-green-700">Saved</span>}
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Logo matching:</strong> Bulk logo filename matching is preview-only. Logos are never
        assigned automatically when a match is uncertain; upload each confirmed logo from Edit
        Client.
      </div>
    </Panel>
  );
}
function Notice({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900"
    >
      <span className="inline-flex items-center gap-2">
        <Check className="h-4 w-4" />
        {children}
      </span>
      <button onClick={onClose} aria-label="Dismiss">
        Ã—
      </button>
    </div>
  );
}
function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      {children}
    </div>
  );
}
