/* =================================================================
   DR NAEEM Eye Laser & Retina Center — Call Assistant
   Client-Side Application Logic
   ================================================================= */

// Configuration: Supabase credentials
var SUPABASE_URL = "https://ffijqmiaiipohxscpiyv.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaWpxbWlhaWlwb2h4c2NwaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDYzNjYsImV4cCI6MjEwMjgyMjM2Nn0.8Ncr6sT3gnPKgS_pEzDpYgsdiRMqcf8crPbxzvQi7C0";

// Supabase client instance
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =================================================================
   1. DATA MODEL & STATE
   ================================================================= */

var categories = [];
var questions = [];

var activeCategoryId = null;
var activeQuestionId = null;
var currentView = "assistant"; // "assistant" | "manage"

var currentUser = null;        // Supabase auth user object
var currentUserProfile = null; // Profile record { id, name, email, role, status }
var realtimeChannel = null;

// Palette for category badges
var TAG_COLORS = [
  { bg: "#e0edff", text: "#1d4ed8" },
  { bg: "#dcf5f0", text: "#0f766e" },
  { bg: "#f1e6ff", text: "#7c3aed" },
  { bg: "#fff3d6", text: "#b45309" },
  { bg: "#ffe4e9", text: "#be123c" },
  { bg: "#e1f7e6", text: "#15803d" }
];

function tagColorFor(categoryId) {
  var idx = categories.findIndex(function (c) { return c.id === categoryId; });
  return TAG_COLORS[(idx < 0 ? 0 : idx) % TAG_COLORS.length];
}

function isAdmin() {
  return !!(currentUserProfile && currentUserProfile.role === "admin" && currentUserProfile.status === "active");
}

/* =================================================================
   2. SECTION 4 ARCHITECTURE — GUARDED STARTUP & AUTHENTICATION
   ================================================================= */

var _authInitPromise = null;     // in-flight or completed initialization promise
var _authInitSessionKey = null;  // user.id:access_token or ""
var _authInitSettled = true;     // true when idle, false during startup/restoration

var STORAGE_STATE_KEY = "dr_naeem_call_assistant_state";

/**
 * Races a promise against a timeout timer.
 * Rejects with a clear labeled error if the promise takes longer than ms.
 */
