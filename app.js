// Name, Place, Animal, Thing
// Pure client-side app. No backend. User's API key never leaves their browser
// except in the direct request to the provider they chose.

// Each category is split into "plain" entries (just the base item) and
// "modified" entries (base item + a trailing adjective/adverb clause, e.g.
// "a toaster, slightly broken"). MODIFIER_CHANCE controls how often a
// modified entry gets picked over a plain one — kept low so the generated
// questions don't drown in adjectives.
const MODIFIER_CHANCE = 0.15;

let DATA = { names: [], places: [], animals: [], things: [], professions: [], sports: [] };
let currentQuestion = "";

async function loadCSV(path) {
  const res = await fetch(path, { cache: "no-store" });
  const text = await res.text();
  const rows = text
    .split("\n")
    .map(l => l.replace(/\r$/, ""))
    .filter(l => l.length > 0)
    .slice(1); // drop header row
  const plain = [];
  const modified = [];
  rows.forEach(row => {
    const [nameField, modifiedField] = parseCSVRow(row);
    (modifiedField === "1" ? modified : plain).push(nameField);
  });
  return { plain, modified };
}

// Splits a CSV row into fields, respecting double-quoted fields that may
// contain the delimiter (a standard CSV writer quotes any field containing
// a comma — our "base, modifier" entries trigger this on the first column).
function parseCSVRow(row) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (inQuotes) {
      if (c === '"' && row[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { fields.push(cur); cur = ""; }
      else { cur += c; }
    }
  }
  fields.push(cur);
  return fields.map(f => f.trim());
}

async function loadAllData() {
  const [names, places, animals, things, professions, sports] = await Promise.all([
    loadCSV("data/personalities.csv"),
    loadCSV("data/places.csv"),
    loadCSV("data/animals.csv"),
    loadCSV("data/things.csv"),
    loadCSV("data/professions.csv"),
    loadCSV("data/sports.csv")
  ]);
  DATA = { names, places, animals, things, professions, sports };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Picks mostly from the plain pool; only occasionally reaches into the
// modified pool (per MODIFIER_CHANCE), and only if that pool has entries.
function weightedPick({ plain, modified }) {
  if (modified.length > 0 && Math.random() < MODIFIER_CHANCE) {
    return pick(modified);
  }
  return pick(plain.length > 0 ? plain : modified);
}

// Lowercases a leading "A"/"An"/"The" so items read naturally mid-sentence
// (data files capitalize these for readability as standalone CSV rows).
function lowerLead(s) {
  return s.replace(/^(A|An|The)\b/, w => w.toLowerCase());
}

// There are 6 possible categories; every question uses exactly 3 of them.
const ALL_CATEGORIES = ["name", "place", "animal", "profession", "thing", "sport"];
// Categories that can plausibly be the "doer" of the action, in priority order.
const SUBJECT_PRIORITY = ["name", "animal", "profession"];

function pickThreeCategories() {
  const shuffled = [...ALL_CATEGORIES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 3);
}

function elementFor(cat) {
  switch (cat) {
    case "name": return weightedPick(DATA.names);
    case "place": return weightedPick(DATA.places);
    case "animal": return weightedPick(DATA.animals);
    case "profession": return weightedPick(DATA.professions);
    case "thing": return weightedPick(DATA.things);
    case "sport": return weightedPick(DATA.sports);
  }
}

// Two-category modifier phrases, keyed by the pair sorted alphabetically.
// "name" never appears here because it always wins the subject slot when present
// (see buildQuestion), so it can never end up as a non-subject modifier.
const PAIR_TEMPLATES = {
  "animal+place":      e => `bring ${e.animal} to ${e.place}`,
  "animal+profession": e => `convince ${e.profession} to adopt ${e.animal}`,
  "animal+sport":      e => `challenge ${e.animal} to a game of ${e.sport}`,
  "animal+thing":      e => `give ${e.thing} to ${e.animal}`,
  "place+profession":  e => `hire ${e.profession} to work at ${e.place}`,
  "place+sport":       e => `organize a game of ${e.sport} at ${e.place}`,
  "place+thing":       e => `bring ${e.thing} to ${e.place}`,
  "profession+sport":  e => `challenge ${e.profession} to a game of ${e.sport}`,
  "profession+thing":  e => `give ${e.thing} to ${e.profession}`,
  "sport+thing":       e => `use ${e.thing} to win a game of ${e.sport}`,
};

// Build a grammatically sane question from whichever 3 categories were chosen,
// for whichever starter word (what/why/how) was chosen.
function buildQuestion() {
  const starter = pick(["What", "Why", "How"]);
  const cats = pickThreeCategories();
  const parts = {};
  cats.forEach(c => parts[c] = lowerLead(elementFor(c)));

  const subjectCat = SUBJECT_PRIORITY.find(c => cats.includes(c)) || null;
  const subject = subjectCat ? parts[subjectCat] : "someone";
  const remaining = cats.filter(c => c !== subjectCat);

  let verbPhrase;
  if (remaining.length === 3) {
    // Only possible when no subject-type category was picked: place+thing+sport exactly.
    verbPhrase = `bring ${parts.thing} to ${parts.place} for a game of ${parts.sport}`;
  } else {
    const key = [...remaining].sort().join("+");
    verbPhrase = PAIR_TEMPLATES[key] ? PAIR_TEMPLATES[key](parts) : "do something truly unexplainable";
  }

  if (starter === "What") {
    return `What made ${subject} ${verbPhrase}?`;
  } else if (starter === "Why") {
    return `Why did ${subject} ${verbPhrase}?`;
  } else {
    return `How did ${subject} manage to ${verbPhrase}?`;
  }
}

// ---------- AI CALL ----------

const RATING_INSTRUCTIONS = `You are a sharp, funny judge for a game called "Name, Place, Animal, Thing".
The player was given an absurd question with no real answer, and wrote their own made-up answer.
Rate their answer on these five axes, each 0-10:
- funny: how genuinely funny/amusing it is
- absurd: how delightfully nonsensical/surreal it is
- weird: how strange/unsettling-in-a-good-way it is
- dark: how dark-humored/edgy it is (0 if wholesome, higher if morbid/dark comedy)
- clever: how clever/witty the construction is

Also detect:
- pun_used: true/false - did they use a pun or wordplay?
- reference_used: true/false - did they make a clever cultural/literary/historical reference?

Then write:
- verdict: a punchy one-line verdict (max 15 words), in the voice of a witty game show judge
- feedback: 1-2 sentences of specific, entertaining feedback on what made it work or fall flat

Respond with ONLY valid JSON, no markdown, no code fences, in exactly this shape:
{"funny":0,"absurd":0,"weird":0,"dark":0,"clever":0,"pun_used":false,"reference_used":false,"verdict":"","feedback":""}`;

function buildUserPrompt(question, answer) {
  return `Question: ${question}\nPlayer's answer: ${answer}`;
}

function extractJSON(text) {
  // Strip code fences if the model added them anyway, then find the {...} block.
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callOpenAICompatible(baseUrl, model, apiKey, question, answer) {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: RATING_INSTRUCTIONS },
        { role: "user", content: buildUserPrompt(question, answer) }
      ],
      temperature: 0.7
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices[0].message.content;
  return extractJSON(text);
}

