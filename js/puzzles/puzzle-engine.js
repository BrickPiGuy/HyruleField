(function (root, factory) {
  const api = factory();
  root.HyrulePuzzles = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  // Pure puzzle logic: validation of puzzle definitions and checking of player answers.
  // No DOM access here, so every rule can be unit tested in Node.
  //
  // Puzzle types
  //   order    - put items in the right sequence.   answer: ["id", ...]
  //   spot     - flag the flawed lines of a file.    answer: [lineIndex, ...]
  //   match    - pair each left term with a right.   answer: { left: right, ... }
  //   switches - set torches/sigils on or off.       answer: { id: true|false, ... }
  //   choice   - pick the best response.             answer: "optionId"

  const TYPES = ["order", "spot", "match", "switches", "choice"];

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function sameSet(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    const setA = new Set(a);
    return b.every((value) => setA.has(value)) && setA.size === a.length;
  }

  function validatePuzzle(puzzle) {
    const errors = [];
    const label = puzzle && puzzle.id ? puzzle.id : "(missing id)";
    const fail = (message) => errors.push(`${label}: ${message}`);

    if (!puzzle || typeof puzzle !== "object") {
      return ["puzzle must be an object"];
    }

    if (!isNonEmptyString(puzzle.id)) {
      fail("needs a string id");
    }
    if (!TYPES.includes(puzzle.type)) {
      fail(`type must be one of ${TYPES.join(", ")}`);
      return errors;
    }
    ["title", "prompt", "hint", "success"].forEach((field) => {
      if (!isNonEmptyString(puzzle[field])) {
        fail(`needs a non-empty ${field}`);
      }
    });

    if (puzzle.type === "order") {
      const items = Array.isArray(puzzle.items) ? puzzle.items : [];
      const ids = items.map((item) => item && item.id);
      if (items.length < 3) {
        fail("order needs at least 3 items");
      }
      if (new Set(ids).size !== ids.length || items.some((item) => !item || !isNonEmptyString(item.id) || !isNonEmptyString(item.text))) {
        fail("order items need unique ids and text");
      }
      if (!Array.isArray(puzzle.answer) || !sameSet(puzzle.answer, ids)) {
        fail("order answer must list every item id exactly once");
      }
    }

    if (puzzle.type === "spot") {
      const lines = Array.isArray(puzzle.lines) ? puzzle.lines : [];
      if (lines.length < 4 || lines.some((line) => typeof line !== "string")) {
        fail("spot needs at least 4 string lines");
      }
      if (!Array.isArray(puzzle.answer) || puzzle.answer.length === 0
        || puzzle.answer.some((index) => !Number.isInteger(index) || index < 0 || index >= lines.length)
        || new Set(puzzle.answer).size !== puzzle.answer.length) {
        fail("spot answer must be unique, in-range line indexes");
      }
      if (Array.isArray(puzzle.answer) && puzzle.answer.length >= lines.length) {
        fail("spot answer cannot flag every line");
      }
    }

    if (puzzle.type === "match") {
      const pairs = Array.isArray(puzzle.pairs) ? puzzle.pairs : [];
      if (pairs.length < 3 || pairs.some((pair) => !pair || !isNonEmptyString(pair.left) || !isNonEmptyString(pair.right))) {
        fail("match needs at least 3 pairs with left and right text");
      }
      const lefts = pairs.map((pair) => pair && pair.left);
      const rights = pairs.map((pair) => pair && pair.right);
      if (new Set(lefts).size !== lefts.length || new Set(rights).size !== rights.length) {
        fail("match pairs need unique left and right values");
      }
    }

    if (puzzle.type === "switches") {
      const switches = Array.isArray(puzzle.switches) ? puzzle.switches : [];
      const ids = switches.map((entry) => entry && entry.id);
      if (switches.length < 3 || new Set(ids).size !== ids.length
        || switches.some((entry) => !entry || !isNonEmptyString(entry.id) || !isNonEmptyString(entry.label))) {
        fail("switches needs at least 3 entries with unique ids and labels");
      }
      if (!puzzle.target || typeof puzzle.target !== "object"
        || ids.some((id) => typeof puzzle.target[id] !== "boolean")) {
        fail("switches target must give a true/false value for every switch");
      }
      if (!Array.isArray(puzzle.clues) || puzzle.clues.length === 0) {
        fail("switches needs clues so the room can be reasoned out");
      }
    }

    if (puzzle.type === "choice") {
      const options = Array.isArray(puzzle.options) ? puzzle.options : [];
      const ids = options.map((option) => option && option.id);
      if (options.length < 3 || new Set(ids).size !== ids.length
        || options.some((option) => !option || !isNonEmptyString(option.id) || !isNonEmptyString(option.text))) {
        fail("choice needs at least 3 options with unique ids and text");
      }
      if (!ids.includes(puzzle.answer)) {
        fail("choice answer must be one of the option ids");
      }
    }

    return errors;
  }

  function checkOrder(puzzle, answer) {
    const submitted = Array.isArray(answer) ? answer : [];
    const total = puzzle.answer.length;
    const inPlace = puzzle.answer.filter((id, index) => submitted[index] === id).length;
    const correct = submitted.length === total && inPlace === total;
    return {
      correct,
      score: inPlace,
      total,
      feedback: correct
        ? puzzle.success
        : `${inPlace} of ${total} steps are in the right place. Keep rearranging.`
    };
  }

  function checkSpot(puzzle, answer) {
    const picked = Array.isArray(answer) ? answer : [];
    const real = puzzle.answer;
    const hits = picked.filter((index) => real.includes(index)).length;
    const falseAlarms = picked.length - hits;
    const correct = sameSet(picked, real);
    let feedback = puzzle.success;
    if (!correct) {
      if (picked.length === 0) {
        feedback = "Flag at least one line you think is unsafe.";
      } else if (falseAlarms > 0) {
        feedback = `${hits} of ${real.length} flaws found, but ${falseAlarms} flagged line${falseAlarms === 1 ? " is" : "s are"} actually fine.`;
      } else {
        feedback = `${hits} of ${real.length} flaws found. Something else is still wrong.`;
      }
    }
    return { correct, score: hits, total: real.length, falseAlarms, feedback };
  }

  function checkMatch(puzzle, answer) {
    const submitted = answer && typeof answer === "object" ? answer : {};
    const total = puzzle.pairs.length;
    const score = puzzle.pairs.filter((pair) => submitted[pair.left] === pair.right).length;
    const correct = score === total;
    return {
      correct,
      score,
      total,
      feedback: correct
        ? puzzle.success
        : `${score} of ${total} pairs are right. Unpaired items count as wrong.`
    };
  }

  function checkSwitches(puzzle, answer) {
    const submitted = answer && typeof answer === "object" ? answer : {};
    const total = puzzle.switches.length;
    const score = puzzle.switches.filter((entry) => Boolean(submitted[entry.id]) === puzzle.target[entry.id]).length;
    const correct = score === total;
    return {
      correct,
      score,
      total,
      feedback: correct
        ? puzzle.success
        : `${score} of ${total} sigils glow the right way. Re-read the clues.`
    };
  }

  function checkChoice(puzzle, answer) {
    const correct = answer === puzzle.answer;
    const chosen = puzzle.options.find((option) => option.id === answer);
    let feedback = puzzle.success;
    if (!correct) {
      feedback = chosen && chosen.why ? chosen.why : "That would let Ganonix through. Think about what the pipeline is protecting.";
    }
    return { correct, score: correct ? 1 : 0, total: 1, feedback };
  }

  function checkAnswer(puzzle, answer) {
    switch (puzzle && puzzle.type) {
      case "order": return checkOrder(puzzle, answer);
      case "spot": return checkSpot(puzzle, answer);
      case "match": return checkMatch(puzzle, answer);
      case "switches": return checkSwitches(puzzle, answer);
      case "choice": return checkChoice(puzzle, answer);
      default: return { correct: false, score: 0, total: 0, feedback: "Unknown puzzle type." };
    }
  }

  // The answer a perfect player would submit. Used by tests and by the e2e helper.
  function solutionFor(puzzle) {
    switch (puzzle.type) {
      case "order": return puzzle.answer.slice();
      case "spot": return puzzle.answer.slice();
      case "match": return Object.fromEntries(puzzle.pairs.map((pair) => [pair.left, pair.right]));
      case "switches": return { ...puzzle.target };
      case "choice": return puzzle.answer;
      default: return null;
    }
  }

  // Deterministic shuffle that never returns the solved arrangement.
  function shuffleUnsolved(list, rng, solvedKey) {
    const source = Array.isArray(list) ? list.slice() : [];
    const random = typeof rng === "function" ? rng : Math.random;
    const keyOf = typeof solvedKey === "function" ? solvedKey : (arr) => JSON.stringify(arr);
    const solved = keyOf(source);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      for (let i = source.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [source[i], source[j]] = [source[j], source[i]];
      }
      if (keyOf(source) !== solved) {
        return source;
      }
    }
    // Fall back to a rotation, which is guaranteed to differ for 2+ distinct items.
    return source.length > 1 ? source.slice(1).concat(source[0]) : source;
  }

  return {
    TYPES,
    validatePuzzle,
    checkAnswer,
    solutionFor,
    shuffleUnsolved
  };
});