function withTimeout(promise, ms, label) {
  var timeoutId;
  var timeoutPromise = new Promise(function (_, reject) {
    timeoutId = setTimeout(function () {
      reject(new Error((label || "Network operation") + " timed out after " + Math.round(ms / 1000) + "s"));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(function () {
    clearTimeout(timeoutId);
  });
}

/**
 * Returns a unique key representing a specific auth session.
 */
function sessionKey(session) {
  if (!session || !session.user) return "";
  return session.user.id + ":" + (session.access_token || "");
}

/**
 * Safely saves current view, category, and question state to sessionStorage.
 */
function saveCurrentState() {
  try {
    var state = {
      view: currentView,
      categoryId: activeCategoryId,
      questionId: activeQuestionId
    };
    sessionStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    // Fails silently in incognito or storage-restricted contexts
  }
}

/**
 * Clears saved UI state from sessionStorage (called on logout).
 */
function clearSavedState() {
  try {
    sessionStorage.removeItem(STORAGE_STATE_KEY);
  } catch (e) {}
}

/**
 * Loads user profile and all clinic data in parallel with timeout.
 */
async function loadProfileAndAppData(session) {
  currentUser = session.user;

  var results = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single(),
    supabase
      .from("categories")
      .select("*")
      .order("name"),
    supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
  ]);

  var profileRes = results[0];
  var catRes = results[1];
  var qRes = results[2];

  if (profileRes.error) {
    console.warn("Could not fetch profile, falling back to basic user:", profileRes.error);
    currentUserProfile = {
      id: session.user.id,
      name: (session.user.user_metadata && session.user.user_metadata.name) || "",
      email: session.user.email || "",
      role: "user",
      status: "active"
    };
  } else {
    currentUserProfile = profileRes.data;
  }

  // Account disabled check
  if (currentUserProfile && currentUserProfile.status === "disabled") {
    throw new Error("Your account has been disabled. Please contact an administrator.");
  }

  if (catRes.error) throw catRes.error;
  categories = catRes.data || [];

  if (qRes.error) throw qRes.error;
  questions = (qRes.data || []).map(function (q) {
    return {
      id: q.id,
      categoryId: q.category_id,
      question: q.question,
      answer: q.answer,
      keywords: Array.isArray(q.keywords) ? q.keywords : [],
      updatedAt: q.updated_at
    };
  });
}

/**
 * Resolves role permissions and performs initial render atomically in one pass.
 * Prevents any flash of wrong-role or unpopulated UI.
 */
function resolveRoleAndRenderCorrectUI() {
  updateHeaderUserInfo();
  applyRoleVisibility();
  renderCategoryList();
  refreshCategorySelect();
  if (isAdmin()) {
    renderManageCategoryList();
    renderManageQuestionList();
  }
}

/**
 * Restores user view, selected category, and open question from sessionStorage.
 */
function restoreLastViewIfAny() {
  var saved = null;
  try {
    var raw = sessionStorage.getItem(STORAGE_STATE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {}

  // Determine whether manage view is valid for current role
  var shouldShowManage = !!(saved && saved.view === "manage" && isAdmin());

  // Validate category
  var targetCategory = null;
  if (saved && saved.categoryId) {
    targetCategory = categories.find(function (c) { return c.id === saved.categoryId; });
  }
  if (!targetCategory && categories.length > 0) {
    targetCategory = categories[0];
  }

  // Validate question
  var targetQuestion = null;
  if (targetCategory && saved && saved.questionId) {
    targetQuestion = questions.find(function (q) {
      return q.id === saved.questionId && q.categoryId === targetCategory.id;
    });
  }

  // Render assistant state
  if (targetCategory) {
    activeCategoryId = targetCategory.id;
    renderCategoryList();
    var filtered = questions.filter(function (q) { return q.categoryId === targetCategory.id; });
    renderQuestionList(filtered);
    document.getElementById("questionListTitle").textContent = targetCategory.name + " Questions";

    if (targetQuestion) {
      activeQuestionId = targetQuestion.id;
      renderAnswerPanel(targetQuestion);
    } else {
      activeQuestionId = null;
      renderAnswerPanel(null);
    }
  } else {
    activeCategoryId = null;
    activeQuestionId = null;
    renderCategoryList();
    renderQuestionList([]);
    renderAnswerPanel(null);
    document.getElementById("questionListTitle").textContent = "Questions";
  }

  // Switch to target view
  if (shouldShowManage) {
    showManageView();
  } else {
    showAssistantView();
  }

  saveCurrentState();
}

/**
 * Subscribes to Supabase Realtime changes safely without blocking UI.
 */
function setupRealtimeSafely() {
  try {
    setupRealtime();
  } catch (err) {
    console.warn("Realtime setup failed to initialize:", err);
  }
}

/**
 * Gracefully signs out of Supabase auth session.
 */
async function signOutSafely() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("Sign out encountered an error:", e);
  }
}

/**
 * Resets all in-memory application and authentication state.
 */
function resetAllAuthAndAppState() {
  currentUser = null;
  currentUserProfile = null;
  categories = [];
  questions = [];
  activeCategoryId = null;
  activeQuestionId = null;
  currentView = "assistant";
  _authInitPromise = null;
  _authInitSessionKey = null;
  _authInitSettled = true;
  cleanupRealtime();
  clearSavedState();
}

/**
 * Core guarded single-flight startup function.
 * Ensures exactly ONE execution per active session key, preventing race conditions.
 */
function initializeAuthenticatedApp(session) {
  var key = sessionKey(session);

  // Return existing in-flight or completed promise for identical session
  if (_authInitPromise && _authInitSessionKey === key) {
    return _authInitPromise;
  }

  _authInitSessionKey = key;
  _authInitSettled = false;

  _authInitPromise = (async function () {
    try {
      showAppLoading();
      await withTimeout(loadProfileAndAppData(session), 15000, "Loading your account and clinic data");
      resolveRoleAndRenderCorrectUI();
      setupRealtimeSafely();
      restoreLastViewIfAny();
      showAppView();
      hideStartupLoader();
      hideAppLoading();
    } catch (e) {
      console.error("Initialization error:", e);
      try {
        await withTimeout(signOutSafely(), 5000, "Sign out");
      } catch (_) {}
      resetAllAuthAndAppState();
      hideStartupLoader();
      hideAppLoading();
      var msg = e && e.message ? e.message : "Connection was too slow or interrupted. Please log in again.";
      if (msg.includes("timed out")) {
        msg = "Connection was too slow or interrupted. Please log in again.";
      }
      showLoginView(msg);
      throw e;
    } finally {
      _authInitSettled = true;
    }
  })();

  return _authInitPromise;
}

// Hard safety backstop: If startup is still pending after 18 seconds, force fail gracefully to login
setTimeout(function () {
  if (!_authInitSettled) {
    console.warn("Hard startup timeout backstop fired (18s)");
    signOutSafely().catch(function () {});
    resetAllAuthAndAppState();
    hideStartupLoader();
    hideAppLoading();
    showLoginView("Connection was too slow or interrupted. Please check your connection and sign in again.");
  }
}, 18000);

/* =================================================================
   3. UI VIEW CONTROLS & VISIBILITY
   ================================================================= */

function showLoginView(errorMessage) {
  document.getElementById("loginView").style.display = "flex";
  document.getElementById("appContainer").style.display = "none";
  var form = document.getElementById("loginForm");
  if (form) form.reset();
  var errEl = document.getElementById("loginError");
  if (errEl) {
    if (errorMessage) {
      errEl.textContent = errorMessage;
      errEl.style.display = "block";
    } else {
      errEl.style.display = "none";
    }
  }
  var submitBtn = document.getElementById("loginSubmitBtn");
  if (submitBtn) submitBtn.disabled = false;
  var btnText = document.getElementById("loginBtnText");
  if (btnText) btnText.style.display = "inline";
  var btnSpinner = document.getElementById("loginBtnSpinner");
  if (btnSpinner) btnSpinner.style.display = "none";
}

function showAppView() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appContainer").style.display = "block";
}

function showAppLoading() {
  var overlay = document.getElementById("appLoadingOverlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideAppLoading() {
  var overlay = document.getElementById("appLoadingOverlay");
  if (overlay) overlay.classList.add("hidden");
}

function hideStartupLoader() {
  var el = document.getElementById("startupLoader");
  if (el) el.style.display = "none";
}

function updateHeaderUserInfo() {
  if (!currentUserProfile) return;
  var nameEl = document.getElementById("userNameDisplay");
  var roleEl = document.getElementById("userRoleDisplay");
  if (nameEl) {
    nameEl.textContent = currentUserProfile.name || currentUserProfile.email || "User";
  }
  if (roleEl) {
    roleEl.textContent = (currentUserProfile.role || "user").toUpperCase();
    if (currentUserProfile.role === "admin") {
      roleEl.style.background = "#09090b";
      roleEl.style.color = "#ffffff";
    } else {
      roleEl.style.background = "#f1f5f9";
      roleEl.style.color = "#475569";
    }
  }
}

function applyRoleVisibility() {
  var adminOnly = document.querySelectorAll("[data-admin-only]");
  adminOnly.forEach(function (el) {
    el.style.display = isAdmin() ? "" : "none";
  });

  var goManageBtn = document.getElementById("goManageBtn");
  if (goManageBtn) {
    goManageBtn.style.display = isAdmin() ? "" : "none";
  }
}

function showAssistantView() {
  currentView = "assistant";
  document.getElementById("assistantView").classList.add("active");
  document.getElementById("manageView").classList.remove("active");
  document.getElementById("assistantHeaderRight").style.display = isAdmin() ? "flex" : "none";
  document.getElementById("assistantSearchWrap").style.display = "flex";
  document.getElementById("manageHeaderRight").style.display = "none";
  document.getElementById("headerSubtitle").textContent = "Quick answers for phone calls";
  saveCurrentState();
}

function showManageView() {
  if (!isAdmin()) {
    showAssistantView();
    return;
  }
  currentView = "manage";
  document.getElementById("assistantView").classList.remove("active");
  document.getElementById("manageView").classList.add("active");
  document.getElementById("assistantHeaderRight").style.display = "none";
  document.getElementById("assistantSearchWrap").style.display = "none";
  document.getElementById("manageHeaderRight").style.display = "flex";
  document.getElementById("headerSubtitle").textContent = "Content manager";
  saveCurrentState();
}

document.getElementById("goManageBtn").addEventListener("click", showManageView);
document.getElementById("goAssistantBtn").addEventListener("click", showAssistantView);

/* =================================================================
   4. URDU & RTL DETECTION HELPERS
   ================================================================= */

var URDU_SCRIPT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function isUrduText(str) {
  return URDU_SCRIPT_PATTERN.test(str || "");
}

function applyTextDirection(el, text) {
  if (!el) return;
  var checkStr = text != null ? text : el.textContent;
  if (isUrduText(checkStr)) {
    el.setAttribute("dir", "rtl");
    el.classList.add("urdu-text");
  } else {
    el.setAttribute("dir", "ltr");
    el.classList.remove("urdu-text");
  }
}

/* =================================================================
   5. REALTIME SUBSCRIPTIONS
   ================================================================= */

function setupRealtime() {
  cleanupRealtime();

  realtimeChannel = supabase
    .channel("clinic-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories" },
      function (payload) {
        handleRealtimeCategory(payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "questions" },
      function (payload) {
        handleRealtimeQuestion(payload);
      }
    )
    .subscribe(function (status) {
      var badge = document.getElementById("realtimeStatusBadge");
      var text = document.getElementById("realtimeStatusText");
      if (badge && text) {
        if (status === "SUBSCRIBED") {
          badge.classList.add("connected");
          text.textContent = "Live — Connected";
        } else {
          badge.classList.remove("connected");
          text.textContent = "Connecting...";
        }
      }
    });
}

function cleanupRealtime() {
  if (realtimeChannel) {
    try {
      supabase.removeChannel(realtimeChannel);
    } catch (e) {}
    realtimeChannel = null;
  }
}

function handleRealtimeCategory(payload) {
  var eventType = payload.eventType;
  var newRecord = payload.new;
  var oldRecord = payload.old;

  if (eventType === "INSERT") {
    var exists = categories.some(function (c) { return c.id === newRecord.id; });
    if (!exists) {
      categories.push({ id: newRecord.id, name: newRecord.name });
      refreshEverything();
    }
  } else if (eventType === "UPDATE") {
    var cat = categories.find(function (c) { return c.id === newRecord.id; });
    if (cat) {
      cat.name = newRecord.name;
      refreshEverything();
    }
  } else if (eventType === "DELETE") {
    categories = categories.filter(function (c) { return c.id !== oldRecord.id; });
    questions = questions.filter(function (q) { return q.categoryId !== oldRecord.id; });
    if (activeCategoryId === oldRecord.id) {
      activeCategoryId = categories.length > 0 ? categories[0].id : null;
      activeQuestionId = null;
    }
    refreshEverything();
    saveCurrentState();
  }
}

function handleRealtimeQuestion(payload) {
  var eventType = payload.eventType;
  var newRecord = payload.new;
  var oldRecord = payload.old;

  if (eventType === "INSERT") {
    var exists = questions.some(function (q) { return q.id === newRecord.id; });
    if (!exists) {
      questions.push({
        id: newRecord.id,
        categoryId: newRecord.category_id,
        question: newRecord.question,
        answer: newRecord.answer,
        keywords: Array.isArray(newRecord.keywords) ? newRecord.keywords : [],
        updatedAt: newRecord.updated_at
      });
      refreshEverything();
    }
  } else if (eventType === "UPDATE") {
    var q = questions.find(function (item) { return item.id === newRecord.id; });
    if (q) {
      q.categoryId = newRecord.category_id;
      q.question = newRecord.question;
      q.answer = newRecord.answer;
      q.keywords = Array.isArray(newRecord.keywords) ? newRecord.keywords : [];
      q.updatedAt = newRecord.updated_at;
      refreshEverything();
    }
  } else if (eventType === "DELETE") {
    questions = questions.filter(function (q) { return q.id !== oldRecord.id; });
    if (activeQuestionId === oldRecord.id) {
      activeQuestionId = null;
      renderAnswerPanel(null);
    }
    refreshEverything();
    saveCurrentState();
  }
}

function refreshEverything() {
  renderCategoryList();
  refreshCategorySelect();
  if (isAdmin()) {
    renderManageCategoryList();
    renderManageQuestionList();
  }

  var searchInput = document.getElementById("searchInput");
  if (searchInput && searchInput.value.trim() !== "") {
    runSearch(searchInput.value);
    return;
  }

  if (activeCategoryId) {
    var activeCat = categories.find(function (c) { return c.id === activeCategoryId; });
    if (activeCat) {
      var filtered = questions.filter(function (q) { return q.categoryId === activeCategoryId; });
      renderQuestionList(filtered);
      document.getElementById("questionListTitle").textContent = activeCat.name + " Questions";
      if (activeQuestionId) {
        var activeQ = filtered.find(function (q) { return q.id === activeQuestionId; });
        renderAnswerPanel(activeQ || null);
      }
    } else {
      if (categories.length > 0) {
        selectCategory(categories[0].id);
      } else {
        activeCategoryId = null;
        activeQuestionId = null;
        renderQuestionList([]);
        renderAnswerPanel(null);
      }
    }
  } else if (categories.length > 0) {
    selectCategory(categories[0].id);
  }
}

/* =================================================================
   6. ASSISTANT VIEW RENDERING
   ================================================================= */

function renderCategoryList() {
  var list = document.getElementById("categoryList");
  if (!list) return;
  list.innerHTML = "";

  if (categories.length === 0) {
    list.innerHTML = '<li class="empty-msg">No categories available.</li>';
    return;
  }

  categories.forEach(function (cat) {
    var count = questions.filter(function (q) { return q.categoryId === cat.id; }).length;
    var li = document.createElement("li");
    li.className = "category-item";
    li.innerHTML =
      '<button class="' + (cat.id === activeCategoryId ? "active" : "") + '">' +
      '<span>' + escapeHtml(cat.name) + '</span>' +
      '<span class="category-count">' + count + '</span>' +
      '</button>';

    var btn = li.querySelector("button");
    applyTextDirection(btn.querySelector("span"), cat.name);

    btn.addEventListener("click", function () {
      selectCategory(cat.id);
    });

    list.appendChild(li);
  });
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;
  activeQuestionId = null;

  var searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";

  renderCategoryList();

  var filtered = questions.filter(function (q) { return q.categoryId === categoryId; });
  renderQuestionList(filtered);
  renderAnswerPanel(null);

  var cat = categories.find(function (c) { return c.id === categoryId; });
  var titleEl = document.getElementById("questionListTitle");
  if (titleEl) {
    titleEl.textContent = cat ? cat.name + " Questions" : "Questions";
    applyTextDirection(titleEl, cat ? cat.name : "");
  }

  saveCurrentState();
}

function renderQuestionList(list) {
  var container = document.getElementById("questionList");
  if (!container) return;
  container.innerHTML = "";

  var countBadge = document.getElementById("questionCountBadge");
  if (countBadge) {
    countBadge.textContent = list.length + (list.length === 1 ? " item" : " items");
  }

  if (list.length === 0) {
    container.innerHTML = '<li class="empty-msg">No matching questions found.</li>';
    return;
  }

  list.forEach(function (q, index) {
    var li = document.createElement("li");
    li.className = "question-item";
    li.innerHTML =
      '<button class="' + (q.id === activeQuestionId ? "selected" : "") + '">' +
      '<span class="q-index">' + (index + 1) + '</span>' +
      '<span class="q-text">' + escapeHtml(q.question) + '</span>' +
      '<span class="arrow">&rarr;</span>' +
      '</button>';

    var btn = li.querySelector("button");
    applyTextDirection(btn, q.question);
    var qTextSpan = btn.querySelector(".q-text");
    if (qTextSpan) {
      qTextSpan.classList.toggle("urdu-text", isUrduText(q.question));
    }

    btn.addEventListener("click", function () {
      activeQuestionId = q.id;
      renderAnswerPanel(q);
      document.querySelectorAll(".question-item button").forEach(function (b) { b.classList.remove("selected"); });
      this.classList.add("selected");
      document.getElementById("answerPanel").scrollIntoView({ behavior: "smooth", block: "start" });
      saveCurrentState();
    });

    container.appendChild(li);
  });
}

function renderAnswerPanel(question) {
  var panel = document.getElementById("answerPanel");
  if (!panel) return;

  if (!question) {
    panel.innerHTML = '<div class="placeholder">Select a question to see the approved answer.</div>';
    return;
  }

  var cat = categories.find(function (c) { return c.id === question.categoryId; });
  var color = tagColorFor(question.categoryId);

  panel.innerHTML =
    '<div class="answer-panel-inner">' +
    '  <div class="answer-top">' +
    '    <span class="tag" style="background:' + color.bg + ';color:' + color.text + '">' + escapeHtml(cat ? cat.name : "General") + '</span>' +
    '    <button class="copy-btn" id="copyAnswerBtn">Copy Answer</button>' +
    '  </div>' +
    '  <div class="answer-question"></div>' +
    '  <div class="answer-text"></div>' +
    '  <div class="answer-footer">' +
    '    <span>Last updated: ' + escapeHtml(formatDate(question.updatedAt) || "—") + '</span>' +
    (isAdmin() ? '    <a href="#" id="editFromAssistantLink">Edit this answer</a>' : '') +
    '  </div>' +
    '</div>';

  var qEl = panel.querySelector(".answer-question");
  var aEl = panel.querySelector(".answer-text");

  qEl.textContent = question.question;
  aEl.textContent = question.answer;

  applyTextDirection(qEl, question.question);
  applyTextDirection(aEl, question.answer);

  document.getElementById("copyAnswerBtn").addEventListener("click", function () {
    copyToClipboard(question.answer, this);
  });

  var editLink = document.getElementById("editFromAssistantLink");
  if (editLink) {
    editLink.addEventListener("click", function (e) {
      e.preventDefault();
      showManageView();
      var btn = document.querySelector('.side-nav button[data-pane="pane-questions"]');
      if (btn) btn.click();
      startEditQuestion(question.id);
    });
  }
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(function () {
    var original = btn.textContent;
    btn.textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(function () {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1600);
  }).catch(function () {
    alert("Copy failed. Please manually select and copy the text.");
  });
}

/* =================================================================
   7. GLOBAL SEARCH (ENGLISH & URDU)
   ================================================================= */

function runSearch(term) {
  var q = (term || "").trim().toLowerCase();

  if (q === "") {
    if (activeCategoryId) {
      selectCategory(activeCategoryId);
    } else if (categories.length > 0) {
      selectCategory(categories[0].id);
    } else {
      renderQuestionList([]);
      document.getElementById("questionListTitle").textContent = "Questions";
    }
    return;
  }

  var words = q.split(/\s+/).filter(Boolean);

  var results = questions.filter(function (item) {
    var cat = categories.find(function (c) { return c.id === item.categoryId; });
    var haystack = [
      cat ? cat.name : "",
      item.question,
      item.answer,
      (item.keywords || []).join(" ")
    ].join(" ").toLowerCase();

    return words.every(function (w) { return haystack.indexOf(w) !== -1; });
  });

  activeCategoryId = null;
  renderCategoryList();
  var titleEl = document.getElementById("questionListTitle");
  if (titleEl) {
    titleEl.textContent = 'Results for "' + term + '"';
    applyTextDirection(titleEl, term);
  }
  renderQuestionList(results);
  renderAnswerPanel(null);
  saveCurrentState();
}

document.getElementById("searchInput").addEventListener("input", function () {
  runSearch(this.value);
});

/* =================================================================
   8. CONTENT MANAGEMENT (CATEGORIES & QUESTIONS CRUD)
   ================================================================= */

// Side Nav Switching in Manage View
document.querySelectorAll(".side-nav button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".side-nav button").forEach(function (b) { b.classList.remove("active"); });
    document.querySelectorAll(".manage-pane").forEach(function (p) { p.classList.remove("active"); });
    btn.classList.add("active");
    var pane = document.getElementById(btn.dataset.pane);
    if (pane) pane.classList.add("active");

    if (btn.dataset.pane === "pane-users" && isAdmin()) {
      loadUsers();
    }
  });
});

