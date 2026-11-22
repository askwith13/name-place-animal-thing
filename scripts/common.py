import csv, random

def write_csv(path, items):
    """items: list of (name, is_modified) tuples."""
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name", "modified"])
        for name, is_modified in items:
            w.writerow([name, "1" if is_modified else "0"])

def write_csv_plain(path, items):
    """For categories with no modifiers at all (e.g. sports)."""
    write_csv(path, [(it, False) for it in items])

def dedupe_fill(base_list, modifiers, target):
    """Start from base_list (unmodified, tagged is_modified=False), then pad
    with base+modifier combos (postfix style: "a toaster, slightly broken",
    tagged is_modified=True) until we hit target unique strings. Postfix
    avoids a/an article bugs and works for both single adjectives and
    verb-phrase modifiers. Returns list of (name, is_modified) tuples."""
    seen = []
    seen_set = set()
    def add(s, modified):
        if s not in seen_set:
            seen_set.add(s)
            seen.append((s, modified))
    for b in base_list:
        add(b, False)
    combos = [(m, b) for m in modifiers for b in base_list]
    random.shuffle(combos)
    i = 0
    while len(seen) < target and i < len(combos):
        m, b = combos[i]
        i += 1
        add(f"{b}, {m}", True)
    return seen[:target]

def article_for(word):
    """Handles the 'u' sound exception: unicorn/unicycle/ukulele etc. start
    with a consonant SOUND despite the vowel letter, so they still take 'a'."""
    consonant_sound_exceptions = ("uni", "use", "user", "ukulele", "european", "one")
    wl = word.lower()
    if wl.startswith(consonant_sound_exceptions):
        return "a"
    return "an" if wl[0] in "aeiou" else "a"