async function callAnthropic(apiKey, question, answer) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 400,
      system: RATING_INSTRUCTIONS,
      messages: [{ role: "user", content: buildUserPrompt(question, answer) }]
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.content[0].text;
  return extractJSON(text);
}

async function rateAnswer(provider, apiKey, question, answer) {
  if (provider === "openai") {
    return callOpenAICompatible("https://api.openai.com/v1/chat/completions", "gpt-4o-mini", apiKey, question, answer);
  } else if (provider === "groq") {
    return callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", "llama-3.1-8b-instant", apiKey, question, answer);
  } else if (provider === "anthropic") {
    return callAnthropic(apiKey, question, answer);
  }
  throw new Error("Unknown provider");
}

// ---------- HALL OF FAME (localStorage, top 5 by total score) ----------

const HOF_KEY = "npat_hall_of_fame";
const SCORE_AXES = ["funny", "absurd", "weird", "dark", "clever"];

function totalScore(rating) {
  return SCORE_AXES.reduce((sum, axis) => sum + (Number(rating[axis]) || 0), 0);
}

function getHallOfFame() {
  try {
    return JSON.parse(localStorage.getItem(HOF_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveHallOfFame(list) {
  localStorage.setItem(HOF_KEY, JSON.stringify(list));
}

// Adds this round to the Hall of Fame if it scores in the current top 5.
// Returns true if it made the cut (so the UI can say so).
function maybeAddToHallOfFame(question, answer, rating) {
  const entry = {
    question, answer,
    verdict: rating.verdict,
    scores: Object.fromEntries(SCORE_AXES.map(a => [a, rating[a]])),
    total: totalScore(rating),
    timestamp: Date.now()
  };
  const list = getHallOfFame();
  list.push(entry);
  list.sort((a, b) => b.total - a.total);
  const trimmed = list.slice(0, 5);
  saveHallOfFame(trimmed);
  return trimmed.some(e => e.timestamp === entry.timestamp);
}

function renderHallOfFame() {
  const list = getHallOfFame();
  const container = el("hofList");
  if (list.length === 0) {
    container.innerHTML = `<p class="hofEmpty">No entries yet — go be absurd.</p>`;
    return;
  }
  container.innerHTML = list.map((e, i) => `
    <div class="hofEntry">
      <div><span class="hofRank">#${i + 1} · ${e.total}/50</span></div>
      <div class="hofQuestion">${escapeHTML(e.question)}</div>
      <div class="hofAnswer">"${escapeHTML(e.answer)}"</div>
      <div class="hofMeta">${escapeHTML(e.verdict || "")}</div>
    </div>`).join("");
}

function escapeHTML(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

// ---------- SHARE CARD (canvas image + plain-text fallback) ----------

function buildShareText(question, answer, rating) {
  const scoreLine = SCORE_AXES.map(a => `${a}: ${rating[a]}/10`).join("  ·  ");
  return `Name, Place, Animal, Thing\n\nQ: ${question}\nA: ${answer}\n\n${scoreLine}\n"${rating.verdict}"\n\nTry it: https://github.com/askwith13/name-place-animal-thing`;
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, draw = true) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      if (draw) ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) { if (draw) ctx.fillText(line, x, y); y += lineHeight; }
  return y;
}

// Share cards vary a lot in height depending on answer length, so this does
// a dry-run layout pass (no drawing) to size the canvas before the real
// draw pass — avoids either cutting off long answers or leaving a mostly
// empty card for short ones.
function drawShareCard(question, answer, rating) {
  const canvas = el("shareCanvas");
  const W = 900;
  const measureCtx = canvas.getContext("2d");

  measureCtx.font = "20px 'Segoe UI', sans-serif";
  let y = wrapCanvasText(measureCtx, question, 70, 110, W - 110, 28, false);
  y += 20;
  measureCtx.font = "italic 20px 'Segoe UI', sans-serif";
  y = wrapCanvasText(measureCtx, `"${answer}"`, 70, y, W - 110, 28, false);
  y += 30 + 120; // score box row + gap
  measureCtx.font = "italic 18px 'Segoe UI', sans-serif";
  y = wrapCanvasText(measureCtx, `"${rating.verdict}"`, 40, y, W - 80, 24, false);
  const H = Math.max(420, Math.round(y) + 60);

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#23233a");
  bgGrad.addColorStop(1, "#12121c");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffd166";
  ctx.font = "bold 34px 'Segoe UI', sans-serif";
  ctx.fillText("🤪 Name, Place, Animal, Thing", 40, 60);

  ctx.fillStyle = "#9a9ab0";
  ctx.font = "16px 'Segoe UI', sans-serif";
  ctx.fillText("Q:", 40, 110);
  ctx.fillStyle = "#f0f0f5";
  ctx.font = "20px 'Segoe UI', sans-serif";
  let dy = wrapCanvasText(ctx, question, 70, 110, W - 110, 28);

  dy += 20;
  ctx.fillStyle = "#9a9ab0";
  ctx.font = "16px 'Segoe UI', sans-serif";
  ctx.fillText("A:", 40, dy);
  ctx.fillStyle = "#ff6b6b";
  ctx.font = "italic 20px 'Segoe UI', sans-serif";
  dy = wrapCanvasText(ctx, `"${answer}"`, 70, dy, W - 110, 28);

  dy += 30;
  const boxW = (W - 80 - 4 * 16) / 5;
  SCORE_AXES.forEach((axis, i) => {
    const bx = 40 + i * (boxW + 16);
    ctx.fillStyle = "#1f1f2e";
    ctx.fillRect(bx, dy, boxW, 80);
    ctx.fillStyle = "#9a9ab0";
    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.fillText(axis, bx + 10, dy + 24);
    ctx.fillStyle = "#ffd166";
    ctx.font = "bold 26px 'Segoe UI', sans-serif";
    ctx.fillText(`${rating[axis]}/10`, bx + 10, dy + 58);
  });

  dy += 120;
  ctx.fillStyle = "#f0f0f5";
  ctx.font = "italic 18px 'Segoe UI', sans-serif";
  wrapCanvasText(ctx, `"${rating.verdict}"`, 40, dy, W - 80, 24);

  ctx.fillStyle = "#9a9ab0";
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.fillText("Try it: github.com/askwith13/name-place-animal-thing", 40, H - 24);

  return canvas;
}

function downloadCanvasAsPNG(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ---------- UI WIRING ----------

const el = id => document.getElementById(id);
let currentAnswer = "";
let currentRating = null;

function showSetup() {
  el("setup").classList.remove("hidden");
  el("game").classList.add("hidden");
}

function showGame(provider) {
  el("setup").classList.add("hidden");
  el("game").classList.remove("hidden");
  el("providerNote").textContent = `Connected via ${provider}`;
}

function resetRoundUI() {
  el("answerBox").classList.add("hidden");
  el("result").classList.add("hidden");
  el("errorBox").classList.add("hidden");
  el("answer").value = "";
  el("hofNote").textContent = "";
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadAllData();

  const savedProvider = localStorage.getItem("ae_provider");
  const savedKey = localStorage.getItem("ae_key");
  if (savedProvider && savedKey) {
    el("provider").value = savedProvider;
    showGame(savedProvider);
  }

  el("saveKey").addEventListener("click", () => {
    const provider = el("provider").value;
    const key = el("apiKey").value.trim();
    if (!key) {
      el("savedNote").textContent = "Please paste an API key first.";
      return;
    }
    localStorage.setItem("ae_provider", provider);
    localStorage.setItem("ae_key", key);
    showGame(provider);
  });

  el("changeKey").addEventListener("click", () => {
    showSetup();
  });

  el("newQuestion").addEventListener("click", () => {
    currentQuestion = buildQuestion();
    el("question").textContent = currentQuestion;
    el("answerBox").classList.remove("hidden");
    resetRoundUI();
    el("answerBox").classList.remove("hidden");
  });

  el("submitAnswer").addEventListener("click", async () => {
    const answer = el("answer").value.trim();
    if (!answer) return;
    const provider = localStorage.getItem("ae_provider");
    const apiKey = localStorage.getItem("ae_key");

    el("errorBox").classList.add("hidden");
    el("result").classList.add("hidden");
    el("loading").classList.remove("hidden");
    el("submitAnswer").disabled = true;

    try {
      const rating = await rateAnswer(provider, apiKey, currentQuestion, answer);
      currentAnswer = answer;
      currentRating = rating;
      el("verdictLine").textContent = `"${rating.verdict}"`;
      el("scores").innerHTML = SCORE_AXES.map(axis => `
        <div class="score-item">
          <div class="label">${axis}</div>
          <div class="value">${rating[axis]}/10</div>
        </div>`).join("");
      const notes = [];
      if (rating.pun_used) notes.push("🪄 Pun detected");
      if (rating.reference_used) notes.push("📚 Clever reference detected");
      el("punNote").textContent = notes.join("  •  ");
      el("feedback").textContent = rating.feedback;
      el("result").classList.remove("hidden");

      const madeHallOfFame = maybeAddToHallOfFame(currentQuestion, answer, rating);
      el("hofNote").textContent = madeHallOfFame ? "🏆 New Hall of Fame entry!" : "";
    } catch (e) {
      el("errorBox").textContent = `Something went wrong: ${e.message}`;
      el("errorBox").classList.remove("hidden");
    } finally {
      el("loading").classList.add("hidden");
      el("submitAnswer").disabled = false;
    }
  });

  el("playAgain").addEventListener("click", () => {
    currentQuestion = buildQuestion();
    el("question").textContent = currentQuestion;
    resetRoundUI();
    el("answerBox").classList.remove("hidden");
  });

  el("downloadCard").addEventListener("click", () => {
    if (!currentRating) return;
    const canvas = drawShareCard(currentQuestion, currentAnswer, currentRating);
    downloadCanvasAsPNG(canvas, "name-place-animal-thing.png");
  });

  el("copyText").addEventListener("click", async () => {
    if (!currentRating) return;
    const text = buildShareText(currentQuestion, currentAnswer, currentRating);
    try {
      await navigator.clipboard.writeText(text);
      el("hofNote").textContent = "Copied to clipboard.";
    } catch (e) {
      el("hofNote").textContent = "Couldn't copy automatically — select and copy manually.";
    }
  });

  el("openHallOfFame").addEventListener("click", () => {
    renderHallOfFame();
    el("hofModal").classList.remove("hidden");
  });

  el("closeHallOfFame").addEventListener("click", () => {
    el("hofModal").classList.add("hidden");
  });
});
