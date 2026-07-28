const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const missionsDir = path.join(root, "data/missions");

const requiredTopLevelFields = ["id", "title", "objective", "reward"];
const missionFiles = fs.readdirSync(missionsDir).filter((file) => file.endsWith(".json"));
const missions = new Map();
const references = new Map();

function fail(message) {
  throw new Error(message);
}

function readMission(fileName) {
  const filePath = path.join(missionsDir, fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${fileName} is not valid JSON: ${error.message}`);
  }
}

function ensureString(value, label, fileName) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${fileName} must define a non-empty string ${label}`);
  }
}

function ensureStringArray(value, label, fileName) {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    fail(`${fileName} must define a non-empty string array for ${label}`);
  }
}

function validateReward(reward, fileName) {
  if (!reward || typeof reward !== "object" || Array.isArray(reward)) {
    fail(`${fileName} must define a reward object`);
  }

  const hasTemple = typeof reward.temple === "string" && reward.temple.trim();
  const hasVictory = reward.victory === true;
  if (!hasTemple && !hasVictory) {
    fail(`${fileName} reward must define either temple or victory`);
  }
}

function getDependencyList(mission) {
  const direct = [];
  if (Array.isArray(mission.requires)) {
    direct.push(...mission.requires);
  }
  if (Array.isArray(mission.dependsOn)) {
    direct.push(...mission.dependsOn);
  }
  if (Array.isArray(mission.prerequisites)) {
    direct.push(...mission.prerequisites);
  }
  return direct.filter((entry) => typeof entry === "string" && entry.trim());
}

for (const fileName of missionFiles) {
  const mission = readMission(fileName);

  for (const field of requiredTopLevelFields) {
    if (!(field in mission)) {
      fail(`${fileName} is missing required field: ${field}`);
    }
  }

  ensureString(mission.id, "id", fileName);
  ensureString(mission.title, "title", fileName);
  ensureString(mission.objective, "objective", fileName);
  validateReward(mission.reward, fileName);

  if (missions.has(mission.id)) {
    fail(`Duplicate mission id found: ${mission.id}`);
  }

  missions.set(mission.id, { fileName, mission });
  references.set(mission.id, getDependencyList(mission));

  if (mission.ciSteps) {
    ensureStringArray(mission.ciSteps, "ciSteps", fileName);
  }
  if (mission.securityCards) {
    if (!Array.isArray(mission.securityCards) || mission.securityCards.length === 0) {
      fail(`${fileName} must define securityCards when present`);
    }
    mission.securityCards.forEach((card, index) => {
      const label = `${fileName}.securityCards[${index}]`;
      if (!card || typeof card !== "object" || Array.isArray(card)) {
        fail(`${label} must be an object`);
      }
      ensureString(card.id, `${label}.id`, fileName);
      ensureString(card.title, `${label}.title`, fileName);
      ensureString(card.description, `${label}.description`, fileName);
    });
  }
  if (mission.hiddenWorkflow) {
    if (!mission.hiddenWorkflow || typeof mission.hiddenWorkflow !== "object" || Array.isArray(mission.hiddenWorkflow)) {
      fail(`${fileName} hiddenWorkflow must be an object`);
    }
    ensureStringArray(mission.hiddenWorkflow.requiredWords, "hiddenWorkflow.requiredWords", fileName);
    ensureStringArray(mission.hiddenWorkflow.anyPhrases, "hiddenWorkflow.anyPhrases", fileName);
  }
  if (mission.requiredStateKeys) {
    ensureStringArray(mission.requiredStateKeys, "requiredStateKeys", fileName);
  }
  if (mission.prereqsDisplay) {
    ensureStringArray(mission.prereqsDisplay, "prereqsDisplay", fileName);
  }
  if (mission.checklist) {
    ensureStringArray(mission.checklist, "checklist", fileName);
  }
  if (mission.pipelineStages) {
    ensureStringArray(mission.pipelineStages, "pipelineStages", fileName);
  }
  if (mission.messages) {
    if (!mission.messages || typeof mission.messages !== "object" || Array.isArray(mission.messages)) {
      fail(`${fileName} messages must be an object`);
    }
    if (mission.messages.success !== undefined) {
      ensureString(mission.messages.success, "messages.success", fileName);
    }
    if (mission.messages.failure !== undefined) {
      ensureString(mission.messages.failure, "messages.failure", fileName);
    }
  }
}

function visit(nodeId, visiting, visited) {
  if (visiting.has(nodeId)) {
    fail(`Mission dependency loop detected at: ${nodeId}`);
  }
  if (visited.has(nodeId)) {
    return;
  }
  visiting.add(nodeId);
  for (const dependency of references.get(nodeId) || []) {
    if (!missions.has(dependency)) {
      fail(`Mission ${nodeId} references missing dependency: ${dependency}`);
    }
    visit(dependency, visiting, visited);
  }
  visiting.delete(nodeId);
  visited.add(nodeId);
}

const visited = new Set();
for (const missionId of missions.keys()) {
  visit(missionId, new Set(), visited);
}

console.log(`Validated ${missions.size} mission files.`);