document.getElementById("newEntryBtn").addEventListener("click", function () {
  var activePane = document.querySelector(".manage-pane.active");
  if (!activePane) return;
  if (activePane.id === "pane-categories") {
    openCategoryForm();
  } else if (activePane.id === "pane-questions") {
    openQuestionForm();
  } else if (activePane.id === "pane-users") {
    openUserForm();
  }
});

// Category Management
function refreshCategorySelect() {
  var select = document.getElementById("questionCategory");
  if (!select) return;
  select.innerHTML = "";
  categories.forEach(function (cat) {
    var opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

function renderManageCategoryList() {
  var list = document.getElementById("manageCategoryList");
  if (!list) return;
  list.innerHTML = "";

  if (categories.length === 0) {
    list.innerHTML = '<tr><td colspan="3" class="empty-msg">No categories yet.</td></tr>';
    return;
  }

  categories.forEach(function (cat) {
    var count = questions.filter(function (q) { return q.categoryId === cat.id; }).length;
    var color = tagColorFor(cat.id);

    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><span class="tag" style="background:' + color.bg + ';color:' + color.text + '">' + escapeHtml(cat.name) + '</span></td>' +
      '<td>' + count + '</td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn edit-btn">Edit</button>' +
      '<button class="icon-btn danger del-btn">Delete</button>' +
      '</td>';

    applyTextDirection(tr.querySelector(".tag"), cat.name);

    tr.querySelector(".edit-btn").addEventListener("click", function () { startEditCategory(cat.id); });
    tr.querySelector(".del-btn").addEventListener("click", function () { deleteCategory(cat.id); });

    list.appendChild(tr);
  });
}

function openCategoryForm() {
  document.getElementById("categoryFormCard").classList.add("open");
  document.getElementById("categoryName").focus();
}

function startEditCategory(id) {
  var cat = categories.find(function (c) { return c.id === id; });
  if (!cat) return;

  document.getElementById("categoryId").value = cat.id;
  document.getElementById("categoryName").value = cat.name;
  applyTextDirection(document.getElementById("categoryName"), cat.name);
  document.getElementById("categoryFormTitle").textContent = "Edit Category";
  document.getElementById("saveCategoryBtn").textContent = "Update Category";
  openCategoryForm();
}

function resetCategoryForm() {
  document.getElementById("categoryForm").reset();
  document.getElementById("categoryId").value = "";
  document.getElementById("categoryFormTitle").textContent = "Add Category";
  document.getElementById("saveCategoryBtn").textContent = "Save Category";
  document.getElementById("categoryFormCard").classList.remove("open");
  applyTextDirection(document.getElementById("categoryName"), "");
}

document.getElementById("addCategoryBtn").addEventListener("click", openCategoryForm);
document.getElementById("closeCategoryFormBtn").addEventListener("click", resetCategoryForm);
document.getElementById("cancelCategoryEditBtn").addEventListener("click", resetCategoryForm);

document.getElementById("categoryName").addEventListener("input", function () {
  applyTextDirection(this, this.value);
});

document.getElementById("categoryForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  var idField = document.getElementById("categoryId").value;
  var name = document.getElementById("categoryName").value.trim();

  if (name === "") {
    showModalStatus("Category name cannot be empty.", false);
    return;
  }

  var duplicate = categories.some(function (c) {
    return c.name.toLowerCase() === name.toLowerCase() && c.id !== idField;
  });
  if (duplicate) {
    showModalStatus("A category with this name already exists.", false);
    return;
  }

  try {
    if (idField) {
      var res = await supabase.from("categories").update({ name: name }).eq("id", idField);
      if (res.error) throw res.error;
      showModalStatus("Category updated successfully.", true);
    } else {
      var newId = "cat-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
      var resAdd = await supabase.from("categories").insert({ id: newId, name: name });
      if (resAdd.error) throw resAdd.error;
      showModalStatus("Category added successfully.", true);
    }
    resetCategoryForm();
  } catch (err) {
    console.error("Save category error:", err);
    showModalStatus("Failed to save category: " + (err.message || "Unknown error"), false);
  }
});

async function deleteCategory(id) {
  var inUse = questions.some(function (q) { return q.categoryId === id; });
  var warning = inUse
    ? "This category has questions in it. Deleting it will also delete all its questions. Continue?"
    : "Delete this category?";

  if (!confirm(warning)) return;

  try {
    await supabase.from("questions").delete().eq("category_id", id);
    var res = await supabase.from("categories").delete().eq("id", id);
    if (res.error) throw res.error;
    if (activeCategoryId === id) activeCategoryId = null;
    showModalStatus("Category deleted.", true);
  } catch (e) {
    console.error("Delete category error:", e);
    showModalStatus("Failed to delete category: " + (e.message || "Unknown error"), false);
  }
}

// Question Management
var manageQuestionFilter = "";

function renderManageQuestionList() {
  var list = document.getElementById("manageQuestionList");
  if (!list) return;
  list.innerHTML = "";

  var filterWords = manageQuestionFilter.trim().toLowerCase().split(/\s+/).filter(Boolean);

  var visible = questions.filter(function (q) {
    if (filterWords.length === 0) return true;
    var cat = categories.find(function (c) { return c.id === q.categoryId; });
    var haystack = [cat ? cat.name : "", q.question, q.answer, (q.keywords || []).join(" ")].join(" ").toLowerCase();
    return filterWords.every(function (w) { return haystack.indexOf(w) !== -1; });
  });

  if (visible.length === 0) {
    list.innerHTML = '<tr><td colspan="3" class="empty-msg">No matching questions found.</td></tr>';
    return;
  }

  visible.forEach(function (q) {
    var cat = categories.find(function (c) { return c.id === q.categoryId; });
    var color = tagColorFor(q.categoryId);

    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><div class="row-title">' + escapeHtml(q.question) + '</div>' +
      '<div class="row-sub">' + escapeHtml((q.answer || "").slice(0, 70)) + ((q.answer || "").length > 70 ? "..." : "") + '</div></td>' +
      '<td><span class="tag" style="background:' + color.bg + ';color:' + color.text + '">' + escapeHtml(cat ? cat.name : "General") + '</span></td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn edit-btn">Edit</button>' +
      '<button class="icon-btn danger del-btn">Delete</button>' +
      '</td>';

    applyTextDirection(tr.querySelector(".row-title"), q.question);
    applyTextDirection(tr.querySelector(".row-sub"), q.answer);

    tr.querySelector(".edit-btn").addEventListener("click", function () { startEditQuestion(q.id); });
    tr.querySelector(".del-btn").addEventListener("click", function () { deleteQuestion(q.id); });

    list.appendChild(tr);
  });
}

document.getElementById("manageQuestionSearch").addEventListener("input", function () {
  manageQuestionFilter = this.value;
  renderManageQuestionList();
});

function openQuestionForm() {
  document.getElementById("questionFormCard").classList.add("open");
  document.getElementById("questionText").focus();
}

function startEditQuestion(id) {
  var q = questions.find(function (item) { return item.id === id; });
  if (!q) return;

  document.getElementById("questionId").value = q.id;
  document.getElementById("questionCategory").value = q.categoryId;
  document.getElementById("questionText").value = q.question;
  document.getElementById("answerText").value = q.answer;
  document.getElementById("keywordsText").value = (q.keywords || []).join(", ");
  applyTextDirection(document.getElementById("questionText"), q.question);
  applyTextDirection(document.getElementById("answerText"), q.answer);

  document.getElementById("questionFormTitle").textContent = "Edit Question";
  document.getElementById("saveQuestionBtn").textContent = "Update Question";
  openQuestionForm();
}

function resetQuestionForm() {
  document.getElementById("questionForm").reset();
  document.getElementById("questionId").value = "";
  document.getElementById("questionFormTitle").textContent = "Add Question";
  document.getElementById("saveQuestionBtn").textContent = "Save Question";
  document.getElementById("questionFormCard").classList.remove("open");
  applyTextDirection(document.getElementById("questionText"), "");
  applyTextDirection(document.getElementById("answerText"), "");
}

["questionText", "answerText"].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", function () {
      applyTextDirection(this, this.value);
    });
  }
});

