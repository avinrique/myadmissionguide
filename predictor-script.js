let data = null;
let mode = "marks"; // "marks" | "rank"

const $ = (id) => document.getElementById(id);
const examSelect = $("exam");
const modeToggle = $("mode-toggle");
const modeMarksBtn = $("mode-marks-btn");
const modeRankBtn = $("mode-rank-btn");
const marksField = $("marks-field");
const rankField = $("rank-field");
const marksInput = $("marks");
const rankInput = $("rank-input");
const totalMarksSpan = $("total-marks");
const categorySelect = $("category");
const branchSelect = $("branch");
const filterRow = $("filter-row");
const predictBtn = $("predict-btn");
const resultsSection = $("results");
const rankTitle = $("rank-title");
const rankValue = $("rank-value");
const rankSub = $("rank-sub");
const resultsHeading = $("results-heading");
const resultsCount = $("results-count");
const noResults = $("no-results");
const collegeTable = $("college-table");
const collegeTbody = $("college-tbody");
const collegeList = $("college-list");
const metaExam = $("meta-exam");
const metaInput = $("meta-input");
const metaCategory = $("meta-category");
const rankPicker = $("rank-picker");
const rankSlider = $("rank-slider");
const rankInputPicker = $("rank-input-picker");
const rankMinLabel = $("rank-min-label");
const rankMaxLabel = $("rank-max-label");

// CSV line parser that handles quoted fields with commas
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') inQuotes = false;
      else current += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// Process JoSAA CSV into college arrays for JEE Advanced and JEE Main
function processCSV(csvText) {
  const lines = csvText.split("\n");
  const jeeAdvanced = [];
  const jeeMain = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 8) continue;

    const round = fields[0];
    const institute = fields[1];
    const program = fields[2];
    const quota = fields[3];
    const seatType = fields[4];
    const gender = fields[5];
    const closingRank = parseInt(fields[7]);

    if (round !== "5" || quota !== "AI" || gender !== "Gender-Neutral") continue;
    if (isNaN(closingRank)) continue;

    const branch = program.indexOf("(") !== -1
      ? program.substring(0, program.indexOf("(")).trim()
      : program.trim();

    const entry = { name: institute, branch: branch, cutoffRank: closingRank, category: seatType };

    if (institute.includes("Indian Institute") && institute.includes("of Technology")) {
      jeeAdvanced.push(entry);
    } else {
      jeeMain.push(entry);
    }
  }

  return { jeeAdvanced, jeeMain };
}

// ===== DATA LOADING WITH CACHE + TYPEWRITER LOADER =====
const CACHE_KEY = "cp_cached_data";
const CACHE_VER = "v1";
const twLoader = $("tw-loader");
const twLine = $("tw-line");
const twBar = $("tw-bar");
let twTimers = [];

const phrases = [
  "Your dream college is closer than you think...",
  "Scanning 50,000+ cutoff records...",
  "IITs, NITs, IIITs \u2014 we\u2019ve got them all...",
  "Mapping your path to success...",
  "Almost there, hang tight..."
];

function typeWriter(text, el, speed, cb) {
  el.textContent = "";
  let i = 0;
  function tick() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      twTimers.push(setTimeout(tick, speed));
    } else if (cb) {
      twTimers.push(setTimeout(cb, 1200));
    }
  }
  tick();
}

function startTypewriter() {
  let idx = 0;
  function next() {
    typeWriter(phrases[idx], twLine, 35, () => {
      idx = (idx + 1) % phrases.length;
      next();
    });
  }
  next();
  // Animate progress bar (indeterminate feel)
  let pct = 0;
  function advanceBar() {
    pct += Math.random() * 12 + 3;
    if (pct > 85) pct = 85;
    twBar.style.width = pct + "%";
    twTimers.push(setTimeout(advanceBar, 400 + Math.random() * 300));
  }
  advanceBar();
}

function hideLoader() {
  twTimers.forEach(clearTimeout);
  twBar.style.width = "100%";
  twLine.textContent = "Ready! Let\u2019s find your college.";
  setTimeout(() => { twLoader.classList.add("done"); }, 500);
}

function onDataReady() {
  examSelect.disabled = false;
  Object.keys(data).forEach((name) => {
    const o = document.createElement("option");
    o.value = name;
    o.textContent = name;
    examSelect.appendChild(o);
  });
  hideLoader();
}

// Expand compact cached colleges (n/b/r/c → name/branch/cutoffRank/category)
function expandColleges(arr) {
  return arr.map((c) => ({ name: c.n, branch: c.b, cutoffRank: c.r, category: c.c }));
}

examSelect.disabled = true;

