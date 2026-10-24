import { test, expect } from "playwright/test";
import path from "node:path";
test.beforeEach(async ({ page }) => {
  await page.route("http://localhost:3017/**", async (route) => {
    const url = new URL(route.request().url());
    const file = url.pathname === "/" ? "/index.html" : url.pathname;
    const types: Record<string, string> = {
      html: "text/html",
      js: "application/javascript",
      css: "text/css",
      txt: "text/plain",
    };
    await route.fulfill({
      path: path.join(process.cwd(), "out", file),
      contentType:
        types[file.split(".").pop() || ""] || "application/octet-stream",
    });
  });
});
test("five-minute evidence-to-decision demonstration, persistence, print and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Evaluation portfolio", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Review Northstar", exact: true })
    .click();
  await expect(page.locator("#northstar-c1")).toContainText("Inconclusive");
  await expect(
    page.getByText("12 / 12 activities complete", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("#northstar-e1")).toContainText(
    "authenticated scenarios were excluded",
  );
  await page
    .locator("#northstar-c1")
    .getByRole("button", { name: "Record validation result", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Result summary")
    .fill(
      "All 20 agreed authenticated booking cases retained the session without forced re-login.",
    );
  await dialog
    .getByLabel("Method used")
    .fill("Customer-observed authenticated cross-route test.");
  await dialog
    .getByLabel("Test environment")
    .fill("Fictional staging identity provider and agreed browser matrix.");
  await dialog
    .getByLabel("Limitations", { exact: true })
    .fill("Agreed sample only; production has not been validated.");
  await dialog.getByLabel("Does this evidence establish").selectOption("yes");
  await dialog
    .getByLabel("Explicit criterion finding")
    .selectOption("Criterion met");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#northstar-c1")).toContainText("Criterion met");
  await expect(page.locator("#northstar-c1")).toContainText(
    "Customer acceptance: Pending",
  );
  await page
    .getByRole("button", { name: "Assign an action", exact: true })
    .click();
  await dialog
    .getByLabel("Next customer action")
    .fill("Ruth Ellis to review findings and confirm acceptance.");
  await dialog.getByLabel("Action owner", { exact: true }).fill("Ruth Ellis");
  await dialog.getByRole("button", { name: "Save record" }).click();
  await expect(
    page.getByText("Ruth Ellis to review findings and confirm acceptance.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Manager Review", exact: true })
    .click();
  await page.getByLabel("SA owner", { exact: true }).selectOption("Amara Cole");
  await expect(
    page.getByRole("heading", {
      name: "Critical requirement remains unproven",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Critical criterion has no validation plan",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Technical success awaits customer acceptance",
      exact: true,
    }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Field Patterns", exact: true })
    .click();
  const identity = page.locator(".patterns .panel").filter({
    hasText: "Identity continuity needs a representative customer test.",
  });
  await expect(identity).toContainText("2 opportunities");
  await identity
    .getByRole("button", { name: "Northstar Travel", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("#northstar-c1")).toContainText("Criterion met");
  await expect(
    page.getByText("Ruth Ellis to review findings and confirm acceptance.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Printable brief", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Findings against acceptance criteria" }),
  ).toBeVisible();
  await expect(page.locator(".brief")).toContainText(
    "Customer acceptance: Pending",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".sidebar")).toBeHidden();
  await expect(page.locator(".brief")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page
    .getByRole("button", { name: "Reusable Plays", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Invoice extraction with human review",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Northstar Travel", exact: true })
    .click();
  await expect(
    page.getByText("Draft · Review required", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Restore original demo", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Review Northstar", exact: true })
    .click();
  await expect(page.locator("#northstar-c1")).toContainText("Inconclusive");
  await expect(
    page.getByText("Ruth Ellis to review findings and confirm acceptance.", {
      exact: true,
    }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("mobile portfolio, filters and form validation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Region", { exact: true }).selectOption("DACH");
  await expect(page.locator(".portfolio-row")).toHaveCount(2);
  await page.getByLabel("Search evaluations").fill("nothing matches");
  await expect(
    page.getByText("No evaluations match these filters.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Evaluation Workspace", exact: true })
    .click();
  await page
    .locator("#northstar-c1")
    .getByRole("button", { name: "Record customer acceptance", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("combobox", { name: "Customer acceptance", exact: true })
    .selectOption("Accepted");
  await page
    .getByRole("dialog")
    .getByLabel("Customer reviewer", { exact: true })
    .fill("Ruth Ellis");
  await page.getByRole("button", { name: "Save record" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "supported met finding",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
});
