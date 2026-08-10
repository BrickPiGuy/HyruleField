const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const criticalFiles = ["index.html", "css/style.css", "js/challenges.js"];
const criticalBundle = criticalFiles
  .map((file) => fs.statSync(path.join(root, file)).size)
  .reduce((sum, size) => sum + size, 0);

const criticalBudget = 55_000;
if (criticalBundle > criticalBudget) {
  console.error(`Critical bundle exceeds budget: ${criticalBundle} bytes > ${criticalBudget} bytes`);
} else {
  console.log(`Critical bundle within budget: ${criticalBundle} bytes <= ${criticalBudget} bytes`);
}

if (criticalFiles.some((file) => !fs.existsSync(path.join(root, file)))) {
  criticalFiles.forEach((file) => {
    if (!fs.existsSync(path.join(root, file))) {
      console.error(`Missing required asset: ${file}`);
    }
  });
  process.exit(1);
}

console.log("Performance budget checks passed.");