document.getElementById("addQuestionBtn").addEventListener("click", openQuestionForm);
document.getElementById("closeQuestionFormBtn").addEventListener("click", resetQuestionForm);
document.getElementById("cancelQuestionEditBtn").addEventListener("click", resetQuestionForm);

document.getElementById("questionForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  var idField = document.getElementById("questionId").value;
  var categoryId = document.getElementById("questionCategory").value;
  var questionText = document.getElementById("questionText").value.trim();
  var answerText = document.getElementById("answerText").value.trim();
  var keywords = document.getElementById("keywordsText").value
    .split(",")
    .map(function (k) { return k.trim(); })
    .filter(Boolean);

  if (!categoryId) {
    showModalStatus("Please create and select a category first.", false);
    return;
  }
  if (questionText === "") {
    showModalStatus("Question cannot be empty.", false);
    return;
  }
  if (answerText === "") {
    showModalStatus("Answer cannot be empty.", false);
    return;
  }

  var duplicate = questions.some(function (q) {
    return q.question.toLowerCase() === questionText.toLowerCase() && q.id !== idField;
  });
  if (duplicate) {
    showModalStatus("This question already exists.", false);
    return;
  }

  try {
    var now = new Date().toISOString();
    if (idField) {
      var resUpdate = await supabase.from("questions").update({
        category_id: categoryId,
        question: questionText,
        answer: answerText,
        keywords: keywords,
        updated_at: now
      }).eq("id", idField);
      if (resUpdate.error) throw resUpdate.error;
      showModalStatus("Question updated successfully.", true);
    } else {
      var newId = "q-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
      var resInsert = await supabase.from("questions").insert({
        id: newId,
        category_id: categoryId,
        question: questionText,
        answer: answerText,
        keywords: keywords,
        created_at: now,
        updated_at: now
      });
      if (resInsert.error) throw resInsert.error;
      showModalStatus("Question added successfully.", true);
    }
    resetQuestionForm();
  } catch (err) {
    console.error("Save question error:", err);
    showModalStatus("Failed to save question: " + (err.message || "Unknown error"), false);
  }
});

