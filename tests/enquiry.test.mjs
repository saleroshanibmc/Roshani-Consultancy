import { test } from "node:test";
import assert from "node:assert/strict";
import { submitEnquiry } from "../src/lib/enquiry.ts";

const payload = { name: " Test User ", phone: "+91 98765-43210", email: "test@example.com", organizationName: "Test", service: "GST", message: "Please contact me", source: "test" };

test("normalizes details and keeps plan-specific fields", async (t) => {
  let body;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    body = JSON.parse(options.body);
    return Response.json({ success: true });
  });
  await submitEnquiry({ ...payload, selectedPlan: "Premium" });
  assert.equal(body.name, "Test User");
  assert.equal(body.phone, "+919876543210");
  assert.equal(body.selectedPlan, "Premium");
});

test("callback requests omit empty email", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal("email" in JSON.parse(options.body), false);
    return Response.json({ success: true });
  });
  await submitEnquiry({ ...payload, email: "" });
});

test("invalid details never reach the provider", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected request"); });
  await assert.rejects(submitEnquiry({ ...payload, name: "   " }), /required fields/);
  await assert.rejects(submitEnquiry({ ...payload, phone: "123" }), /mobile number/);
  assert.equal(fetch.mock.callCount(), 0);
});

test("HTTP errors, rejected submissions, and malformed responses cannot report success", async (t) => {
  for (const response of [Response.json({ success: true }, { status: 500 }), Response.json({ success: false }), Response.json({ success: "true" }), new Response("not json")]) {
    const fetch = t.mock.method(globalThis, "fetch", async () => response);
    await assert.rejects(submitEnquiry(payload), /could not submit/);
    fetch.mock.restore();
  }
});

test("network failures preserve a useful retry message", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(submitEnquiry(payload), /internet connection/);
});

test("pending requests time out without claiming submission failed", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  const request = submitEnquiry(payload);
  const assertion = assert.rejects(request, /confirmation timed out/);
  t.mock.timers.tick(20000);
  await assertion;
});
