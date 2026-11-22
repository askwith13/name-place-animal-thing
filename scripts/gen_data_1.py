import csv, random, itertools

random.seed(42)

def write_csv(path, items):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["name"])
        for it in items:
            w.writerow([it])

def dedupe_fill(base_list, modifiers, target, article_aware=True):
    """Start from base_list (already full strings), then pad with
    base+modifier combos (postfix style: "a toaster, slightly broken")
    until we hit target unique strings. Postfix avoids a/an article bugs
    and works for both single adjectives and verb-phrase modifiers."""
    seen = []
    seen_set = set()
    def add(s):
        if s not in seen_set:
            seen_set.add(s)
            seen.append(s)
    for b in base_list:
        add(b)
    combos = [(m, b) for m in modifiers for b in base_list]
    random.shuffle(combos)
    i = 0
    while len(seen) < target and i < len(combos):
        m, b = combos[i]
        i += 1
        add(f"{b}, {m}")
    return seen[:target]

# ---------------- ANIMALS ----------------
real_animals = ["pangolin","aardvark","narwhal","platypus","red panda","blobfish","axolotl","quokka","tapir",
"okapi","fossa","kinkajou","binturong","markhor","saiga antelope","dhole","numbat","echidna","wolverine","lynx",
"caracal","serval","ocelot","margay","jaguarundi","kakapo","shoebill stork","hoatzin","cassowary","secretarybird",
"harpy eagle","king vulture","maned wolf","aardwolf","aye-aye","tarsier","slow loris","proboscis monkey","mandrill",
"gelada baboon","douc langur","saola","bongo antelope","gerenuk","dik-dik","pronghorn","takin","nilgai","dugong",
"manatee","narwhal calf","giant anteater","sloth bear","sun bear","spectacled bear","Tasmanian devil","wombat",
"capybara","mara","agouti","coati","olingo","margay cat","clouded leopard","snow leopard","fishing cat","flat-headed cat",
"pallas's cat","sand cat","black-footed cat","rusty-spotted cat","honey badger","star-nosed mole","naked mole rat",
"pink fairy armadillo","giant armadillo","nine-banded armadillo","pygmy hippo","warthog","babirusa","peccary",
"muskox","yak","markhor goat","chamois","ibex","argali sheep","vicuna","alpaca","llama","guanaco","emu","rhea",
"kiwi bird","kakapo parrot","hoopoe","hornbill","toucan","quetzal","lyrebird","bowerbird","frogmouth","kagu",
"potoo","tawny frogmouth","vampire bat","flying fox","colugo","sugar glider","quokka joey","Komodo dragon",
"thorny devil","frilled lizard","basilisk lizard","marine iguana","chameleon","leaf-tailed gecko","tokay gecko",
"mata mata turtle","leatherback turtle","matamata","axolotl larva","Chinese giant salamander","olm salamander",
"mudskipper","archerfish","mantis shrimp","giant isopod","vampire squid","dumbo octopus","flamboyant cuttlefish",
"mantis","leafcutter ant","bullet ant","atlas moth","luna moth","death's-head hawkmoth","goliath beetle",
"hercules beetle","giant weta","tarantula hawk wasp","honeypot ant","portuguese man o' war","nautilus",
"giant clam","sea pig","yeti crab","vampire crab","coconut crab","spider crab","mantis shrimp cousin",
"narwhal pod leader","beluga whale","narwhal's rival the walrus","elephant seal","leopard seal","crabeater seal",
"weddell seal","hooded seal","sea otter","river otter","giant otter","platypus cousin the echidna","wombat's uncle"]

imaginary_animals = ["dragon","unicorn","griffin","basilisk","phoenix","kraken","chimera","hydra","sphinx","pegasus",
"minotaur","cerberus","cockatrice","manticore","wyvern","leviathan","jackalope","yeti","chupacabra","mothman",
"loch ness monster","bigfoot","sea serpent","thunderbird","wendigo","kelpie","selkie","will-o'-the-wisp creature",
"roc","hippogriff","fire salamander spirit","ice phoenix","shadow wolf","moon rabbit","sun turtle","cloud dragon",
"storm eagle","sand worm","crystal stag","void cat","ghost fox","nine-tailed fox","qilin","baku dream-eater",
"tanuki shapeshifter","kappa","tengu","oni","yokai cat","dire wolf","sabretooth tiger ghost","mammoth spirit",
"two-headed llama","three-eyed owl","rainbow axolotl","telepathic jellyfish","singing whale of legend",
"clockwork sparrow","paper dragon","origami crane that came to life","cactus cat","jersey devil","ogopogo",
"bunyip","drop bear","tatzelwurm","grootslang","lindworm","amphisbaena","catoblepas","peryton","simurgh",
"alicanto","cuegle","gulon","pombero's pet armadillo","caipora's deer"]

animal_modifiers = ["caffeinated","philosophical","sleep-deprived","overconfident","telepathic","time-traveling",
"left-handed","mildly cursed","unlicensed","retired","feral","camera-shy","insomniac","jet-lagged","homesick",
"notoriously clumsy","surprisingly elegant","chronically anxious","legally blind","mysteriously wealthy",
"bilingual","undercover","reluctant","aspiring","washed-up","award-winning","haunted","semi-professional",
"disgraced","self-taught"]

def article_for(word):
    """Handles the 'u' sound exception: unicorn/unicycle/ukulele etc. start
    with a consonant SOUND despite the vowel letter, so they still take 'a'."""
    consonant_sound_exceptions = ("uni", "use", "user", "ukulele", "european", "one")
    wl = word.lower()
    if wl.startswith(consonant_sound_exceptions):
        return "a"
    return "an" if wl[0] in "aeiou" else "a"

all_animals_base = [(f"{article_for(a)} {a}") for a in real_animals] + \
                    [(f"{article_for(a)} {a}") for a in imaginary_animals]
animals = dedupe_fill(all_animals_base, animal_modifiers, 300)
write_csv("data/animals.csv", animals)
print("animals:", len(animals), len(set(animals)))
