const bogs = [
  {
    id: "ember",
    title: "Ember of the First Bog",
    date: "2025-07-08",
    exclusive: false,
    summary: "A primer on the Bog and why stories prefer to be orbited rather than scrolled.",
    tags: ["lore", "primer"],
    incantations: ["kindle", "step", "listen"],
    body: `
      <p>The Bog hums with intent. Unlike the linear scrolls of old blogs, each bog is a node, suspended in orbit, awaiting the right resonance to unfurl its tale.</p>
      <p>As you drift closer, the narrative flickers between possibilities: a traveler’s log, a myth retold, or a dispatch from a dream that refuses to dissipate.</p>
      <blockquote>To read is to orbit. To orbit is to listen. To listen is to change.</blockquote>
      <p>Wander freely, chant passages aloud, and note how the constellation reshapes itself in response to your curiosity. Each visit tallies resonance; each resonance nourishes the Bog.</p>
    `,
    position: { radius: 38, angle: 20 }
  },
  {
    id: "shade",
    title: "Whispers Beneath the Hemlock",
    date: "2025-07-05",
    exclusive: true,
    summary: "The first warded bog tells of companionship in underworld groves, and a blade that sings when lonely.",
    tags: ["story", "companions", "exclusive"],
    incantations: ["hemlock", "echo", "return"],
    body: `
      <p>There is a bend in the Bog where shade collects like velvet. The path forward glows faintly, and the spirits you meet will barter secrets for your patience.</p>
      <p>To gain their favor, you must answer to the rhythm they drum upon the cavern walls. Fail to listen, and the trail seals shut, the memory of it fading from view.</p>
      <p>Those who stay discover friendships in unlikely corners. A singer who can only speak in questions. A swordsman who refuses to draw steel unless someone hums beside him. Together they weave a harmony that unsettles the ward itself.</p>
      <p>Listen for the questions. Hum with the swordsman. The ward will fall.</p>
    `,
    position: { radius: 52, angle: 75 }
  },
  {
    id: "loom",
    title: "Threads of the Oracle",
    date: "2025-06-28",
    exclusive: false,
    summary: "How the oracle listens to your choices and shifts the web of bogs in subtle increments.",
    tags: ["design", "systems"],
    incantations: ["thread", "listen", "reshape"],
    body: `
      <p>Behind the scenes, the oracle observes your orbit. It amplifies nodes you cherish and dims those you shun. The network is alive, eager to follow your curiosity.</p>
      <p>Every chant adjusts the harmonics of the web. More resonance unlocks deeper branches, strange stories, and occasionally an uncharted bog spiralling into view.</p>
      <p>Leave offerings of feedback. The oracle is benevolent, but thrives on response.</p>
    `,
    position: { radius: 65, angle: 130 }
  },
  {
    id: "emberfall",
    title: "When Sparks Learn to Fall",
    date: "2025-06-20",
    exclusive: false,
    summary: "Notes on pacing a roguelike-inspired blog and keeping every descent surprising.",
    tags: ["design", "roguelike"],
    incantations: ["descend", "spark", "surprise"],
    body: `
      <p>Roguelike cadence can translate to the written word. Begin with ritual: a repeated phrase, a familiar motif. Then wrench the reader sideways. Offer choices, limit certainty.</p>
      <p>Hades II teaches us that iteration is the melody. Each attempt is both practice and canon. Your Bog can operate the same way: each revisit updates the record.</p>
      <p>Here we catalogue experiments in pacing, ritual, and playful consequence.</p>
    `,
    position: { radius: 48, angle: 200 }
  },
  {
    id: "glowroot",
    title: "Glowroot Conservatory",
    date: "2025-06-13",
    exclusive: true,
    summary: "A horticultural log about cultivating bioluminescent mycelium to light the paths between bogs.",
    tags: ["worldbuilding", "exclusive", "flora"],
    incantations: ["mycelium", "tend", "kindred"],
    body: `
      <p>The Glowroot Conservatory is tended in secret. Spores scatter like constellations beneath your boots, and every step is an agreement to keep their locations hidden.</p>
      <p>The minigame is a memory trial: follow the pulses of light as they travel from node to node, then trace them back without faltering. The reward is a gentle lantern to carry with you.</p>
      <p>Lantern light boosts resonance. Resonance unlocks new bogs. The loop continues.</p>
    `,
    position: { radius: 70, angle: 280 }
  },
  {
    id: "chorus",
    title: "Chorus of the River Nix",
    date: "2025-06-05",
    exclusive: false,
    summary: "Field recordings and prose about the subterranean river that threads the Bog together.",
    tags: ["audio", "story"],
    incantations: ["river", "chorus", "drift"],
    body: `
      <p>Echoes ricochet between cavern walls. Your own voice comes back changed, harmonized with unseen choristers.</p>
      <p>The river teaches improvisation: choose a motif, repeat it softly, then break the pattern when you feel the current tug. Stories obey similar rules.</p>
      <p>Listen long enough and you will hear verses belonging to other travelers. Borrow with care.</p>
    `,
    position: { radius: 35, angle: 320 }
  }
];

