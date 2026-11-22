import csv, random

random.seed(13)

def write_csv(path, items):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name"])
        for it in items:
            w.writerow([it])

def dedupe_fill(base_list, modifiers, target):
    """Postfix style ("a toaster, slightly broken") avoids a/an article bugs
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

# ---------------- THINGS ----------------
real_things = ["toaster","rubber duck","accordion","broken umbrella","calculator from 1987","snow globe","lava lamp",
"rusty typewriter","kazoo","tin of expired sardines","magic 8-ball","deck of tarot cards","cursed mirror",
"half-eaten sandwich","rubik's cube","jar of pickles","grandfather clock","karaoke machine","anchor","unicycle",
"fire extinguisher","cardboard cutout of a celebrity","smoke detector that won't stop beeping","trombone","bowling ball",
"stack of unpaid parking tickets","very old GPS","snorkel","knitting needle","disco ball","jack-in-the-box",
"traffic cone","lie detector","vacuum cleaner with a mind of its own","broken escalator","wind-up toy soldier",
"bag of invisible marbles","treasure map that leads nowhere","selfie stick","thermos full of mystery soup",
"paper airplane that never lands","abacus","lawnmower","crystal ball that only shows static","parachute with a small hole",
"ventriloquist dummy","harmonica","safe with a forgotten combination","slightly haunted typewriter","flashlight with dying batteries",
"gondola","leaf blower","garden gnome","inflatable flamingo","traffic light","fax machine","pager from the 90s",
"VHS tape with no label","floppy disk","cassette walkman","polaroid camera","telescope","microscope","compass that spins randomly",
"map of a country that no longer exists","globe with the wrong continents","chess set missing one pawn","jigsaw puzzle with a missing piece",
"ouija board","crystal chandelier","suit of armor","wax candle shaped like a cat","garden hose","pogo stick","hula hoop",
"yo-yo","kite stuck in a tree","hot air balloon basket","umbrella stand","welcome mat that says go away",
"scarecrow with a top hat","weather vane","birdcage with no bird","fishing rod with no bait","picnic basket",
"beach ball","inflatable pool toy shaped like a swan","snow shovel","ice cream truck bell","popcorn machine",
"cotton candy machine","ferris wheel seat","roller skates","skateboard missing a wheel","surfboard with a crack",
"ukulele","bagpipes","triangle instrument","tambourine","maracas","didgeridoo","bongo drums","violin missing a string",
"typewriter ribbon","quill pen","inkwell","wax seal stamp","parchment scroll","hourglass","sundial","astrolabe",
"telescope from an old observatory","weathered sea chart","ship in a bottle","message in a bottle","pirate flag",
"treasure chest with a broken lock","gold doubloon","spyglass","barrel of gunpowder (empty, don't worry)","rope ladder"]

imaginary_things = ["invisibility cloak","wand that only casts embarrassing spells","sword that hums off-key",
"ring that grants one mediocre wish","enchanted frying pan","self-folding map","talking portrait","shrinking potion",
"flying carpet with a fear of heights","bottomless bag that occasionally returns things","time-turner stuck on repeat",
"mirror that shows yesterday","book that writes itself badly","crystal that glows when lying","amulet of mild protection",
"pair of boots that only walk backwards","hat that reads minds poorly","cape that tangles constantly","orb of mild prophecy",
"key that opens the wrong doors","spellbook with coffee stains","potion of unexpected hiccups","wand missing its tip",
"shield that blocks compliments","lantern that only lights during arguments","cauldron that only makes soup",
"broomstick with a wobbly bristle","crown that itches","scepter used as a backscratcher","genie lamp with bad wifi"]

thing_modifiers = ["slightly broken","mysteriously sticky","oddly warm","glowing faintly","covered in glitter",
"missing a crucial piece","held together with tape","smelling of lavender","vibrating for no reason","inexplicably heavy",
"suspiciously clean","from a garage sale","borrowed and never returned","one of a kind","surprisingly expensive",
"older than it looks","freshly cursed","barely functional","unreasonably loud","wrapped in bubble wrap"]

def article_for(word):
    consonant_sound_exceptions = ("uni", "use", "user", "ukulele", "european", "one")
    wl = word.lower()
    if wl.startswith(consonant_sound_exceptions):
        return "a"
    return "an" if wl[0] in "aeiou" else "a"

all_things_base = [f"{article_for(t)} {t}" for t in real_things] + \
                   [f"{article_for(t)} {t}" for t in imaginary_things]
things = dedupe_fill(all_things_base, thing_modifiers, 300)
write_csv("data/things.csv", things)
print("things:", len(things), len(set(things)))