// Try localStorage cache first
(function loadData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && cached._v === CACHE_VER) {
        data = cached.exams;
        data["JEE Advanced"].colleges = expandColleges(cached.colleges.adv);
        data["JEE Main"].colleges = expandColleges(cached.colleges.main);
        // Instant — hide loader immediately, no typewriter needed
        twLoader.classList.add("done");
        onDataReady();
        return;
      }
    }
  } catch (e) { /* cache miss */ }

  // No cache — show typewriter and fetch
  startTypewriter();

  Promise.all([
    fetch("data/cutoffs.json").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch("data/josaa_all_rounds.csv").then((r) => { if (!r.ok) throw new Error(); return r.text(); }),
  ])
    .then(([json, csvText]) => {
      data = json.exams;
      const csv = processCSV(csvText);
      data["JEE Advanced"].colleges = csv.jeeAdvanced;
      data["JEE Main"].colleges = csv.jeeMain;

      // Cache for next visit (compact keys to save space)
      try {
        const toCache = {
          _v: CACHE_VER,
          exams: json.exams,
          colleges: {
            adv: csv.jeeAdvanced.map((c) => ({ n: c.name, b: c.branch, r: c.cutoffRank, c: c.category })),
            main: csv.jeeMain.map((c) => ({ n: c.name, b: c.branch, r: c.cutoffRank, c: c.category }))
          }
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
      } catch (e) { /* quota exceeded — skip */ }

      onDataReady();
    })
    .catch(() => {
      hideLoader();
      alert("Could not load data. Please check your internet connection.");
    });
})();

// Exam selected → show everything
examSelect.addEventListener("change", () => {
  const exam = examSelect.value;
  resultsSection.classList.add("hidden");
  resultsSection.classList.remove("show");

  if (!exam) {
    modeToggle.style.display = "none";
    marksField.style.display = "none";
    rankField.style.display = "none";
    filterRow.style.display = "none";
    predictBtn.style.display = "none";
    return;
  }

  const examData = data[exam];

  // Show mode toggle + marks field
  modeToggle.style.display = "flex";
  setMode("marks");

  // Total marks hint
  totalMarksSpan.textContent = "(out of " + examData.totalMarks + ")";
  marksInput.max = examData.totalMarks;
  marksInput.placeholder = "Enter marks (0\u2013" + examData.totalMarks + ")";
  marksInput.value = "";
  rankInput.value = "";

  // Populate category + branch from colleges
  populateFilters(examData.colleges);

  filterRow.style.display = "grid";
  predictBtn.style.display = "flex";
  predictBtn.disabled = true;
});

// Mode toggle
modeMarksBtn.addEventListener("click", () => setMode("marks"));
modeRankBtn.addEventListener("click", () => setMode("rank"));

function setMode(m) {
  mode = m;
  modeMarksBtn.classList.toggle("active", m === "marks");
  modeRankBtn.classList.toggle("active", m === "rank");
  marksField.style.display = m === "marks" ? "block" : "none";
  rankField.style.display = m === "rank" ? "block" : "none";
  updateBtn();
}

function populateFilters(colleges) {
  // Category
  categorySelect.innerHTML = '<option value="">Select category</option>';
  const allCatOpt = document.createElement("option");
  allCatOpt.value = "__all__";
  allCatOpt.textContent = "All Categories";
  categorySelect.appendChild(allCatOpt);
  const cats = [...new Set(colleges.map((c) => c.category))].sort();
  cats.forEach((cat) => {
    const o = document.createElement("option");
    o.value = cat;
    o.textContent = cat;
    categorySelect.appendChild(o);
  });

  // Branch
  branchSelect.innerHTML = '<option value="">Select branch</option>';
  const allOpt = document.createElement("option");
  allOpt.value = "__all__";
  allOpt.textContent = "All Branches";
  branchSelect.appendChild(allOpt);
  [...new Set(colleges.map((c) => c.branch))].sort().forEach((b) => {
    const o = document.createElement("option");
    o.value = b;
    o.textContent = b;
    branchSelect.appendChild(o);
  });
}

// Validate
categorySelect.addEventListener("change", updateBtn);
branchSelect.addEventListener("change", updateBtn);
marksInput.addEventListener("input", updateBtn);
rankInput.addEventListener("input", updateBtn);

function updateBtn() {
  if (!examSelect.value) { predictBtn.disabled = true; return; }
  const filtersOk = categorySelect.value && branchSelect.value;
  let inputOk = false;
  if (mode === "marks") {
    const v = Number(marksInput.value);
    inputOk = marksInput.value !== "" && v >= 0 && v <= Number(marksInput.max);
  } else {
    inputOk = rankInput.value !== "" && Number(rankInput.value) >= 1;
  }
  predictBtn.disabled = !(filtersOk && inputOk);
}

// Lead capture modal
const leadModal = $("lead-modal");
const leadForm = $("lead-form");
const leadError = $("lead-error");
const leadName = $("lead-name");
const leadEmail = $("lead-email");
const leadPhone = $("lead-phone");
const leadState = $("lead-state");