const links = [
  ["ember", "shade"],
  ["ember", "loom"],
  ["loom", "shade"],
  ["loom", "glowroot"],
  ["shade", "glowroot"],
  ["emberfall", "chorus"],
  ["ember", "emberfall"],
  ["chorus", "glowroot"],
  ["emberfall", "loom"],
  ["chorus", "shade"],
];

const runes = ["Ϟ", "Ϙ", "ψ", "λ", "δ", "Ͼ", "ϙ", "ϣ", "ϟ", "ϡ", "Ϸ", "Ϻ", "Ͼ", "Ϡ", "Ϛ"];

const state = {
  selected: null,
  resonance: Number(localStorage.getItem("bog-resonance") || 0),
  unlocked: new Set(JSON.parse(localStorage.getItem("bog-unlocked") || "[]")),
  bestScore: Number(localStorage.getItem("bog-best") || 0),
  currentScore: 0,
  trialActive: false,
  trialSequence: [],
  trialProgress: 0,
  pendingNode: null
};

const refs = {
  constellation: document.getElementById("constellation"),
  threadwork: document.getElementById("threadwork"),
  incantationText: document.getElementById("incantation-text"),
  oracleTitle: document.getElementById("oracle-title"),
  oracleDate: document.getElementById("oracle-date"),
  oracleTags: document.getElementById("oracle-tags"),
  oracleSummary: document.getElementById("oracle-summary"),
  chantButton: document.getElementById("chant-button"),
  readButton: document.getElementById("read-button"),
  codex: document.getElementById("codex"),
  codexTitle: document.getElementById("codex-title"),
  codexBody: document.getElementById("codex-body"),
  closeCodex: document.getElementById("close-codex"),
  unlockStatus: document.getElementById("unlock-status"),
  resonance: document.getElementById("resonance"),
  bestScore: document.getElementById("best-score"),
  currentScore: document.getElementById("current-score"),
  trialVeil: document.getElementById("trial-veil"),
  trialSequence: document.getElementById("rune-sequence"),
  runeGrid: document.getElementById("rune-grid"),
  trialStatus: document.getElementById("trial-status"),
  startTrial: document.getElementById("start-trial"),
  closeTrial: document.getElementById("close-trial")
};

function init() {
  refs.bestScore.textContent = state.bestScore;
  refs.resonance.textContent = state.resonance;
  updateUnlockStatus();
  updateScores();
  buildConstellation();
  cycleIncantation();
  bindEvents();
}

function bindEvents() {
  refs.chantButton.addEventListener("click", chant);
  refs.readButton.addEventListener("click", openCodex);
  refs.closeCodex.addEventListener("click", closeCodex);
  refs.startTrial.addEventListener("click", startTrial);
  refs.closeTrial.addEventListener("click", () => toggleTrial(false));
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", drawConstellation);
}