async function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;

  try {
    var res = await supabase.from("questions").delete().eq("id", id);
    if (res.error) throw res.error;
    if (activeQuestionId === id) activeQuestionId = null;
    showModalStatus("Question deleted.", true);
  } catch (e) {
    console.error("Delete question error:", e);
    showModalStatus("Failed to delete question: " + (e.message || "Unknown error"), false);
  }
}

/* =================================================================
   9. USER MANAGEMENT (ADMIN ONLY VIA SERVERLESS API)
   ================================================================= */

var allUsers = [];

async function loadUsers() {
  if (!isAdmin()) return;

  try {
    var sessionResult = await supabase.auth.getSession();
    if (!sessionResult.data.session) throw new Error("Session expired. Please log in again.");
    var token = sessionResult.data.session.access_token;

    var response = await fetch("/api/admin/users", {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!response.ok) {
      var errData = await response.json();
      throw new Error(errData.error || "Failed to load users");
    }

    var data = await response.json();
    allUsers = data.users || [];
    renderUserList();
    updateUserStats();
  } catch (e) {
    console.error("Load users error:", e);
    showModalStatus("Failed to load users: " + e.message, false);
  }
}

function updateUserStats() {
  document.getElementById("statTotalUsers").textContent = allUsers.length;
  document.getElementById("statActiveUsers").textContent = allUsers.filter(function (u) { return u.status === "active"; }).length;
  document.getElementById("statAdminUsers").textContent = allUsers.filter(function (u) { return u.role === "admin"; }).length;
}

function renderUserList() {
  var list = document.getElementById("manageUserList");
  if (!list) return;
  list.innerHTML = "";

  if (allUsers.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="empty-msg">No users found.</td></tr>';
    return;
  }

  allUsers.forEach(function (user) {
    var isSelf = currentUser && user.id === currentUser.id;
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><div class="row-title">' + escapeHtml(user.name || "Unnamed") + (isSelf ? " (You)" : "") + '</div>' +
      '<div class="row-sub">' + escapeHtml(user.email) + '</div></td>' +
      '<td><span class="badge-role ' + (user.role === "admin" ? "badge-admin" : "badge-staff") + '">' + escapeHtml(user.role) + '</span></td>' +
      '<td><span class="badge-status ' + (user.status === "active" ? "badge-active" : "badge-disabled") + '">' + escapeHtml(user.status) + '</span></td>' +
      '<td>' + formatDate(user.created_at) + '</td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn edit-btn">Edit</button>' +
      (isSelf ? '' : '<button class="icon-btn ' + (user.status === "active" ? "danger" : "success") + ' toggle-status-btn">' + (user.status === "active" ? "Disable" : "Enable") + '</button>') +
      (isSelf ? '' : '<button class="icon-btn danger del-btn">Delete</button>') +
      '</td>';

    tr.querySelector(".edit-btn").addEventListener("click", function () { startEditUser(user); });

    var toggleBtn = tr.querySelector(".toggle-status-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () { toggleUserStatus(user); });
    }

    var delBtn = tr.querySelector(".del-btn");
    if (delBtn) {
      delBtn.addEventListener("click", function () { deleteUser(user); });
    }

    list.appendChild(tr);
  });
}

function openUserForm() {
  document.getElementById("userFormCard").classList.add("open");
  document.getElementById("userName").focus();
}

function startEditUser(user) {
  document.getElementById("editUserId").value = user.id;
  document.getElementById("userName").value = user.name || "";
  document.getElementById("userEmail").value = user.email || "";
  document.getElementById("userEmail").disabled = true;
  document.getElementById("userPassword").value = "";
  document.getElementById("userPassword").required = false;
  document.getElementById("passwordHint").textContent = "Leave blank to keep current password.";
  document.getElementById("userRole").value = user.role || "user";
  
  var statusWrap = document.getElementById("userStatusWrap");
  if (statusWrap) {
    statusWrap.style.display = "block";
    document.getElementById("userStatus").value = user.status || "active";
  }

  document.getElementById("userFormTitle").textContent = "Edit User";
  document.getElementById("saveUserBtn").textContent = "Update User";
  openUserForm();
}

function resetUserForm() {
  document.getElementById("userForm").reset();
  document.getElementById("editUserId").value = "";
  document.getElementById("userEmail").disabled = false;
  document.getElementById("userPassword").required = true;
  document.getElementById("passwordHint").textContent = "Required for new users. Leave blank to keep current password when editing.";
  document.getElementById("userRole").value = "user";
  var statusWrap = document.getElementById("userStatusWrap");
  if (statusWrap) statusWrap.style.display = "none";
  document.getElementById("userFormTitle").textContent = "Create New User";
  document.getElementById("saveUserBtn").textContent = "Create User";
  document.getElementById("userFormCard").classList.remove("open");
}

document.getElementById("addUserBtn").addEventListener("click", openUserForm);
document.getElementById("closeUserFormBtn").addEventListener("click", resetUserForm);
document.getElementById("cancelUserEditBtn").addEventListener("click", resetUserForm);

document.getElementById("userForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  var editId = document.getElementById("editUserId").value;
  var name = document.getElementById("userName").value.trim();
  var email = document.getElementById("userEmail").value.trim();
  var password = document.getElementById("userPassword").value;
  var role = document.getElementById("userRole").value;
  var status = document.getElementById("userStatus") ? document.getElementById("userStatus").value : "active";

  if (!name) {
    showModalStatus("Full Name is required.", false);
    return;
  }
  if (!email) {
    showModalStatus("Email is required.", false);
    return;
  }
  if (!editId && !password) {
    showModalStatus("Password is required for new users.", false);
    return;
  }
  if (password && password.length < 6) {
    showModalStatus("Password must be at least 6 characters.", false);
    return;
  }

  try {
    var tokenResult = await supabase.auth.getSession();
    if (!tokenResult.data.session) throw new Error("Session expired. Please log in again.");
    var token = tokenResult.data.session.access_token;

    if (editId) {
      var body = { userId: editId, name: name, role: role, status: status };
      if (password) body.password = password;

      var response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        var errData = await response.json();
        throw new Error(errData.error || "Failed to update user");
      }

      showModalStatus("User account updated successfully.", true);
    } else {
      var responsePost = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ email: email, password: password, name: name, role: role })
      });

      if (!responsePost.ok) {
        var errDataPost = await responsePost.json();
        throw new Error(errDataPost.error || "Failed to create user");
      }

      showModalStatus("User account created successfully.", true);
    }

    resetUserForm();
    await loadUsers();
  } catch (e) {
    console.error("Save user error:", e);
    showModalStatus("Error: " + e.message, false);
  }
});