function isLeadCaptured() {
  return localStorage.getItem("cp_lead_captured") === "1";
}

leadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // Clear previous errors
  leadError.classList.add("hidden");
  leadName.classList.remove("input-error");
  leadPhone.classList.remove("input-error");
  leadState.classList.remove("input-error");

  const name = leadName.value.trim();
  const phone = leadPhone.value.trim();
  const state = leadState.value;
  const errors = [];

  if (!name) errors.push("Name is required");
  if (!phone || !/^\d{10}$/.test(phone)) errors.push("Valid 10-digit phone number is required");
  if (!state) errors.push("State is required");

  if (errors.length) {
    leadError.textContent = errors[0];
    leadError.classList.remove("hidden");
    if (!name) leadName.classList.add("input-error");
    if (!phone || !/^\d{10}$/.test(phone)) leadPhone.classList.add("input-error");
    if (!state) leadState.classList.add("input-error");
    return;
  }

  // Send lead to admin backend
  const submitBtn = leadForm.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  // Calculate predicted rank before sending
  var predictedRank = { best: 0, worst: 0 };
  var examData = data[examSelect.value];
  if (mode === "marks" && examData) {
    var marks = parseFloat(marksInput.value);
    var range = getRankRange(marks, examData.historicalMarksToRank, examData.totalMarks);
    predictedRank = { best: range.best, worst: range.worst };
  } else if (mode === "rank") {
    var rank = parseInt(rankInput.value);
    predictedRank = { best: rank, worst: rank };
  }

  fetch("https://myadmissionguide.vercel.app/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      email: leadEmail.value.trim(),
      phone: phone,
      state: state,
      exam: examSelect.value,
      category: categorySelect.value === "__all__" ? "All Categories" : categorySelect.value,
      branch: branchSelect.value === "__all__" ? "All Branches" : branchSelect.value,
      inputMode: mode,
      inputValue: mode === "marks" ? marksInput.value : rankInput.value,
      predictedRank: predictedRank,
      source: "college-predictor"
    })
  })
    .then((r) => r.json())
    .then(() => {
      localStorage.setItem("cp_lead_captured", "1");
      leadModal.classList.add("hidden");
      predict();
    })
    .catch(() => {
      // Save locally as fallback and proceed
      localStorage.setItem("cp_lead_captured", "1");
      leadModal.classList.add("hidden");
      predict();
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
});

// Close modal on overlay click (outside the card)
leadModal.addEventListener("click", (e) => {
  if (e.target === leadModal) leadModal.classList.add("hidden");
});

// Predict
predictBtn.addEventListener("click", () => {
  if (!isLeadCaptured()) {
    leadModal.classList.remove("hidden");
    return;
  }
  predict();
});

// State for slider re-renders
let currentExamData = null;
let currentCategory = "";
let currentBranch = "";

