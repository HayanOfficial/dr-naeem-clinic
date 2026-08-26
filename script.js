

var SUPABASE_URL = "https://ffijqmiaiipohxscpiyv.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaWpxbWlhaWlwb2h4c2NwaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDYzNjYsImV4cCI6MjEwMjgyMjM2Nn0.8Ncr6sT3gnPKgS_pEzDpYgsdiRMqcf8crPbxzvQi7C0";

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =================================================================
   1. DATA MODEL & STATE
   ================================================================= */

var categories = [];
var questions = [];

var activeCategoryId = null;
var activeQuestionId = null;

var currentUser = null;      // Supabase auth user
var currentUserProfile = null; // Profile with role info
var realtimeChannel = null;

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
  return currentUserProfile && currentUserProfile.role === "admin";
}


/* =================================================================
   2. AUTHENTICATION
   ================================================================= */

// Show login, hide app
function showLoginView() {
  document.getElementById("loginView").style.display = "flex";
  document.getElementById("appContainer").style.display = "none";
  var loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.reset();
  var errEl = document.getElementById("loginError");
  if (errEl) errEl.style.display = "none";
  var submitBtn = document.getElementById("loginSubmitBtn");
  if (submitBtn) submitBtn.disabled = false;
  var btnText = document.getElementById("loginBtnText");
  if (btnText) btnText.style.display = "inline";
  var btnSpinner = document.getElementById("loginBtnSpinner");
  if (btnSpinner) btnSpinner.style.display = "none";
}

// Show app, hide login
function showAppView() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appContainer").style.display = "block";
}

// Update header with user info
function updateHeaderUserInfo() {
  if (!currentUserProfile) return;
  document.getElementById("userNameDisplay").textContent =
    currentUserProfile.name || currentUserProfile.email || "User";
  document.getElementById("userRoleDisplay").textContent =
    (currentUserProfile.role || "user").toUpperCase();
}

// Hide/show admin-only UI elements based on role
function applyRoleVisibility() {
  var adminOnly = document.querySelectorAll("[data-admin-only]");
  adminOnly.forEach(function (el) {
    el.style.display = isAdmin() ? "" : "none";
  });

  // "Manage Content" button — only for admins
  var goManageBtn = document.getElementById("goManageBtn");
  if (goManageBtn) {
    goManageBtn.style.display = isAdmin() ? "" : "none";
  }
}

// Login form submission
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
    var result = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      throw result.error;
    }

    // Successfully logged in — onAuthStateChange will handle the rest
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
  } catch (err) {
    var message = "Login failed. Please check your credentials.";
    if (err.message) {
      if (err.message.includes("Invalid login")) {
        message = "Invalid email or password.";
      } else if (err.message.includes("Email not confirmed")) {
        message = "Email not confirmed. Please contact your administrator.";
      } else if (err.message.includes("Too many")) {
        message = "Too many login attempts. Please try again later.";
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

// Show/hide password toggle
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

// Logout
document.getElementById("logoutBtn").addEventListener("click", async function () {
  var btn = document.getElementById("logoutBtn");
  btn.disabled = true;
  btn.textContent = "Signing out...";

  try {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error("Logout timeout")); }, 5000);
      })
    ]);
  } catch (e) {
    console.error("Logout error:", e);
  }

  currentUser = null;
  currentUserProfile = null;
  categories = [];
  questions = [];
  activeCategoryId = null;
  activeQuestionId = null;
  cleanupRealtime();
  btn.disabled = false;
  btn.textContent = "Logout";
  showLoginView();
});

// Auth state change listener
supabase.auth.onAuthStateChange(async function (event, session) {
  try {
    if (event === "SIGNED_IN" && session) {
      currentUser = session.user;
      showAppView();
      // Load profile AND data in parallel
      await Promise.all([loadUserProfile(), loadAllData()]);
      updateHeaderUserInfo();
      applyRoleVisibility();
      setupRealtime();
    } else if (event === "SIGNED_OUT") {
      currentUser = null;
      currentUserProfile = null;
      categories = [];
      questions = [];
      cleanupRealtime();
      showLoginView();
    }
  } catch (e) {
    console.error("Auth state error:", e);
    showLoginView();
  } finally {
    hideAppLoading();
  }
});


