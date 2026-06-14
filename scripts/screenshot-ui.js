const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/app/dashboard");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "public/screenshot-dashboard.png" });

  const screens = [
    ["Repository Scanner", "public/screenshot-repos.png"],
    ["Crypto Inventory", "public/screenshot-inventory.png"],
    ["Certificate Planner", "public/screenshot-certs.png"],
    ["AI Assistant", "public/screenshot-assistant.png"],
    ["Migration Roadmap", "public/screenshot-roadmap.png"],
    ["Compliance", "public/screenshot-compliance.png"],
  ];

  for (const [label, path] of screens) {
    try {
      await page.click(`text=${label}`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path });
    } catch (e) {
      console.log("skip", label, e.message);
    }
  }

  await browser.close();
  console.log("Screenshots saved");
})();