async function toggleUserStatus(user) {
  var newStatus = user.status === "active" ? "disabled" : "active";
  var actionText = newStatus === "disabled" ? "disable access for" : "enable access for";
  if (!confirm("Are you sure you want to " + actionText + " '" + (user.name || user.email) + "'?")) return;

  try {
    var sessionResult = await supabase.auth.getSession();
    if (!sessionResult.data.session) throw new Error("Session expired. Please log in again.");
    var token = sessionResult.data.session.access_token;

    var response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ userId: user.id, status: newStatus })
    });

    if (!response.ok) {
      var errData = await response.json();
      throw new Error(errData.error || "Failed to update user status");
    }

    showModalStatus("User account marked as " + newStatus + ".", true);
    await loadUsers();
  } catch (e) {
    console.error("Toggle status error:", e);
    showModalStatus("Failed: " + e.message, false);
  }
}

async function deleteUser(user) {
  if (!confirm("Delete user '" + (user.name || user.email) + "'? This will permanently remove their access.")) return;

  try {
    var delTokenResult = await supabase.auth.getSession();
    if (!delTokenResult.data.session) throw new Error("Session expired. Please log in again.");
    var delToken = delTokenResult.data.session.access_token;

    var response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + delToken
      },
      body: JSON.stringify({ userId: user.id })
    });

    if (!response.ok) {
      var errData = await response.json();
      throw new Error(errData.error || "Failed to delete user");
    }

    showModalStatus("User deleted successfully.", true);
    await loadUsers();
  } catch (e) {
    console.error("Delete user error:", e);
    showModalStatus("Failed to delete user: " + e.message, false);
  }
}