/* =================================================================
   3. USER PROFILE
   ================================================================= */

async function loadUserProfile() {
  if (!currentUser) return;
  try {
    var result = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (result.error) {
      console.error("Error loading profile:", result.error);
      currentUserProfile = { id: currentUser.id, role: "user", name: "", email: currentUser.email, status: "active" };
    } else {
      currentUserProfile = result.data;
    }
  } catch (e) {
    console.error("Profile load error:", e);
    currentUserProfile = { id: currentUser.id, role: "user", name: "", email: currentUser.email, status: "active" };
  }
}


/* =================================================================
   4. DATABASE OPERATIONS (Supabase CRUD)
   ================================================================= */

async function loadAllData() {
  try {
    // Load categories AND questions in parallel (much faster)
    var results = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("questions").select("*").order("created_at", { ascending: false })
    ]);

    var catResult = results[0];
    var qResult = results[1];

    if (catResult.error) throw catResult.error;
    categories = catResult.data || [];

    if (qResult.error) throw qResult.error;
    questions = qResult.data || [];

    // Normalize keywords (Supabase returns arrays natively)
    questions = questions.map(function (q) {
      return {
        id: q.id,
        categoryId: q.category_id,
        question: q.question,
        answer: q.answer,
        keywords: Array.isArray(q.keywords) ? q.keywords : [],
        updatedAt: q.updated_at
      };
    });

    refreshEverything();

    if (categories.length > 0) {
      selectCategory(categories[0].id);
    }

    showAssistantView();
  } catch (e) {
    console.error("Error loading data:", e);
    showModalStatus("Failed to load data from cloud. Please refresh.", false);
  }
}

// --- Category CRUD ---

async function dbAddCategory(name) {
  var id = "cat-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
  var result = await supabase
    .from("categories")
    .insert({ id: id, name: name })
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data;
}

async function dbUpdateCategory(id, name) {
  var result = await supabase
    .from("categories")
    .update({ name: name })
    .eq("id", id);
  if (result.error) throw result.error;
}

async function dbDeleteCategory(id) {
  // Delete questions in this category first (RLS cascade may handle this)
  await supabase.from("questions").delete().eq("category_id", id);
  var result = await supabase.from("categories").delete().eq("id", id);
  if (result.error) throw result.error;
}

// --- Question CRUD ---

async function dbAddQuestion(data) {
  var id = "q-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
  var now = new Date().toISOString();
  var result = await supabase
    .from("questions")
    .insert({
      id: id,
      category_id: data.categoryId,
      question: data.question,
      answer: data.answer,
      keywords: data.keywords || [],
      created_at: now,
      updated_at: now
    })
    .select()
    .single();
  if (result.error) throw result.error;
  return result.data;
}

async function dbUpdateQuestion(id, data) {
  var now = new Date().toISOString();
  var result = await supabase
    .from("questions")
    .update({
      category_id: data.categoryId,
      question: data.question,
      answer: data.answer,
      keywords: data.keywords || [],
      updated_at: now
    })
    .eq("id", id);
  if (result.error) throw result.error;
}

async function dbDeleteQuestion(id) {
  var result = await supabase.from("questions").delete().eq("id", id);
  if (result.error) throw result.error;
}


/* =================================================================
   5. REALTIME SUBSCRIPTIONS
   ================================================================= */

function setupRealtime() {
  cleanupRealtime();

  realtimeChannel = supabase
    .channel("db-changes")
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
      if (status === "SUBSCRIBED") {
        badge.classList.add("connected");
        text.textContent = "Live — Connected";
      } else {
        badge.classList.remove("connected");
        text.textContent = "Connecting...";
      }
    });
}

function cleanupRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
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
    if (activeCategoryId === oldRecord.id) activeCategoryId = null;
    refreshEverything();
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
    if (activeQuestionId === oldRecord.id) activeQuestionId = null;
    refreshEverything();
  }
}


/* =================================================================
   6. URDU / RTL HELPERS (preserved from original)
   ================================================================= */

var URDU_SCRIPT_PATTERN = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function isUrduText(str) {
  return URDU_SCRIPT_PATTERN.test(str || "");
}

