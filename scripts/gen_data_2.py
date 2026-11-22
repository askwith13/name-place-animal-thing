import csv, random

random.seed(7)

def write_csv(path, items):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name"])
        for it in items:
            w.writerow([it])

def dedupe_fill(base_list, modifiers, target):
    """Postfix style ("the Dead Sea, on fire") avoids a/an article bugs
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

# ---------------- PLACES ----------------
real_places = ["the Bermuda Triangle","Mount Everest's summit","the International Space Station","the Great Wall of China",
"Atlantis","the Moon's dark side","the Sahara Desert","the Vatican's basement archives","Loch Ness","the Arctic tundra",
"the Amazon rainforest canopy","the Mariana Trench","Easter Island","Stonehenge at dawn","the Great Barrier Reef",
"the Eiffel Tower's elevator shaft","Area 51's parking lot","Chernobyl's exclusion zone","the Dead Sea","Niagara Falls",
"the Grand Canyon's rim","Timbuktu","the Galapagos Islands","the Serengeti at sunset","Petra's hidden temple",
"the Taj Mahal's garden","Machu Picchu","the Pyramids of Giza","the Great Rift Valley","Antarctica's research station",
"the Trans-Siberian Railway","a crowded subway station at rush hour","the DMV","a dentist's waiting room","a 24-hour laundromat",
"a 1950s diner","a karaoke bar in Tokyo","a traffic jam on a bridge","a crowded elevator","a retirement home bingo hall",
"a wedding reception gone wrong","a used bookstore that smells like dust","a public library during a power outage",
"a prison cafeteria","a quiet monastery","a crowded airport security line","a sinking cruise ship's buffet",
"the backstage of a circus","a submarine stuck at the bottom of the ocean","a roadside motel in the desert",
"a Victorian opera house","Hogwarts' broom cupboard","Narnia's lamppost clearing","Middle-earth's Shire",
"Jurassic Park's gift shop","the Death Star's cafeteria","Gotham City's sewers","the Starship Enterprise's bridge",
"the Shire's pub","Mordor's tourist information center","Wonderland's tea party table","Oz's yellow brick road",
"the Batcave's break room","Asgard's banquet hall","the Millennium Falcon's cockpit","Hobbiton's market square",
"the Enterprise's holodeck","a parallel universe's grocery store","the surface of Mars","a wind farm at midnight",
"a volcano's crater","a medieval castle's dungeon","a Renaissance Italian piazza","a pirate ship mid-mutiny",
"the inside of a washing machine","a tiny rowboat in a storm","the inside of a giant whale","a roller coaster stuck at the top",
"a haunted lighthouse","a sleepy village in the Alps","a tiny island with one coconut tree","a luxury casino in Monte Carlo",
"a crowded night market in Bangkok","a ski lodge during a blizzard","a drive-in movie theater","an abandoned amusement park",
"a rooftop garden in Singapore","a monastery on a cliffside in Bhutan","a floating market in Vietnam","a desert oasis",
"a glacier in Iceland","a rice terrace in the Philippines","a tulip field in the Netherlands","a cherry blossom park in Kyoto",
"a spice market in Marrakech","a gondola in Venice","a cable car in San Francisco","a night train through the Alps",
"a lighthouse keeper's cottage","a houseboat on a river","a treehouse resort","an ice hotel in Lapland"]

imaginary_places = ["Atlantis's royal court","the Upside Down","Wakanda's throne room","Rivendell's library",
"the Death Star's trash compactor","Platform 9¾","the Chocolate Factory's inventing room","Pandora's floating mountains",
"the Matrix's loading dock","Jumanji's jungle board","the TARDIS control room","Skull Island's beach",
"Westeros's throne room","the Upside-Down Forest","a floating city in the clouds","a city built inside a volcano",
"an underwater kingdom","a city on the back of a giant turtle","a library at the edge of the universe",
"a town where it's always Tuesday","a village inside a snow globe","a kingdom made entirely of cheese",
"a planet with two suns and no shade","a city that only exists at midnight","a bridge between two dimensions",
"the last diner at the end of time","a maze that rearranges itself nightly","a garden where thoughts grow on trees"]

place_modifiers = ["abandoned","overcrowded","suspiciously quiet","under renovation","haunted","flooded","snow-covered",
"recently reopened","off-season","fully booked","condemned","newly discovered","secretly famous","mid-festival",
"under a strict curfew","rumored to be cursed","unexpectedly fancy","still under construction","oddly empty","on fire"]

all_places_base = real_places + imaginary_places
places = dedupe_fill(all_places_base, place_modifiers, 300)
write_csv("data/places.csv", places)
print("places:", len(places), len(set(places)))
