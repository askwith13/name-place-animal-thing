// Name, Place, Animal, Thing
// Pure client-side app. No backend. User's API key never leaves their browser
// except in the direct request to the provider they chose.

let DATA = { names: [], places: [], animals: [], things: [], professions: [], sports: [] };
let currentQuestion = "";

async function loadCSV(path) {
  const res = await fetch(path, { cache: "no-store" });
  const text = await res.text();
  return text
    .split("\n")
    .map(l => l.replace(/\r$/, ""))
    .filter(l => l.length > 0)
    .slice(1) // drop header row
    .map(unquoteCSVField);
}

// Single-column CSV fields get wrapped in "..." (with "" for an embedded
// quote) by any standard CSV writer whenever the value itself contains a
// comma — e.g. our postfix-modifier entries like "a toaster, slightly broken".
// Undo that quoting here instead of leaking literal quote marks into the UI.
function unquoteCSVField(field) {
  const f = field.trim();
  if (f.startsWith('"') && f.endsWith('"')) {
    return f.slice(1, -1).replace(/""/g, '"');
  }
  return f;
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
    case "name": return pick(DATA.names);
    case "place": return pick(DATA.places);
    case "animal": return pick(DATA.animals);
    case "profession": return pick(DATA.professions);
    case "thing": return pick(DATA.things);
    case "sport": return pick(DATA.sports);
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

// ---------- UI WIRING ----------

const el = id => document.getElementById(id);

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
      el("verdictLine").textContent = `"${rating.verdict}"`;
      el("scores").innerHTML = ["funny", "absurd", "weird", "dark", "clever"].map(axis => `
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
});