function applyTextDirection(el, text) {
  if (isUrduText(text != null ? text : el.textContent)) {
    el.setAttribute("dir", "rtl");
    el.classList.add("urdu-text");
  } else {
    el.setAttribute("dir", "ltr");
    el.classList.remove("urdu-text");
  }
}


/* =================================================================
   7. VIEW SWITCHING (preserved from original)
   ================================================================= */

function showAssistantView() {
  document.getElementById("assistantView").classList.add("active");
  document.getElementById("manageView").classList.remove("active");
  document.getElementById("assistantHeaderRight").style.display = isAdmin() ? "flex" : "none";
  document.getElementById("assistantSearchWrap").style.display = "flex";
  document.getElementById("manageHeaderRight").style.display = "none";
  document.getElementById("headerSubtitle").textContent = "Quick answers for phone calls";
}

function showManageView() {
  if (!isAdmin()) return;
  document.getElementById("assistantView").classList.remove("active");
  document.getElementById("manageView").classList.add("active");
  document.getElementById("assistantHeaderRight").style.display = "none";
  document.getElementById("assistantSearchWrap").style.display = "none";
  document.getElementById("manageHeaderRight").style.display = "flex";
  document.getElementById("headerSubtitle").textContent = "Content manager";
}

document.getElementById("goManageBtn").addEventListener("click", showManageView);
document.getElementById("goAssistantBtn").addEventListener("click", showAssistantView);

document.querySelectorAll(".side-nav button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".side-nav button").forEach(function (b) { b.classList.remove("active"); });
    document.querySelectorAll(".manage-pane").forEach(function (p) { p.classList.remove("active"); });
    btn.classList.add("active");
    document.getElementById(btn.dataset.pane).classList.add("active");

    // Load users when switching to users pane
    if (btn.dataset.pane === "pane-users" && isAdmin()) {
      loadUsers();
    }
  });
});

document.getElementById("newEntryBtn").addEventListener("click", function () {
  var activePane = document.querySelector(".manage-pane.active").id;
  if (activePane === "pane-categories") {
    openCategoryForm();
  } else if (activePane === "pane-questions") {
    openQuestionForm();
  } else if (activePane === "pane-users") {
    openUserForm();
  }
});


/* =================================================================
   8. RENDERING - CATEGORY LIST (Assistant View) (preserved)
   ================================================================= */

function renderCategoryList() {
  var list = document.getElementById("categoryList");
  list.innerHTML = "";

  if (categories.length === 0) {
    list.innerHTML = '<li class="empty-msg">No categories yet.</li>';
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

    li.querySelector("button").addEventListener("click", function () { selectCategory(cat.id); });
    list.appendChild(li);
  });
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;
  activeQuestionId = null;
  document.getElementById("searchInput").value = "";
  renderCategoryList();
  renderQuestionList(questions.filter(function (q) { return q.categoryId === categoryId; }));
  renderAnswerPanel(null);

  var cat = categories.find(function (c) { return c.id === categoryId; });
  document.getElementById("questionListTitle").textContent = cat ? cat.name + " Questions" : "Questions";
}


/* =================================================================
   9. RENDERING - QUESTION LIST (Assistant View) (preserved)
   ================================================================= */