/* =================================================================
   10. DATA EXPORT & BACKUP
   ================================================================= */

document.getElementById("exportBtn").addEventListener("click", function () {
  var data = {
    exportedAt: new Date().toISOString(),
    categories: categories,
    questions: questions
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = "dr-naeem-clinic-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();

  URL.revokeObjectURL(url);
  showBackupStatus("Backup JSON downloaded successfully.", true);
});

/* =================================================================
   11. STATUS HELPERS & UTILITIES
   ================================================================= */

function showModalStatus(message, ok) {
  var el = document.getElementById("modalStatus");
  if (!el) return;
  el.innerHTML = '<div class="status-msg ' + (ok ? "ok" : "err") + '">' + escapeHtml(message) + '</div>';
  setTimeout(function () { el.innerHTML = ""; }, 3500);
}

function showBackupStatus(message, ok) {
  var el = document.getElementById("backupStatus");
  if (!el) return;
  el.innerHTML = '<div class="status-msg ' + (ok ? "ok" : "err") + '">' + escapeHtml(message) + '</div>';
  setTimeout(function () { el.innerHTML = ""; }, 4000);
}

function escapeHtml(str) {
  var div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* =================================================================
   12. LOGIN & LOGOUT EVENT LISTENERS
   ================================================================= */

// Password show/hide toggle
document.getElementById("togglePasswordBtn").addEventListener("click", function () {
  var input = document.getElementById("loginPassword");
  var openIcon = document.getElementById("eyeOpenIcon");
  var closedIcon = document.getElementById("eyeClosedIcon");
  if (input.type === "password") {
    input.type = "text";
    openIcon.style.display = "none";
    closedIcon.style.display = "inline";
  } else {
    input.type = "password";
    openIcon.style.display = "inline";
    closedIcon.style.display = "none";
  }
});

// Login submission
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  var email = document.getElementById("loginEmail").value.trim();
  var password = document.getElementById("loginPassword").value;
  var errorEl = document.getElementById("loginError");
  var btnText = document.getElementById("loginBtnText");
  var btnSpinner = document.getElementById("loginBtnSpinner");
  var submitBtn = document.getElementById("loginSubmitBtn");

  errorEl.style.display = "none";
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnSpinner.style.display = "inline-block";

  try {
    var result = await withTimeout(
      supabase.auth.signInWithPassword({ email: email, password: password }),
      10000,
      "Sign in"
    );

    if (result.error) throw result.error;
    if (result.data && result.data.session) {
      await initializeAuthenticatedApp(result.data.session);
    }
  } catch (err) {
    var message = "Login failed. Please check your credentials.";
    if (err.message) {
      if (err.message.includes("Invalid login")) {
        message = "Invalid email or password.";
      } else if (err.message.includes("Email not confirmed")) {
        message = "Email not confirmed. Please contact your administrator.";
      } else if (err.message.includes("Too many")) {
        message = "Too many login attempts. Please try again later.";
      } else if (err.message.includes("disabled")) {
        message = "Your account has been disabled. Please contact an administrator.";
      } else {
        message = err.message;
      }
    }
    errorEl.textContent = message;
    errorEl.style.display = "block";
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
  }
});

