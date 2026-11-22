import csv, random

random.seed(21)

def write_csv(path, items):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name"])
        for it in items:
            w.writerow([it])

def dedupe_fill(base_list, modifiers, target):
    """Postfix style ("a dentist, semi-retired") avoids a/an article bugs
    and works for both single adjectives and verb-phrase modifiers."""
    seen, seen_set = [], set()
    def add(s):
        if s not in seen_set:
            seen_set.add(s); seen.append(s)
    for b in base_list:
        add(b)
    combos = [(m, b) for m in modifiers for b in base_list]
    random.shuffle(combos)
    i = 0
    while len(seen) < target and i < len(combos):
        m, b = combos[i]; i += 1
        add(f"{b}, {m}")
    return seen[:target]

# ---------------- PERSONALITIES / NAMES ----------------
real_people = ["Albert Einstein","Napoleon Bonaparte","Cleopatra","Marie Curie","Mahatma Gandhi","Julius Caesar",
"Leonardo da Vinci","Isaac Newton","Charles Darwin","Abraham Lincoln","Queen Elizabeth I","Genghis Khan",
"Mozart","Beethoven","Vincent van Gogh","Thomas Edison","Nikola Tesla","Florence Nightingale","Confucius",
"Sun Tzu","Rasputin","Elvis Presley","Shakespeare","the Dalai Lama","King Arthur","Joan of Arc","Winston Churchill",
"Alexander the Great","Hippocrates","Aristotle","Socrates","Plato","Galileo Galilei","Christopher Columbus",
"Marco Polo","Benjamin Franklin","Nelson Mandela","Martin Luther King Jr.","Frida Kahlo","Pablo Picasso",
"Walt Disney","Charlie Chaplin","Houdini","P.T. Barnum","Amelia Earhart","Jane Austen","Mark Twain",
"Oscar Wilde","Edgar Allan Poe","Agatha Christie","Hans Christian Andersen","the Brothers Grimm",
"Leonardo Fibonacci","Pythagoras","Archimedes","Hannibal Barca","Attila the Hun","Vlad the Impaler",
"Catherine the Great","Ivan the Terrible","Henry VIII","Marie Antoinette","Louis XIV","Queen Victoria",
"Theodore Roosevelt","Benjamin Button, somehow older than expected","a confused Viking chieftain",
"a retired gladiator","a medieval court jester","a Victorian chimney sweep","a 1920s flapper",
"a wild west outlaw","a Byzantine emperor","a wandering samurai","a Shaolin monk","a Mongol horse archer",
"an Egyptian pharaoh's advisor","a Greek oracle","a Roman centurion","a Renaissance painter's apprentice",
"a lighthouse keeper from 1890","a traveling snake oil salesman","a door-to-door vacuum salesman from 1962",
"a substitute teacher who used to be a pirate","a stern Victorian governess","a disgruntled mall Santa",
"a used car salesman named Gary","a sleep-deprived air traffic controller","a paranoid conspiracy theorist",
"a philosophical goldfish salesman","an overconfident karaoke host","a time-traveling grandmother"]

fictional_people = ["Sherlock Holmes","Darth Vader","Gandalf","Dracula","Batman","Dracula's accountant",
"Captain Jack Sparrow","Moriarty","Yoda","Hercules","the Grim Reaper on his day off","a rookie wizard",
"the Tooth Fairy","Zeus having a midlife crisis","a ghost who still pays rent","Frankenstein's monster",
"the Mona Lisa, somehow alive","the Statue of Liberty, stretching her legs","a gremlin with a union card",
"a minotaur who forgot his gym bag","a vampire afraid of dentists","a werewolf with a gym membership",
"a wizard who failed his licensing exam","a knight who lost his sword in the mail","a dragon with stage fright",
"a superhero between jobs","a sidekick who wants a raise","a villain on his lunch break","a fairy godmother on strike",
"a time traveler stuck in the wrong decade","an alien pretending to be a tourist","a robot learning sarcasm",
"a mermaid who moved inland","a genie who's run out of wishes to grant","a leprechaun who lost his gold in the stock market",
"a sentient scarecrow with opinions","a talking parrot with a law degree","a ghost pirate captain",
"a goblin accountant","an elf who hates Christmas","a troll who runs a bridge toll booth","a sphinx who forgot her riddles",
"a centaur who prefers taxis","a phoenix mid-identity-crisis","a yeti who moved to the tropics",
"Sherlock Holmes's less competent cousin","Dr. Frankenstein's intern","the Loch Ness Monster's publicist",
"Bigfoot's personal trainer","a superhero's disappointed mother","a villain's therapist","a dragon's dentist"]

name_modifiers = ["time-traveling","undercover","disgraced","semi-retired","accidental","reluctant","aspiring",
"washed-up","award-winning","mildly cursed","unlicensed","chronically late","surprisingly elegant","notoriously clumsy",
"secretly famous","jet-lagged","insomniac","left-handed","self-taught","moonlighting as a magician","freshly knighted",
"overqualified","underqualified","conflict-averse","caffeinated","philosophical","sleep-deprived"]