function predict() {
  const examName = examSelect.value;
  const examData = data[examName];
  const category = categorySelect.value;
  const branch = branchSelect.value;

  currentExamData = examData;
  currentCategory = category;
  currentBranch = branch;

  let matchRank;

  if (mode === "marks") {
    const marks = parseFloat(marksInput.value);
    const range = getRankRange(marks, examData.historicalMarksToRank, examData.totalMarks);
    const rankLow = range.best;
    const rankHigh = range.worst;

    rankTitle.textContent = "Predicted Rank Range";
    rankValue.textContent = "#" + rankLow.toLocaleString() + " \u2013 #" + rankHigh.toLocaleString();
    rankSub.textContent = "Based on " + Object.keys(examData.historicalMarksToRank).length + " years of data. Drag the slider to explore.";
    metaInput.textContent = marks + " / " + examData.totalMarks + " marks";

    // Show rank picker
    rankSlider.min = rankLow;
    rankSlider.max = rankHigh;
    rankSlider.value = rankHigh;
    rankInputPicker.min = rankLow;
    rankInputPicker.max = rankHigh;
    rankInputPicker.value = rankHigh;
    rankMinLabel.textContent = "#" + rankLow.toLocaleString();
    rankMaxLabel.textContent = "#" + rankHigh.toLocaleString();
    rankPicker.classList.remove("hidden");

    matchRank = rankHigh;
  } else {
    const rank = parseInt(rankInput.value);
    matchRank = rank;

    rankTitle.textContent = "Your Rank";
    rankValue.textContent = "#" + rank.toLocaleString();
    rankSub.textContent = "";
    metaInput.textContent = "Rank " + rank.toLocaleString();

    // Hide rank picker in rank mode
    rankPicker.classList.add("hidden");
  }

  metaExam.textContent = examName;
  metaCategory.textContent = category === "__all__" ? "All Categories" : category;

  renderColleges(matchRank);

  resultsSection.classList.remove("hidden");
  resultsSection.classList.remove("show");
  void resultsSection.offsetWidth;
  resultsSection.classList.add("show");
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderColleges(matchRank) {
  const examData = currentExamData;
  const category = currentCategory;
  const branch = currentBranch;

  // Filter colleges
  let eligible = examData.colleges.filter((c) => c.cutoffRank >= matchRank);
  if (category !== "__all__") eligible = eligible.filter((c) => c.category === category);
  if (branch !== "__all__") eligible = eligible.filter((c) => c.branch === branch);
  eligible.sort((a, b) => b.cutoffRank - a.cutoffRank);

  // Heading
  const branchLabel = branch === "__all__" ? "All Branches" : branch;
  resultsHeading.textContent = "Eligible Colleges \u2014 " + branchLabel;
  resultsCount.textContent = eligible.length + " found";

  // Build table + cards
  collegeTbody.innerHTML = "";
  collegeList.innerHTML = "";

  if (eligible.length === 0) {
    noResults.classList.remove("hidden");
    collegeTable.classList.add("hidden");
    collegeTable.classList.remove("show");
    collegeList.classList.add("hidden");
    collegeList.classList.remove("show");
  } else {
    noResults.classList.add("hidden");
    collegeTable.classList.remove("hidden");
    collegeTable.classList.add("show");
    collegeList.classList.remove("hidden");
    collegeList.classList.add("show");

    eligible.forEach((c, i) => {
      const ch = getChance(matchRank, c.cutoffRank);

      // Table row
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="td-num">' + (i + 1) + "</td>" +
        '<td class="td-name">' + c.name + "</td>" +
        "<td>" + c.branch + "</td>" +
        '<td class="td-cutoff">' + c.cutoffRank.toLocaleString() + "</td>" +
        '<td class="td-chance"><span class="badge ' + ch.cls + '">' + ch.label + "</span></td>";
      collegeTbody.appendChild(tr);

      // Card
      const card = document.createElement("div");
      card.className = "college-card";
      card.innerHTML =
        '<div class="card-num">' + (i + 1) + "</div>" +
        '<div class="card-body">' +
          '<div class="card-name">' + c.name + "</div>" +
          '<div class="card-meta">' +
            '<span class="card-branch">' + c.branch + "</span>" +
            '<span class="card-separator"></span>' +
            '<span class="card-cutoff">Cutoff #' + c.cutoffRank.toLocaleString() + "</span>" +
            '<span class="card-badge"><span class="badge ' + ch.cls + '">' + ch.label + "</span></span>" +
          "</div>" +
        "</div>";
      collegeList.appendChild(card);
    });
  }
}

// Sync slider → number input and re-render
rankSlider.addEventListener("input", () => {
  const val = parseInt(rankSlider.value);
  rankInputPicker.value = val;
  renderColleges(val);
});

// Sync number input → slider and re-render
rankInputPicker.addEventListener("input", () => {
  let val = parseInt(rankInputPicker.value);
  if (isNaN(val)) return;
  const lo = parseInt(rankSlider.min);
  const hi = parseInt(rankSlider.max);
  if (val < lo) val = lo;
  if (val > hi) val = hi;
  rankSlider.value = val;
  renderColleges(val);
});

// Get rank range across ALL historical years
function getRankRange(marks, historicalData, totalMarks) {
  const years = Object.keys(historicalData);
  let bestRank = Infinity;
  let worstRank = 0;

  years.forEach((year) => {
    const table = historicalData[year];
    const rank = interpolateRank(marks, table);
    if (rank < bestRank) bestRank = rank;
    if (rank > worstRank) worstRank = rank;
  });

  // Fallback if no data matched
  if (bestRank === Infinity) {
    const fallback = formulaRank(marks, totalMarks);
    return { best: fallback, worst: fallback };
  }

  return { best: bestRank, worst: worstRank };
}

function interpolateRank(marks, table) {
  const range = table.find((r) => marks >= r.marksMin && marks <= r.marksMax);
  if (!range) return 999999;

  const marksSpan = range.marksMax - range.marksMin;
  const rankSpan = range.rankMax - range.rankMin;
  if (marksSpan === 0) return range.rankMin;

  const fraction = (range.marksMax - marks) / marksSpan;
  return Math.round(range.rankMin + fraction * rankSpan);
}

function formulaRank(marks, totalMarks) {
  return Math.max(1, Math.round(1000000 * (1 - marks / totalMarks)));
}

function getChance(userRank, cutoffRank) {
  const ratio = cutoffRank / userRank;
  if (ratio >= 2) return { label: "Safe", cls: "badge-safe" };
  if (ratio >= 1.2) return { label: "Good", cls: "badge-good" };
  return { label: "Reach", cls: "badge-reach" };
}