// Logout action
document.getElementById("logoutBtn").addEventListener("click", async function () {
  var btn = document.getElementById("logoutBtn");
  btn.disabled = true;
  btn.textContent = "Signing out...";

  try {
    await withTimeout(signOutSafely(), 5000, "Sign out");
  } catch (e) {
    console.warn("Logout error:", e);
  } finally {
    resetAllAuthAndAppState();
    btn.disabled = false;
    btn.textContent = "Logout";
    showLoginView();
  }
});

/* =================================================================
   13. INITIAL STARTUP & AUTH STATE LISTENER
   ================================================================= */

// Auth state change listener (all events route exclusively to initializeAuthenticatedApp)
supabase.auth.onAuthStateChange(function (event, session) {
  if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session) {
    initializeAuthenticatedApp(session).catch(function (err) {
      console.warn("Auth init failed from " + event + ":", err);
    });
  } else if (event === "SIGNED_OUT") {
    resetAllAuthAndAppState();
    hideStartupLoader();
    hideAppLoading();
    showLoginView();
  }
});

// Initial startup run on page load
(async function start() {
  try {
    var result = await withTimeout(supabase.auth.getSession(), 8000, "Checking active session");
    var session = result && result.data ? result.data.session : null;

    if (session && session.user) {
      await initializeAuthenticatedApp(session);
    } else {
      hideStartupLoader();
      hideAppLoading();
      showLoginView();
    }
  } catch (e) {
    console.warn("Startup session check failed:", e);
    hideStartupLoader();
    hideAppLoading();
    showLoginView("Connection timed out. Please sign in.");
  }
})();