all_names_base = real_people + fictional_people
names = dedupe_fill(all_names_base, name_modifiers, 300)
write_csv("data/personalities.csv", names)
print("personalities:", len(names), len(set(names)))

# ---------------- PROFESSIONS ----------------
real_professions = ["dentist","blacksmith","astronaut","lifeguard","accountant","barista","lumberjack","zookeeper",
"florist","locksmith","cartographer","taxidermist","sommelier","falconer","beekeeper","librarian","plumber",
"electrician","chimney sweep","lighthouse keeper","translator","bodyguard","private investigator","tattoo artist",
"puppeteer","ventriloquist","mime","magician","clown","stunt double","voice actor","radio DJ","weather forecaster",
"air traffic controller","submarine engineer","volcanologist","marine biologist","entomologist","paleontologist",
"archivist","museum curator","auctioneer","notary public","court stenographer","bailiff","park ranger",
"ski instructor","scuba instructor","sommelier's apprentice","pastry chef","butcher","baker","candlestick maker",
"watchmaker","glassblower","blacksmith's apprentice","shoemaker","tailor","seamstress","upholsterer","embalmer",
"funeral director","wedding planner","event caterer","food critic","sommelier for tea","barista competition judge",
"professional cuddler","dog walker","pet psychic","horse whisperer","snake charmer","bee whisperer","mushroom forager",
"truffle hunter","perfumer","chocolatier","ice sculptor","sandcastle architect","crossword puzzle writer",
"riddle master","fortune teller","tarot reader","astrologer","palm reader","hypnotist","sleep coach",
"professional napper","competitive eater","food taster for royalty","wine taster","cheese grader","tea ceremony master",
"origami instructor","calligrapher","typewriter repair technician","piano tuner","bell ringer","organ builder",
"church bell maintenance worker","lighthouse automation technician","buoy inspector","iceberg spotter",
"shipwreck salvager","treasure hunter","antique restorer","clock repair specialist","jigsaw puzzle designer",
"escape room designer","theme park ride operator","roller coaster safety inspector","fireworks technician",
"stunt pyrotechnician","special effects makeup artist","costume designer","set builder","prop master",
"foley artist","subtitle translator","dubbing voice director","video game tester","toy inventor",
"board game designer","balloon artist","face painter","birthday party clown","children's book illustrator"]

imaginary_professions = ["dragon exterminator","professional ghost negotiator","time-traveling tax auditor",
"interdimensional customs officer","unicorn groomer","wizard licensing inspector","potion quality control officer",
"dungeon safety inspector","vampire dental hygienist","werewolf parole officer","zombie outreach coordinator",
"goblin union representative","fairy godmother temp worker","dragon egg incubation specialist","troll bridge toll collector",
"spellbook editor","cursed object disposal technician","alien tourism guide","portal maintenance engineer",
"kraken relocation specialist","phoenix fire insurance adjuster","yeti habitat consultant","basilisk eye contact trainer",
"griffin veterinarian","sphinx riddle fact-checker","minotaur maze architect","centaur chiropodist",
"mermaid speech therapist","genie wish-contract lawyer","elf overtime negotiator","dwarf mine safety officer",
"troll bridge toll auditor","banshee noise-complaint mediator"]

profession_modifiers = ["semi-retired","freelance","unlicensed","award-winning","notoriously unreliable",
"overqualified","underqualified","moonlighting","self-taught","caffeinated","chronically late","disgraced",
"secretly famous","surprisingly wealthy","part-time","accidental","aspiring","washed-up","conflict-averse"]

def article_for(word):
    consonant_sound_exceptions = ("uni", "use", "user", "ukulele", "european", "one")
    wl = word.lower()
    if wl.startswith(consonant_sound_exceptions):
        return "a"
    return "an" if wl[0] in "aeiou" else "a"

all_prof_base = [f"{article_for(p)} {p}" for p in real_professions] + \
                [f"{article_for(p)} {p}" for p in imaginary_professions]
professions = dedupe_fill(all_prof_base, profession_modifiers, 300)
write_csv("data/professions.csv", professions)
print("professions:", len(professions), len(set(professions)))

# ---------------- SPORTS (deliberately a small list) ----------------
sports = ["soccer","cricket","chess","curling","sumo wrestling","fencing","archery","synchronized swimming",
"rugby","badminton","table tennis","bowling","darts","snooker","polo","lacrosse","water polo","judo",
"gymnastics","figure skating","ice hockey","field hockey","volleyball","handball","squash","triathlon",
"marathon running","weightlifting","wrestling","boxing","rowing","sailing","surfing","skateboarding","breakdancing",
"pickleball","quidditch","extreme ironing","chess boxing","underwater hockey","wife-carrying","cheese rolling",
"competitive dog grooming"]
write_csv("data/sports.csv", sports)
print("sports:", len(sports), len(set(sports)))