function updateUnlockStatus() {
  const unlockedCount = [...state.unlocked].filter(id => bogs.find(b => b.id === id && b.exclusive)).length;
  const totalExclusive = bogs.filter(b => b.exclusive).length;
  refs.unlockStatus.textContent = `${unlockedCount} / ${totalExclusive} exclusive bogs unlocked`;
}

function buildConstellation() {
  const template = document.getElementById("bog-template");
  refs.constellation.querySelectorAll(".bog-node").forEach(node => node.remove());
  bogs.forEach((bog) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = bog.id;
    node.dataset.exclusive = bog.exclusive;
    node.textContent = bog.title.split(" ")[0];
    node.tabIndex = 0;
    if (state.unlocked.has(bog.id) || !bog.exclusive) {
      node.classList.add("unlocked");
    }
    positionNode(node, bog);
    node.addEventListener("click", () => selectBog(bog));
    node.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        selectBog(bog);
      }
    });
    refs.constellation.appendChild(node);
  });
  layoutNodes();
  drawConstellation();
}

function positionNode(node, bog) {
  const { radius, angle } = bog.position;
  const bounds = refs.constellation.getBoundingClientRect();
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;
  const rad = (angle * Math.PI) / 180;
  const x = centerX + (radius * Math.cos(rad));
  const y = centerY + (radius * Math.sin(rad));
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
}

function drawConstellation() {
  layoutNodes();
  const bounds = refs.constellation.getBoundingClientRect();
  refs.threadwork.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
  refs.threadwork.innerHTML = "";
  links.forEach(([fromId, toId]) => {
    const from = refs.constellation.querySelector(`.bog-node[data-id="${fromId}"]`);
    const to = refs.constellation.querySelector(`.bog-node[data-id="${toId}"]`);
    if (!from || !to) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", parseFloat(from.style.left) + from.offsetWidth / 2);
    line.setAttribute("y1", parseFloat(from.style.top) + from.offsetHeight / 2);
    line.setAttribute("x2", parseFloat(to.style.left) + to.offsetWidth / 2);
    line.setAttribute("y2", parseFloat(to.style.top) + to.offsetHeight / 2);
    line.dataset.from = fromId;
    line.dataset.to = toId;
    line.classList.add("thread");
    refs.threadwork.appendChild(line);
  });
}

const incantationFragments = {
  verbs: ["summon", "breathe", "shatter", "harmonize", "trace", "invoke", "listen"],
  adjectives: ["emberlit", "tidal", "silken", "obsidian", "echoing", "luminous", "feral"],
  nouns: ["echo", "memory", "path", "river", "mycelium", "covenant", "dream"]
};