function renderQuestionList(list) {
  var container = document.getElementById("questionList");
  container.innerHTML = "";
  document.getElementById("questionCountBadge").textContent = list.length + (list.length === 1 ? " item" : " items");

  if (list.length === 0) {
    container.innerHTML = '<li class="empty-msg">No matching question found.</li>';
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
    btn.querySelector(".q-text").classList.toggle("urdu-text", isUrduText(q.question));

    btn.addEventListener("click", function () {
      activeQuestionId = q.id;
      renderAnswerPanel(q);
      document.querySelectorAll(".question-item button").forEach(function (b) { b.classList.remove("selected"); });
      this.classList.add("selected");
      document.getElementById("answerPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    container.appendChild(li);
  });
}


/* =================================================================
   10. RENDERING - ANSWER PANEL (Assistant View) (preserved)
   ================================================================= */

function renderAnswerPanel(question) {
  var panel = document.getElementById("answerPanel");

  if (!question) {
    panel.innerHTML = '<div class="placeholder">Select a question to see the approved answer.</div>';
    return;
  }

  var cat = categories.find(function (c) { return c.id === question.categoryId; });
  var color = tagColorFor(question.categoryId);

  panel.innerHTML =
    '<div class="answer-panel-inner">' +
    '  <div class="answer-top">' +
    '    <span class="tag" style="background:' + color.bg + ';color:' + color.text + '">' + escapeHtml(cat ? cat.name : "Uncategorized") + '</span>' +
    '    <button class="copy-btn" id="copyAnswerBtn">Copy Answer</button>' +
    '  </div>' +
    '  <div class="answer-question"></div>' +
    '  <div class="answer-text"></div>' +
    '  <div class="answer-footer">' +
    '    <span>Last updated: ' + escapeHtml(formatDate(question.updatedAt) || "—") + '</span>' +
    (isAdmin() ? '    <a href="#" id="editFromAssistantLink">Edit this answer</a>' : '') +
    '  </div>' +
    '</div>';

  panel.querySelector(".answer-question").textContent = question.question;
  panel.querySelector(".answer-text").textContent = question.answer;
  applyTextDirection(panel.querySelector(".answer-question"), question.question);
  applyTextDirection(panel.querySelector(".answer-text"), question.answer);

  document.getElementById("copyAnswerBtn").addEventListener("click", function () {
    copyToClipboard(question.answer, this);
  });

  var editLink = document.getElementById("editFromAssistantLink");
  if (editLink) {
    editLink.addEventListener("click", function (e) {
      e.preventDefault();
      showManageView();
      document.querySelector('.side-nav button[data-pane="pane-questions"]').click();
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
    }, 1500);
  }).catch(function () {
    alert("Could not copy automatically. Please select and copy the text manually.");
  });
}


/* =================================================================
   11. SEARCH (Assistant View) (preserved)
   ================================================================= */

function runSearch(term) {
  var q = term.trim().toLowerCase();

  if (q === "") {
    if (activeCategoryId) {
      selectCategory(activeCategoryId);
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
      (item.keywords || []).join(" ")
    ].join(" ").toLowerCase();

    return words.every(function (w) { return haystack.indexOf(w) !== -1; });
  });

  activeCategoryId = null;
  renderCategoryList();
  document.getElementById("questionListTitle").textContent = 'Results for "' + term + '"';
  renderQuestionList(results);
  renderAnswerPanel(null);
}

document.getElementById("searchInput").addEventListener("input", function () {
  runSearch(this.value);
});


/* =================================================================
   12. MANAGE - CATEGORIES (preserved + Supabase)
   ================================================================= */

function refreshCategorySelect() {
  var select = document.getElementById("questionCategory");
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
}

async function deleteCategory(id) {
  var inUse = questions.some(function (q) { return q.categoryId === id; });

  var warning = inUse
    ? "This category has questions in it. Deleting it will also delete those questions. Continue?"
    : "Delete this category?";

  if (!confirm(warning)) return;

  try {
    await dbDeleteCategory(id);
    if (activeCategoryId === id) activeCategoryId = null;
    showModalStatus("Category deleted.", true);
  } catch (e) {
    console.error("Delete category error:", e);
    showModalStatus("Failed to delete category: " + (e.message || "Unknown error"), false);
  }
}

document.getElementById("addCategoryBtn").addEventListener("click", openCategoryForm);
document.getElementById("closeCategoryFormBtn").addEventListener("click", resetCategoryForm);
document.getElementById("cancelCategoryEditBtn").addEventListener("click", resetCategoryForm);

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
      await dbUpdateCategory(idField, name);
      showModalStatus("Category updated.", true);
    } else {
      await dbAddCategory(name);
      showModalStatus("Category added.", true);
    }
    resetCategoryForm();
  } catch (e) {
    console.error("Save category error:", e);
    showModalStatus("Failed to save category: " + (e.message || "Unknown error"), false);
  }
});


/* =================================================================
   13. MANAGE - QUESTIONS (preserved + Supabase)
   ================================================================= */

