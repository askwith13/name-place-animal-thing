# Name, Place, Animal, Thing

A web game that asks you questions with no possible right answer, and lets an
AI judge your answer on funniness, absurdity, weirdness, darkness, and
cleverness — including whether you used a pun or a clever reference.

Example question: "Why did a pangolin, caffeinated bring a toaster to a chess
tournament?" There is no punchline. You have to make one up. The AI judges you
for it.

Features
--------
- Shareable result card: after each round, "Download share card" renders your
  question, answer, and five-axis scorecard as a PNG image (sized to fit
  whatever you wrote — no cropping on long answers), and "copy as text" puts
  a plain-text version on your clipboard for pasting into chat apps.
- Hall of Fame: your top 5 highest-scoring answers ever (by total of the five
  axis scores, out of 50) are saved in this browser's localStorage and shown
  via the 🏆 button. Nothing leaves your machine.
- Modifier frequency is deliberately low: each category has a large "plain"
  pool and a smaller "modified" pool (base item + a trailing adjective/adverb
  clause, e.g. "a toaster, slightly broken"). Only ~15% of individual picks
  draw from the modified pool (`MODIFIER_CHANCE` in app.js), so most questions
  read clean and only occasionally pick up a descriptor.
- "Tone down the freak" toggle: switches question generation from 3 random
  categories to 2, for calmer, simpler questions (e.g. "Why did a dentist
  go to the Moon's dark side?" instead of a 3-category combo). The choice
  persists across reloads (localStorage). All 15 possible 2-category
  combinations have their own grammatical template — see `SINGLE_TEMPLATES`
  in app.js.

Data files are two columns (`name,modified`) precisely so this weighting can
happen at runtime without touching the CSVs — turn `MODIFIER_CHANCE` up or
down any time to change how adjective-heavy questions feel.

How it works
------------
- Question generator (data/*.csv + app.js): picks a random starter word
  (What / Why / How), then randomly selects 3 of 6 categories — name, place,
  animal, profession, thing, sport — pulling one random entry from each CSV,
  and builds a grammatically sane question from a template. This part is pure
  JavaScript, completely free, no AI involved.
- Answer rating (app.js -> your chosen AI provider): only this step calls an
  AI. One short API call per submitted answer returns five 0-10 scores plus
  pun/reference detection and a one-line verdict.

The six categories, and how big each data file is:
- data/personalities.csv — 300 names (real historical/fictional figures,
  imaginary characters)
- data/places.csv — 300 places (real and imaginary)
- data/animals.csv — 300 animals (real and mythical)
- data/things.csv — 300 objects
- data/professions.csv — 300 professions (real and whimsical/fictional)
- data/sports.csv — ~40 sports (kept deliberately small — real sports plus a
  handful of absurd ones like quidditch and extreme ironing)

Every question uses exactly 3 of these 6 categories, chosen at random each
round, so the shape of the question varies a lot — sometimes a profession
does the acting, sometimes an animal, sometimes just "someone."

Architecture: zero backend
---------------------------
This is a single static site (index.html + style.css + app.js + data/*.csv).
There is no server, no database. You bring your own AI API key (BYOK):

1. You paste your key into the "Step 1" box on first load.
2. It's saved only in your browser's localStorage.
3. Every rating request goes straight from your browser to your chosen
   provider's API (OpenAI / Anthropic / Groq) — never through any server of
   ours, because none exists.

This means running this app costs YOU nothing to host, and costs the PLAYER
whatever their own API key costs them (fractions of a cent per answer with
the cheap models below). Nobody's wallet but the player's own is ever on the
hook.

Running it locally
-------------------
Browsers block `fetch()` of local CSV files when you just double-click
index.html (file:// has no CORS), so serve the folder instead:

    cd absurdity-engine
    python3 -m http.server 8080

Then open http://localhost:8080 in your browser.

Getting an API key
-------------------
- Groq (recommended — fast, has a genuinely free tier): console.groq.com
- OpenAI (gpt-4o-mini, very cheap): platform.openai.com/api-keys
- Anthropic (claude-3-5-haiku, very cheap): console.anthropic.com

Deploying it for others to use
-------------------------------
Since it's fully static, it deploys for free on:
- GitHub Pages (Settings -> Pages -> deploy from branch) — simplest option,
  and keeps it a single open-source repo people can also just clone and run
  locally.
- Netlify / Vercel (drag-and-drop the folder, or connect the repo).

Extending the question bank
-----------------------------
Edit any of data/personalities.csv, data/places.csv, data/animals.csv,
data/things.csv, data/professions.csv, data/sports.csv directly — one entry
per line, header row stays as "name". Mix real and imaginary freely, that's
the point. No code changes needed; the generator just reads whatever is in
the files.

Regenerating the data files from scratch: the scripts/gen_data_*.py scripts
(run with plain python3, no dependencies beyond stdlib) are what built the
current CSVs — they combine curated base lists with a pool of "modifier"
phrases (e.g. "caffeinated", "semi-retired", "freshly cursed") to pad each
category up to 300 unique entries, applied as a trailing comma clause (e.g.
"a toaster, slightly broken") rather than a prefix, specifically to dodge
English a/an article bugs and CSV comma-quoting edge cases — both of which
bit this project during development (see Known gotchas below). Re-run them
any time you want a fresh batch; they overwrite data/*.csv.

Known gotchas (if you extend the generator)
-----------------------------------------------
- CSV quoting: data files are two columns (`name,modified`), and any field
  containing a comma gets wrapped in double quotes by a standard CSV writer
  (including Python's csv module) — which the "base, modifier" entries
  trigger constantly. The loader in app.js (`parseCSVRow`) does real
  quote-aware field splitting; a naive `split(",")` will both misplace the
  modified-flag column and leak literal `"` marks into rendered questions.
- a/an: don't assume "starts with a vowel letter => use 'an'" — words like
  "unicorn", "unicycle", "ukulele" start with a consonant *sound* and still
  take "a". See `article_for()` in the gen_data scripts for the exception
  list used here.
- Plural nouns (e.g. "boots") can't take "a"/"an" at all — rephrase as
  "a pair of boots..." if you add one.
- Postfix modifiers only work for TYPE'd categories (name/place/animal/
  profession/thing) that are separate strings; don't prefix a modifier
  adjective onto a value that already starts with an article mid-sentence,
  or you'll get "a a caffeinated pangolin"-style doubling.

Monetization / advertising notes
-----------------------------------
This was built BYOK-first on purpose, after weighing the options:
- Hosting it yourself and paying for every player's AI call doesn't scale
  risk-free — a single viral spike could run up real charges.
- BYOK means zero cost and zero liability to the maintainer. Anyone can run
  it fully standalone with their own key.
- If you want a public, no-setup-required demo anyway, host one copy
  yourself with a hard per-visitor rate limit (e.g. 5 ratings/day via a
  cookie), using the cheapest model (Groq's free tier or gpt-4o-mini), and
  optionally an ad banner or tip-jar link on that hosted page only. Keep the
  open-source repo itself fully BYOK so the "serious" audience can play free,
  unlimited, forever.
- Good distribution channels for a tool like this: Show HN (Hacker News),
  r/InternetIsBeautiful, r/SideProject, Product Hunt. Honesty about it being
  "AI judges your sense of humor" is the whole hook — lead with that in any
  post title.

License
-------
MIT — see LICENSE.