function cycleIncantation() {
  const phrase = `${sample(incantationFragments.verbs)} the ${sample(incantationFragments.adjectives)} ${sample(incantationFragments.nouns)}`;
  refs.incantationText.textContent = phrase;
  setTimeout(cycleIncantation, 4000 + Math.random() * 2000);
}

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function selectBog(bog) {
  state.selected = bog;
  refs.oracleTitle.textContent = bog.title;
  refs.oracleDate.textContent = new Date(bog.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  refs.oracleTags.innerHTML = bog.tags.map(tag => `<span>${tag}</span>`).join("");
  refs.oracleSummary.innerHTML = bog.summary;
  refs.chantButton.disabled = false;
  const unlocked = state.unlocked.has(bog.id) || !bog.exclusive;
  refs.readButton.disabled = !unlocked;
  refs.readButton.textContent = unlocked ? "Traverse Bog" : "Warded";
  highlightLinks(bog.id);
}

function highlightLinks(activeId) {
  refs.threadwork.querySelectorAll("line").forEach(line => {
    const related = line.dataset.from === activeId || line.dataset.to === activeId;
    line.classList.toggle("active", related);
  });
}

function layoutNodes() {
  bogs.forEach(bog => {
    const node = refs.constellation.querySelector(`.bog-node[data-id="${bog.id}"]`);
    if (node) {
      positionNode(node, bog);
    }
  });
}

function chant() {
  if (!state.selected) return;
  const incantation = state.selected.incantations.join(" · ");
  refs.oracleSummary.innerHTML = `<strong>Chant:</strong> ${incantation}`;
  setTimeout(() => {
    if (state.selected) {
      refs.oracleSummary.innerHTML = state.selected.summary;
    }
  }, 2500);
  state.resonance += 1;
  refs.resonance.textContent = state.resonance;
  localStorage.setItem("bog-resonance", state.resonance);
  if (state.selected.exclusive && !state.unlocked.has(state.selected.id)) {
    state.pendingNode = state.selected;
    toggleTrial(true);
  }
}

function openCodex() {
  if (!state.selected) return;
  refs.codex.hidden = false;
  refs.codexTitle.textContent = state.selected.title;
  refs.codexBody.innerHTML = state.selected.body;
}

function closeCodex() {
  refs.codex.hidden = true;
}

function toggleTrial(show) {
  refs.trialVeil.hidden = !show;
  state.trialActive = show;
  if (!show) {
    refs.trialStatus.textContent = "Awaiting initiation…";
    refs.trialStatus.style.color = "var(--muted)";
    refs.runeGrid.querySelectorAll("button").forEach(btn => btn.classList.remove("correct", "incorrect"));
    state.trialSequence = [];
    state.trialProgress = 0;
    state.pendingNode = null;
  }
}

function startTrial() {
  if (!state.pendingNode) {
    state.pendingNode = state.selected;
  }
  if (!state.pendingNode) return;
  state.trialSequence = generateSequence(3 + Math.floor(state.resonance / 3));
  state.trialProgress = 0;
  refs.trialSequence.textContent = state.trialSequence.join(" ");
  refs.trialStatus.textContent = "Repeat the sequence";
  renderRuneGrid();
}

function generateSequence(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    sequence.push(sample(runes));
  }
  return sequence;
}

function renderRuneGrid() {
  refs.runeGrid.innerHTML = "";
  runes.forEach(rune => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = rune;
    btn.addEventListener("click", () => selectRune(rune, btn));
    refs.runeGrid.appendChild(btn);
  });
}

function selectRune(rune, btn) {
  if (!state.trialSequence.length) return;
  const expected = state.trialSequence[state.trialProgress];
  if (rune === expected) {
    btn.classList.add("correct");
    state.trialProgress += 1;
    if (state.trialProgress === state.trialSequence.length) {
      trialSuccess();
    }
  } else {
    btn.classList.add("incorrect");
    trialFail();
  }
}

function trialSuccess() {
  refs.trialStatus.textContent = "Ward shattered!";
  refs.trialStatus.style.color = "var(--success)";
  if (state.pendingNode) {
    state.unlocked.add(state.pendingNode.id);
    persistUnlocks();
    updateUnlockStatus();
    const nodeEl = refs.constellation.querySelector(`.bog-node[data-id="${state.pendingNode.id}"]`);
    if (nodeEl) nodeEl.classList.add("unlocked");
    refs.readButton.disabled = false;
    refs.readButton.textContent = "Traverse Bog";
  }
  state.currentScore += 1;
  if (state.currentScore > state.bestScore) {
    state.bestScore = state.currentScore;
    localStorage.setItem("bog-best", state.bestScore);
  }
  updateScores();
  setTimeout(() => toggleTrial(false), 900);
}

function trialFail() {
  refs.trialStatus.textContent = "The ward remains. Resonance drains.";
  refs.trialStatus.style.color = "var(--danger)";
  state.currentScore = 0;
  updateScores();
  setTimeout(() => {
    toggleTrial(false);
  }, 900);
}

function persistUnlocks() {
  localStorage.setItem("bog-unlocked", JSON.stringify([...state.unlocked]));
}

function updateScores() {
  refs.bestScore.textContent = state.bestScore;
  refs.currentScore.textContent = state.currentScore;
}

function onKey(ev) {
  if (ev.key === "Escape") {
    if (!refs.codex.hidden) {
      closeCodex();
      return;
    }
    if (state.trialActive) {
      toggleTrial(false);
    }
  }
}

init();
