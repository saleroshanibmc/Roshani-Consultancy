// Run on /admin/clients. All admin API calls are mocked; no real data is changed.
(async () => {
  const pause = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const click = async (text) => {
    const button = [...document.querySelectorAll("button")].find(button => button.textContent.trim() === text);
    assert(button, "Missing button: " + text); button.click(); await pause();
  };
  const fill = async (element, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true })); await pause(10);
  };
  let fail = true;
  const original = window.fetch;
  const requests = [];
  window.fetch = async (url, options = {}) => {
    if (!String(url).startsWith("/api/admin/")) return original(url, options);
    if (!options.method || options.method === "GET") {
      if (url.endsWith("session")) return Response.json({ authenticated: true });
      if (url.endsWith("clients")) return Response.json({ clients: [] });
      if (url.endsWith("services")) return Response.json({ services: [] });
      if (url.endsWith("settings")) return Response.json({ settings: { show_client_name_publicly: "false" } });
    }
    requests.push({ url, body: options.body });
    await pause(200);
    if (fail) return Response.json({ error: "Test submission failed" }, { status: 503 });
    if (url.endsWith("import")) return Response.json({ total: 1, imported: 1, updated: 0, duplicates: 0, invalid: 0, failed: 0, errors: [] });
    return Response.json({ success: true });
  };
  const submitFlow = async () => {
    const form = document.querySelector("form");
    const start = requests.length;
    fail = true; form.requestSubmit(); await pause(50);
    assert(form.querySelector('button:not([type="button"])').disabled, "Missing pending state");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await pause(250);
    assert(requests.length === start + 1, "Duplicate request");
    assert(document.querySelector('[role="alert"]')?.textContent.includes("Test submission failed"), "Missing error");
    fail = false; form.requestSubmit(); await pause(300);
    assert(requests.length === start + 2, "Retry failed");
    assert(!document.querySelector('[role="alert"]'), "Stale error");
  };
  try {
    await fill(document.querySelector('input[type="password"]'), "mock-password");
    await submitFlow();
    assert(document.body.innerText.includes("Client Portfolio Admin"), "Login did not complete");
    await click("Add New Client");
    for (const element of document.querySelectorAll("input[required]")) await fill(element, "Test Company");
    await submitFlow();
    assert(document.body.innerText.includes("Client added."), "Client save failed");
    await click("Services");
    await fill(document.querySelector('input[placeholder="New service name"]'), "Test Service");
    await submitFlow();
    await click("Client Settings");
    fail = true; await click("Save Settings"); await pause(250);
    assert(document.querySelector('[role="alert"]'), "Settings error hidden");
    fail = false; await click("Save Settings"); await pause(250);
    assert(!document.querySelector('[role="alert"]'), "Settings error not cleared");
    assert(document.querySelector("main").innerText.includes("Saved"), "Settings not saved");
    document.querySelector('input[type="checkbox"]').click(); await pause();
    assert(!document.querySelector("main").innerText.includes("Saved"), "Stale saved notice after editing");
    await click("Import from Excel");
    const chooseFile = async (name) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(["Company Name,City,Nature of Business\nTest Co,Akola,Consulting"], name, { type: "text/csv" }));
      const element = document.querySelector('input[type="file"]');
      element.files = transfer.files;
      element.dispatchEvent(new Event("change", { bubbles: true })); await pause(200);
    };
    await chooseFile("test.csv");
    assert(document.body.innerText.includes("1 valid data rows"), "CSV preview missing");
    await chooseFile("invalid.txt");
    assert(!document.body.innerText.includes("valid data rows"), "Invalid file retained previous import");
    await chooseFile("test.csv");
    const button = [...document.querySelectorAll("button")].find(button => button.textContent.includes("Import Clients"));
    assert(button, "Import button missing");
    fail = true; button.click(); await pause(50); assert(button.disabled, "Import not disabled"); await pause(250);
    assert(document.querySelector('[role="alert"]'), "Import failure hidden");
    fail = false; button.click(); await pause(300);
    assert(!document.querySelector('[role="alert"]'), "Import failure not cleared");
    assert(document.body.innerText.includes("Import report"), "Import report missing");
    return { login: true, clientSave: true, services: true, settings: true, csvImport: true, invalidFileClearsPrevious: true, failureAndRetry: true, realDataChanged: false };
  } finally { window.fetch = original; }
})()
