// Run on each local form route using: agent-browser eval --stdin < this-file
// All email submissions are intercepted; this never sends a real application.
(async () => {
  const pause = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const path = location.pathname;
  const lead = path === "/";
  const company = path === "/company-registration";
  const trademark = path === "/services/trademark-registration";
  const partner = path === "/partner-with-us";
  if (lead) {
    sessionStorage.removeItem("india-business-care-lead-popup-shown");
    await pause(5500);
  } else {
    const close = document.querySelector('[role="dialog"] button:last-child');
    if (close?.textContent.includes("Close")) { close.click(); await pause(); }
  }
  if (company || trademark) {
    const title = company ? "Select Plan" : "Check Availability";
    [...document.querySelectorAll("button")].find(button => button.textContent === title).click();
    await pause();
  }
  const form = document.querySelector(lead || company || trademark ? '[role="dialog"] form' : partner ? '#partner-form form' : 'form[aria-label="Service inquiry form"]');
  assert(form, "Form not found on " + path);
  let mode = "failure";
  const requests = [];
  const original = window.fetch;
  window.fetch = async (url, options) => {
    if (!String(url).includes("api.web3forms.com")) return original(url, options);
    requests.push(JSON.parse(options.body));
    await pause(250);
    return Response.json({ success: mode === "success" }, { status: mode === "success" ? 200 : 503 });
  };
  const input = async (element, value) => {
    const prototype = element.tagName === "SELECT" ? HTMLSelectElement.prototype : element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, value);
    element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    await pause(10);
  };
  try {
    form.requestSubmit(); await pause();
    assert(requests.length === 0, "Empty form submitted");
    for (const element of form.querySelectorAll("input,textarea,select")) {
      if (element.readOnly || element.disabled || element.name === "website") continue;
      if (element.type === "checkbox") { element.click(); continue; }
      let value = "Test Business";
      if (element.type === "tel") value = "9876543210";
      if (element.type === "email") value = "test@example.com";
      if (element.type === "number") value = "2";
      if (element.tagName === "TEXTAREA") value = "Please contact me about this service.";
      if (element.tagName === "SELECT") value = [...element.options].find(option => option.value && !option.disabled).value;
      await input(element, value);
    }
    const phone = form.querySelector('input[type="tel"]');
    await input(phone, "123"); form.requestSubmit(); await pause();
    assert(requests.length === 0, "Invalid mobile number submitted");
    if (phone.pattern) {
      assert(new RegExp(phone.pattern, "v").test("+91-9876543210"), "Phone pattern rejects supported country code");
      assert(!phone.checkValidity(), "Browser phone validation not working");
    }
    await input(phone, "9876543210");
    // Contact form must reject an unselected service.
    const service = form.querySelector('select[name="service"]');
    if (service && !service.disabled) {
      const chosen = service.value;
      await input(service, ""); form.requestSubmit(); await pause();
      assert(requests.length === 0, "Missing service submitted");
      await input(service, chosen);
    }
    const values = [...form.querySelectorAll("input,textarea,select")].map(element => element.value);
    form.requestSubmit(); await pause(60);
    assert(form.querySelector('button:not([type="button"])').disabled, "Submit not disabled while pending");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await pause(300);
    assert(requests.length === 1, "Duplicate submission occurred");
    assert(document.querySelector('[role="alert"]'), "Failure message missing");
    assert(JSON.stringify(values) === JSON.stringify([...form.querySelectorAll("input,textarea,select")].map(element => element.value)), "Failure lost data");
    mode = "success"; form.requestSubmit(); await pause(350);
    assert(requests.length === 2, "Retry not submitted");
    assert(!document.querySelector('[role="alert"]'), "Stale failure message after success");
    assert(document.body.innerText.includes("submitted") || document.body.innerText.includes("Thank you"), "Success not shown");
    assert(requests[1].name && requests[1].phone && requests[1].service, "Payload missing fields");
    if (company || trademark) assert(requests[1].selectedPlan, "Plan missing");
    if (partner) assert(requests[1].program && requests[1].profession && requests[1].city, "Partnership details missing");
    if (lead) assert(!("email" in requests[1]), "Empty reply-to sent");
    return { path, validation: true, loading: true, duplicateGuard: true, failureRetainsData: true, retry: true, success: true, payload: true };
  } finally { window.fetch = original; }
})()
