const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const budgets = [
  { file: "index.html", maxBytes: 16_000 },
  { file: "css/style.css", maxBytes: 16_000 },
  { file: "js/challenges.js", maxBytes: 18_000 },
  { file: "assets/icons/triforce.png", maxBytes: 2_800_000 }
];

let hasError = false;

for (const budget of budgets) {
  const fullPath = path.join(root, budget.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing required asset: ${budget.file}`);
    hasError = true;
    continue;
  }

  const size = fs.statSync(fullPath).size;
  if (size > budget.maxBytes) {
    console.error(`${budget.file} exceeds budget: ${size} bytes > ${budget.maxBytes} bytes`);
    hasError = true;
  } else {
    console.log(`${budget.file} within budget: ${size} bytes <= ${budget.maxBytes} bytes`);
  }
}

const criticalBundle = ["index.html", "css/style.css", "js/challenges.js"]
  .map((file) => fs.statSync(path.join(root, file)).size)
  .reduce((sum, size) => sum + size, 0);

const criticalBudget = 55_000;
if (criticalBundle > criticalBudget) {
  console.error(`Critical bundle exceeds budget: ${criticalBundle} bytes > ${criticalBudget} bytes`);
  hasError = true;
} else {
  console.log(`Critical bundle within budget: ${criticalBundle} bytes <= ${criticalBudget} bytes`);
}

if (hasError) {
  process.exit(1);
}

console.log("Performance budget checks passed.");