var manageQuestionFilter = "";

function renderManageQuestionList() {
  var list = document.getElementById("manageQuestionList");
  list.innerHTML = "";

  var filterWords = manageQuestionFilter.trim().toLowerCase().split(/\s+/).filter(Boolean);

  var visible = questions.filter(function (q) {
    if (filterWords.length === 0) return true;
    var cat = categories.find(function (c) { return c.id === q.categoryId; });
    var haystack = [cat ? cat.name : "", q.question, (q.keywords || []).join(" ")].join(" ").toLowerCase();
    return filterWords.every(function (w) { return haystack.indexOf(w) !== -1; });
  });

  if (visible.length === 0) {
    list.innerHTML = '<tr><td colspan="3" class="empty-msg">No matching question found.</td></tr>';
    return;
  }

  visible.forEach(function (q) {
    var cat = categories.find(function (c) { return c.id === q.categoryId; });
    var color = tagColorFor(q.categoryId);

    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><div class="row-title">' + escapeHtml(q.question) + '</div>' +
      '<div class="row-sub">' + escapeHtml((q.answer || "").slice(0, 70)) + ((q.answer || "").length > 70 ? "..." : "") + '</div></td>' +
      '<td><span class="tag" style="background:' + color.bg + ';color:' + color.text + '">' + escapeHtml(cat ? cat.name : "Uncategorized") + '</span></td>' +
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

// Auto-detect Urdu in question/answer fields while typing
["questionText", "answerText"].forEach(function (id) {
  document.getElementById(id).addEventListener("input", function () {
    applyTextDirection(this, this.value);
  });
});

async function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;

  try {
    await dbDeleteQuestion(id);
    if (activeQuestionId === id) activeQuestionId = null;
    showModalStatus("Question deleted.", true);
  } catch (e) {
    console.error("Delete question error:", e);
    showModalStatus("Failed to delete question: " + (e.message || "Unknown error"), false);
  }
}

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
    showModalStatus("Please add a category first.", false);
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
    if (idField) {
      await dbUpdateQuestion(idField, {
        categoryId: categoryId,
        question: questionText,
        answer: answerText,
        keywords: keywords
      });
      showModalStatus("Question updated.", true);
    } else {
      await dbAddQuestion({
        categoryId: categoryId,
        question: questionText,
        answer: answerText,
        keywords: keywords
      });
      showModalStatus("Question added.", true);
    }
    resetQuestionForm();
  } catch (e) {
    console.error("Save question error:", e);
    showModalStatus("Failed to save question: " + (e.message || "Unknown error"), false);
  }
});


/* =================================================================
   14. MANAGE - USERS (Admin only)
   ================================================================= */

var allUsers = [];

async function loadUsers() {
  if (!isAdmin()) return;

  try {
    var sessionResult = await supabase.auth.getSession();
    if (!sessionResult.data.session) throw new Error("Session expired. Please log in again.");
    var response = await fetch("/api/admin/users", {
      headers: {
        "Authorization": "Bearer " + sessionResult.data.session.access_token
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
  list.innerHTML = "";

  if (allUsers.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="empty-msg">No users found.</td></tr>';
    return;
  }

  allUsers.forEach(function (user) {
    var isSelf = currentUser && user.id === currentUser.id;
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><div class="row-title">' + escapeHtml(user.name || "Unnamed") + '</div>' +
      '<div class="row-sub">' + escapeHtml(user.email) + '</div></td>' +
      '<td><span class="badge-role ' + (user.role === "admin" ? "badge-admin" : "badge-staff") + '">' + escapeHtml(user.role) + '</span></td>' +
      '<td><span class="badge-status ' + (user.status === "active" ? "badge-active" : "badge-disabled") + '">' + escapeHtml(user.status) + '</span></td>' +
      '<td>' + formatDate(user.created_at) + '</td>' +
      '<td class="row-actions">' +
      '<button class="icon-btn edit-btn">Edit</button>' +
      (isSelf ? '' : '<button class="icon-btn danger del-btn">Delete</button>') +
      '</td>';

    tr.querySelector(".edit-btn").addEventListener("click", function () { startEditUser(user); });
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

  if (!name) {
    showModalStatus("Name is required.", false);
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
      // Update existing user
      var body = { userId: editId, name: name, role: role };
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

      showModalStatus("User updated successfully.", true);
    } else {
      // Create new user
      var response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ email: email, password: password, name: name, role: role })
      });

      if (!response.ok) {
        var errData = await response.json();
        throw new Error(errData.error || "Failed to create user");
      }

      showModalStatus("User created successfully.", true);
    }

    resetUserForm();
    await loadUsers();
  } catch (e) {
    console.error("Save user error:", e);
    showModalStatus("Failed: " + e.message, false);
  }
});

