import { expect, test } from "@playwright/test";

test("social crawlers receive metadata and a full-size PNG without JavaScript", async ({
  request,
}) => {
  const response = await request.get("/");
  const html = await response.text();
  expect(html).toContain('property="og:title"');
  expect(html).toContain('property="og:description"');
  expect(html).toMatch(
    /property="og:image"\s+content="https:\/\/matchbox\.alexpatow\.com\/og-image\.png"/,
  );
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).toContain('name="twitter:image:alt"');
  const image = await request.get("/og-image.png");
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toContain("image/png");
  const bytes = await image.body();
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});