async function deleteUser(user) {
  if (!confirm("Delete user '" + (user.name || user.email) + "'? This cannot be undone.")) return;

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

    showModalStatus("User deleted.", true);
    await loadUsers();
  } catch (e) {
    console.error("Delete user error:", e);
    showModalStatus("Failed: " + e.message, false);
  }
}


/* =================================================================
   15. EXPORT/BACKUP (Admin only)
   ================================================================= */

document.getElementById("exportBtn").addEventListener("click", function () {
  var data = { categories: categories, questions: questions };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = "eye-clinic-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();

  URL.revokeObjectURL(url);
  showBackupStatus("Backup file downloaded.", true);
});


/* =================================================================
   16. STATUS MESSAGES & HELPERS
   ================================================================= */

function showModalStatus(message, ok) {
  var el = document.getElementById("modalStatus");
  el.innerHTML = '<div class="status-msg ' + (ok ? "ok" : "err") + '">' + escapeHtml(message) + '</div>';
  setTimeout(function () { el.innerHTML = ""; }, 3000);
}

function showBackupStatus(message, ok) {
  var el = document.getElementById("backupStatus");
  el.innerHTML = '<div class="status-msg ' + (ok ? "ok" : "err") + '">' + escapeHtml(message) + '</div>';
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

function makeId(prefix) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
}

function showAppLoading() {
  var overlay = document.getElementById("appLoadingOverlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideAppLoading() {
  var overlay = document.getElementById("appLoadingOverlay");
  if (overlay) overlay.classList.add("hidden");
}

function refreshEverything() {
  renderCategoryList();
  refreshCategorySelect();
  renderManageCategoryList();
  renderManageQuestionList();

  if (activeCategoryId) {
    selectCategory(activeCategoryId);
  } else {
    renderQuestionList([]);
    renderAnswerPanel(null);
    document.getElementById("questionListTitle").textContent = "Questions";
  }
}


/* =================================================================
   17. STARTUP
   ================================================================= */

function hideStartupLoader() {
  var el = document.getElementById("startupLoader");
  if (el) el.style.display = "none";
}

(async function start() {
  // Safety net: if everything hangs, show login after 12 seconds
  var safetyTimeout = setTimeout(function () {
    console.warn("Startup safety net triggered");
    hideStartupLoader();
    hideAppLoading();
    showLoginView();
  }, 12000);

  try {
    // getSession() is instant — reads from browser storage
    var result = await supabase.auth.getSession();
    var session = result.data.session;

    if (session && session.user) {
      currentUser = session.user;
      showAppView();
      hideStartupLoader();

      try {
        // Load profile AND data in parallel — cuts wait in half
        await Promise.all([loadUserProfile(), loadAllData()]);
        updateHeaderUserInfo();
        applyRoleVisibility();
        setupRealtime();
      } catch (loadErr) {
        console.error("Session load failed, signing out:", loadErr);
        try {
          await Promise.race([
            supabase.auth.signOut(),
            new Promise(function (_, rej) { setTimeout(function () { rej(new Error("signOut timeout")); }, 5000); })
          ]);
        } catch (_) {}
        currentUser = null;
        currentUserProfile = null;
        hideStartupLoader();
        hideAppLoading();
        showLoginView();
      }
    } else {
      hideStartupLoader();
      hideAppLoading();
      showLoginView();
    }
  } catch (e) {
    console.error("Startup error:", e);
    hideStartupLoader();
    hideAppLoading();
    showLoginView();
  } finally {
    clearTimeout(safetyTimeout);
    hideAppLoading();
  }
})();
