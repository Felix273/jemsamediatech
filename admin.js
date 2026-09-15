(function () {
  const config = window.JEMSA_CMS_CONFIG || {};
  const defaults = window.JEMSA_DEFAULT_CONTENT || {};

  // DOM Elements
  const setupPanel = document.getElementById("setupPanel");
  const authPanel = document.getElementById("authPanel");
  const dashboard = document.getElementById("dashboard");
  const authStatus = document.getElementById("authStatus");
  const grid = document.getElementById("editorGrid");
  const nav = document.getElementById("sectionNav");
  const activeSectionId = document.getElementById("activeSectionId");
  const activeSectionTitle = document.getElementById("activeSectionTitle");
  const activeSectionHelp = document.getElementById("activeSectionHelp");
  const supabaseStatusBadge = document.getElementById("supabaseStatusBadge");
  const toastContainer = document.getElementById("toastContainer");
  const globalInlineFileInput = document.getElementById("globalInlineFileInput");
  const mediaLibraryPanel = document.getElementById("mediaLibraryPanel");
  const recentUploadsGrid = document.getElementById("recentUploadsGrid");

  const saveCurrentBtn = document.getElementById("saveCurrentBtn");
  const resetCurrentBtn = document.getElementById("resetCurrentBtn");

  let activeInlineTargetInput = null;
  let activeInlinePreviewImg = null;

  const sections = [
    ["site_settings", "Site Settings", "Global contact details, footer copy, and shared business information."],
    ["homepage", "Homepage", "Hero messaging, background visual, intro story, and section headings."],
    ["about", "About Page", "About page hero, company story section, long-form copy, and story imagery."],
    ["subsidiaries", "Subsidiaries Page", "Subsidiary page hero and page-level messaging."],
    ["work", "Work Page", "Work gallery page hero and intro messaging."],
    ["contact", "Contact Page", "Contact page hero copy and lead-in text."],
    ["campaigns", "Campaign Case Studies", "Manage campaign cards, featured projects, and rich case study details."],
    ["partners", "Partner Brands", "Brand partner logos, names, and links."],
    ["industries", "Industries Served", "Industry sector icons and row ordering."],
    ["media", "Media Library", "Upload and browse uploaded media assets directly."]
  ];

  const objectSchemas = {
    site_settings: [
      ["email", "Email Address", "email"],
      ["phone", "Phone Number", "text"],
      ["whatsapp", "WhatsApp Direct Link", "url"],
      ["location", "Physical Location", "text"],
      ["footerBrandLine", "Footer Brand Line", "textarea"],
      ["footerTagline", "Footer Tagline", "text"]
    ],
    homepage: [
      ["heroKicker", "Hero Kicker", "text"],
      ["heroTitle", "Hero Title", "textarea"],
      ["heroBody", "Hero Body Text", "textarea"],
      ["heroImage", "Hero Background Image", "image"],
      ["introLabel", "Intro Label", "text"],
      ["introTitle", "Intro Title", "textarea"],
      ["introLead", "Intro Lead Paragraph", "textarea"],
      ["companiesLabel", "Companies Label", "text"],
      ["companiesTitle", "Companies Title", "textarea"],
      ["workLabel", "Work Label", "text"],
      ["workTitle", "Work Title", "textarea"],
      ["industriesLabel", "Industries Label", "text"],
      ["industriesTitle", "Industries Title", "textarea"],
      ["partnersLabel", "Partners Label", "text"],
      ["ctaTitle", "CTA Section Title", "textarea"],
      ["ctaBody", "CTA Section Body", "textarea"]
    ],
    about: [
      ["heroLabel", "Hero Label", "text"],
      ["heroTitle", "Hero Title", "textarea"],
      ["heroLead", "Hero Lead Paragraph", "textarea"],
      ["storyLabel", "Story Label", "text"],
      ["storyTitle", "Story Title", "textarea"],
      ["storyLead", "Story Lead Paragraph", "textarea"],
      ["storyBody", "Story Body Copy", "textarea"],
      ["storyImage", "Story Image", "image"],
      ["storyImageAlt", "Story Image Alt Text", "text"]
    ],
    subsidiaries: [
      ["heroLabel", "Hero Label", "text"],
      ["heroTitle", "Hero Title", "textarea"],
      ["heroLead", "Hero Lead Paragraph", "textarea"]
    ],
    work: [
      ["heroLabel", "Hero Label", "text"],
      ["heroTitle", "Hero Title", "textarea"],
      ["heroLead", "Hero Lead Paragraph", "textarea"]
    ],
    contact: [
      ["heroLabel", "Hero Label", "text"],
      ["heroTitle", "Hero Title", "textarea"],
      ["heroLead", "Hero Lead Paragraph", "textarea"]
    ]
  };

  const collectionSchemas = {
    campaigns: {
      singular: "Campaign",
      empty: { id: "", title: "", client: "", category: "", image: "", alt: "", featured: false, wide: false, channels: "", summary: "", brief: "", insight: "", thinking: "", ideaTitle: "", idea: "", execution: "", results: "", next: "" },
      fields: [
        ["id", "Campaign ID / Slug", "text"],
        ["title", "Campaign Title", "text"],
        ["client", "Client Name", "text"],
        ["category", "Category", "text"],
        ["image", "Campaign Main Image", "image"],
        ["alt", "Image Alt Text", "text"],
        ["featured", "Show on Homepage", "checkbox"],
        ["wide", "Wide Layout Card", "checkbox"],
        ["channels", "Channels", "text"],
        ["summary", "Summary Line", "textarea"],
        ["brief", "01. Brief / Challenge", "textarea"],
        ["insight", "02. Audience Insight", "textarea"],
        ["thinking", "03. Strategic Thinking", "textarea"],
        ["ideaTitle", "04. Idea Headline", "text"],
        ["idea", "04. Creative Idea", "textarea"],
        ["execution", "05. Execution", "textarea"],
        ["results", "05. Results & Metrics", "textarea"],
        ["next", "Next Campaign ID", "text"]
      ]
    },
    partners: {
      singular: "Partner Brand",
      empty: { name: "", logo: "", url: "" },
      fields: [
        ["name", "Brand Name", "text"],
        ["logo", "Brand Logo Image", "image"],
        ["url", "Website Link", "url"]
      ]
    },
    industries: {
      singular: "Industry",
      empty: { name: "", icon: "", row: "1" },
      fields: [
        ["name", "Industry Name", "text"],
        ["icon", "Icon Asset", "image"],
        ["row", "Row Number", "text"]
      ]
    }
  };

  const base = config.supabaseUrl?.replace(/\/$/, "");
  let session = JSON.parse(sessionStorage.getItem("jemsa_admin_session") || "null");
  let isDemoMode = false;
  let localContentMap = { ...defaults };
  let activeId = sections[0][0];
  let recentUploads = [];

  // Toast helper
  function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span><div>${message}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Update connection status badge
  function updateConnectionBadge() {
    if (isDemoMode) {
      supabaseStatusBadge.className = "status-badge offline";
      supabaseStatusBadge.textContent = "Demo / Offline Mode";
    } else if (config.enabled && base && config.anonKey) {
      supabaseStatusBadge.className = "status-badge online";
      supabaseStatusBadge.textContent = "Connected to Supabase";
    } else {
      supabaseStatusBadge.className = "status-badge offline";
      supabaseStatusBadge.textContent = "Supabase Not Configured";
    }
  }

  function saveSession(nextSession) {
    session = nextSession;
    if (session?.expires_in && !session.expires_at) {
      session.expires_at = Math.floor(Date.now() / 1000) + Number(session.expires_in);
    }
    sessionStorage.setItem("jemsa_admin_session", JSON.stringify(session));
  }

  function clearSession() {
    session = null;
    sessionStorage.removeItem("jemsa_admin_session");
  }

  function sessionExpiresSoon() {
    const expiresAt = Number(session?.expires_at || 0);
    return Boolean(expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60);
  }

  async function refreshSession() {
    if (isDemoMode) return;
    if (!session?.refresh_token) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    const res = await fetch(base + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (e) {}
    if (!res.ok) throw new Error(data.error_description || data.msg || text || "Session refresh failed");
    saveSession(data);
    return data;
  }

  async function ensureFreshSession() {
    if (!isDemoMode && sessionExpiresSoon()) {
      await refreshSession();
    }
  }

  async function request(path, options = {}) {
    if (isDemoMode) return null;
    await ensureFreshSession();
    const res = await fetch(base + path, {
      ...options,
      headers: {
        apikey: config.anonKey,
        Authorization: "Bearer " + (session?.access_token || config.anonKey),
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || res.statusText);
    if (res.status === 204 || !body.trim()) return null;
    try { return JSON.parse(body); } catch (e) { return null; }
  }

  async function login(email, password) {
    if (isDemoMode) return;
    const res = await fetch(base + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.error_description || data.msg || text || "Login failed");
    saveSession(data);
  }

  // Upload file helper
  async function uploadFileToSupabase(file, path) {
    if (isDemoMode || !config.enabled || !base) {
      // Return local object URL for demo mode
      const localUrl = URL.createObjectURL(file);
      recentUploads.unshift({ name: file.name, path, url: localUrl });
      renderRecentUploads();
      return localUrl;
    }

    await ensureFreshSession();
    const bucket = config.mediaBucket || "site-media";
    const cleanPath = path.replace(/^\/+/, "");
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${encodeURIComponent(cleanPath).replace(/%2F/g, "/")}`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true"
      },
      body: file
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Upload failed");
    }
    const publicUrl = `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
    recentUploads.unshift({ name: file.name, path: cleanPath, url: publicUrl });
    renderRecentUploads();
    return publicUrl;
  }

  function renderRecentUploads() {
    if (!recentUploadsGrid) return;
    if (!recentUploads.length) {
      recentUploadsGrid.innerHTML = '<p class="empty-hint">No uploads in this session yet.</p>';
      return;
    }
    recentUploadsGrid.innerHTML = recentUploads.map(item => `
      <div class="recent-upload-card">
        <img src="${item.url}" alt="${item.name}" onerror="this.src='assets/favicon.png'">
        <span>${item.name}</span>
        <button type="button" class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${item.url}'); showToast('URL copied!', 'success')">Copy Link</button>
      </div>
    `).join("");
  }

  // Handle Global Inline File Selection
  globalInlineFileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeInlineTargetInput) return;
    showToast("Uploading image...", "info");
    try {
      const defaultPath = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const url = await uploadFileToSupabase(file, defaultPath);
      activeInlineTargetInput.value = url;
      if (activeInlinePreviewImg) {
        activeInlinePreviewImg.src = url;
        activeInlinePreviewImg.parentElement.classList.remove("empty");
      }
      showToast("Image uploaded successfully!", "success");
    } catch (err) {
      showToast("Upload error: " + err.message, "error");
    } finally {
      globalInlineFileInput.value = "";
    }
  });

  // UI Control
  function showDashboard() {
    if (authPanel) authPanel.hidden = true;
    if (setupPanel) setupPanel.hidden = true;
    if (dashboard) dashboard.hidden = false;
    updateConnectionBadge();
    loadContent();
  }

  function showLogin() {
    if (authPanel) authPanel.hidden = false;
    if (dashboard) dashboard.hidden = true;
    updateConnectionBadge();
  }

  async function loadContent() {
    grid.innerHTML = "";
    nav.innerHTML = "";

    let map = { ...defaults };

    if (!isDemoMode && config.enabled && base) {
      try {
        const rows = await request("/rest/v1/site_content?select=id,content&id=in.(" + sections.map(s => s[0]).join(",") + ")");
        if (rows && rows.length) {
          rows.forEach(r => { map[r.id] = r.content || {}; });
        }
      } catch (err) {
        showToast("Using default content: " + err.message, "warning");
      }
    }
    localContentMap = map;

    sections.forEach((section, index) => {
      const [id, label, help] = section;
      renderTab(id, label, index);
      if (id !== "media") {
        renderEditor(id, label, help, map[id] || defaults[id] || {});
      }
    });

    activateSection(activeId);
  }

  function renderTab(id, label, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-tab";
    button.dataset.section = id;
    button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><b>${label}</b>`;
    button.addEventListener("click", () => activateSection(id));
    nav.appendChild(button);
  }

  function activateSection(id) {
    activeId = id;
    const section = sections.find(item => item[0] === id) || sections[0];
    activeSectionId.textContent = id.toUpperCase();
    activeSectionTitle.textContent = section[1];
    activeSectionHelp.textContent = section[2];

    document.querySelectorAll(".section-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.section === id));

    if (id === "media") {
      mediaLibraryPanel.hidden = false;
      document.querySelectorAll(".editor-card").forEach(card => card.classList.remove("active"));
    } else {
      mediaLibraryPanel.hidden = true;
      document.querySelectorAll(".editor-card").forEach(card => card.classList.toggle("active", card.dataset.section === id));
    }
  }

  function makeField(key, label, type, value) {
    if (type === "image") {
      const wrapper = document.createElement("div");
      wrapper.className = "image-field-wrapper";
      wrapper.dataset.key = key;

      const val = value ?? "";

      wrapper.innerHTML = `
        <div class="image-field-top">
          <div class="image-field-input-group">
            <label class="form-label">
              <span>${label}</span>
              <input type="text" class="image-url-input" value="${val}" placeholder="https:// or assets/...">
            </label>
          </div>
          <div class="image-field-actions">
            <button type="button" class="btn btn-secondary btn-upload-inline">📁 Pick / Upload Image</button>
          </div>
        </div>
        <div class="image-preview-box ${!val ? "empty" : ""}">
          ${val ? `<img src="${val}" alt="Preview" onerror="this.parentElement.classList.add('empty')">` : ""}
        </div>
      `;

      const input = wrapper.querySelector(".image-url-input");
      const previewBox = wrapper.querySelector(".image-preview-box");
      const uploadBtn = wrapper.querySelector(".btn-upload-inline");

      input.addEventListener("input", () => {
        const url = input.value.trim();
        if (url) {
          previewBox.classList.remove("empty");
          previewBox.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.classList.add('empty')">`;
        } else {
          previewBox.classList.add("empty");
          previewBox.innerHTML = "";
        }
      });

      uploadBtn.addEventListener("click", () => {
        activeInlineTargetInput = input;
        activeInlinePreviewImg = previewBox.querySelector("img");
        globalInlineFileInput.click();
      });

      if (key === "storyImage") {
        const guide = document.createElement("div");
        guide.className = "image-upload-guide";
        guide.innerHTML = "💡 <strong>Recommended size:</strong> 900 × 1057 px (Aspect ratio ~ 6:7 portrait).";
        wrapper.appendChild(guide);
      } else if (key === "heroImage") {
        const guide = document.createElement("div");
        guide.className = "image-upload-guide";
        guide.innerHTML = "💡 <strong>Recommended size:</strong> 1800 × 1200 px (3:2 landscape hero).";
        wrapper.appendChild(guide);
      }

      return wrapper;
    }

    const wrapper = document.createElement("label");
    wrapper.className = type === "checkbox" ? "form-check" : "form-field";
    wrapper.dataset.key = key;

    const labelText = document.createElement("span");
    labelText.textContent = label;

    let input;
    if (type === "textarea") {
      input = document.createElement("textarea");
      input.value = value ?? "";
    } else {
      input = document.createElement("input");
      input.type = type === "checkbox" ? "checkbox" : type;
      if (type === "checkbox") input.checked = Boolean(value);
      else input.value = value ?? "";
    }

    if (type === "checkbox") {
      wrapper.append(input, labelText);
    } else {
      wrapper.append(labelText, input);
    }

    return wrapper;
  }

  function renderObjectForm(container, schema, content) {
    const form = document.createElement("div");
    form.className = "field-grid";
    schema.forEach(([key, label, type]) => {
      form.appendChild(makeField(key, label, type, content?.[key]));
    });
    container.appendChild(form);
  }

  function renderCollectionItem(list, schema, item = {}, index = 0) {
    const card = document.createElement("section");
    card.className = "collection-item";
    card.innerHTML = `
      <div class="collection-item-header">
        <div>
          <span class="eyebrow">${schema.singular} #${index + 1}</span>
          <h4>${item.title || item.name || item.id || "Untitled"}</h4>
        </div>
        <button type="button" class="btn btn-sm btn-ghost text-danger" data-remove>Remove</button>
      </div>
      <div class="field-grid"></div>
    `;
    const fields = card.querySelector(".field-grid");
    schema.fields.forEach(([key, label, type]) => fields.appendChild(makeField(key, label, type, item?.[key])));
    card.querySelector("[data-remove]").addEventListener("click", () => {
      card.remove();
      showToast(`${schema.singular} removed`, "info");
    });
    list.appendChild(card);
  }

  function renderCollectionForm(container, id, items) {
    const schema = collectionSchemas[id];
    const toolbar = document.createElement("div");
    toolbar.className = "collection-toolbar";
    toolbar.innerHTML = `
      <p>Manage repeatable ${schema.singular.toLowerCase()} items. Add new entries or edit existing items below.</p>
      <button type="button" class="btn btn-secondary">＋ Add ${schema.singular}</button>
    `;
    const list = document.createElement("div");
    list.className = "collection-list";
    (Array.isArray(items) ? items : []).forEach((item, index) => renderCollectionItem(list, schema, item, index));
    toolbar.querySelector("button").addEventListener("click", () => {
      renderCollectionItem(list, schema, { ...schema.empty }, list.children.length);
      showToast(`New ${schema.singular} added`, "info");
    });
    container.append(toolbar, list);
  }

  function collectObject(card, schema) {
    return schema.reduce((acc, [key, , type]) => {
      let input;
      if (type === "image") {
        input = card.querySelector(`[data-key="${key}"] .image-url-input`);
        acc[key] = input?.value || "";
      } else {
        input = card.querySelector(`[data-key="${key}"] input,[data-key="${key}"] textarea`);
        acc[key] = type === "checkbox" ? Boolean(input?.checked) : (input?.value || "");
      }
      return acc;
    }, {});
  }

  function collectCollection(card, id) {
    const schema = collectionSchemas[id];
    return [...card.querySelectorAll(".collection-item")].map(item => {
      return schema.fields.reduce((acc, [key, , type]) => {
        let input;
        if (type === "image") {
          input = item.querySelector(`[data-key="${key}"] .image-url-input`);
          acc[key] = input?.value || "";
        } else {
          input = item.querySelector(`[data-key="${key}"] input,[data-key="${key}"] textarea`);
          acc[key] = type === "checkbox" ? Boolean(input?.checked) : (input?.value || "");
        }
        return acc;
      }, {});
    });
  }

  function getContentFromForm(card, id) {
    if (objectSchemas[id]) return collectObject(card, objectSchemas[id]);
    if (collectionSchemas[id]) return collectCollection(card, id);
    return {};
  }

  function hydrateForm(card, id, content) {
    const formHost = card.querySelector("[data-form-host]");
    formHost.innerHTML = "";
    if (objectSchemas[id]) renderObjectForm(formHost, objectSchemas[id], content || {});
    else if (collectionSchemas[id]) renderCollectionForm(formHost, id, Array.isArray(content) ? content : []);
  }

  function renderEditor(id, label, help, content) {
    const card = document.createElement("article");
    card.className = "editor-card";
    card.dataset.section = id;
    card.innerHTML = `<div data-form-host></div>`;
    hydrateForm(card, id, content);
    grid.appendChild(card);
  }

  // Save current active section content
  saveCurrentBtn?.addEventListener("click", async () => {
    if (activeId === "media") return;
    const activeCard = grid.querySelector(`.editor-card[data-section="${activeId}"]`);
    if (!activeCard) return;

    const parsed = getContentFromForm(activeCard, activeId);
    showToast("Saving changes...", "info");

    if (isDemoMode || !config.enabled || !base) {
      localContentMap[activeId] = parsed;
      showToast("Saved locally (Demo Mode)", "success");
      return;
    }

    try {
      await request("/rest/v1/site_content", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ id: activeId, content: parsed })
      });
      localContentMap[activeId] = parsed;
      showToast("Changes published to live site!", "success");
    } catch (err) {
      showToast("Save failed: " + err.message, "error");
    }
  });

  // Reset current active section to defaults
  resetCurrentBtn?.addEventListener("click", () => {
    if (activeId === "media") return;
    const activeCard = grid.querySelector(`.editor-card[data-section="${activeId}"]`);
    if (!activeCard) return;

    const defaultVal = defaults[activeId] || collectionSchemas[activeId]?.empty || {};
    hydrateForm(activeCard, activeId, defaultVal);
    showToast("Reset to default values. Click Save to publish.", "warning");
  });

  // Setup panel & Demo login handlers
  document.getElementById("continueLocalBtn")?.addEventListener("click", () => {
    isDemoMode = true;
    showDashboard();
    showToast("Entered Demo/Local CMS Mode", "info");
  });

  document.getElementById("demoLoginBtn")?.addEventListener("click", () => {
    isDemoMode = true;
    showDashboard();
    showToast("Signed in using Enterprise Demo Access", "success");
  });

  document.getElementById("loginForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    if (authStatus) authStatus.textContent = "Signing in...";
    try {
      await login(document.getElementById("adminEmail").value, document.getElementById("adminPassword").value);
      if (authStatus) authStatus.textContent = "";
      showDashboard();
      showToast("Signed in successfully", "success");
    } catch (error) {
      if (authStatus) authStatus.textContent = error.message;
      showToast("Sign in failed: " + error.message, "error");
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    clearSession();
    isDemoMode = false;
    showLogin();
    showToast("Signed out", "info");
  });

  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    loadContent();
    showToast("Content refreshed", "info");
  });

  document.getElementById("mediaForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const file = document.getElementById("mediaFile").files[0];
    const path = document.getElementById("mediaPath").value.trim();
    if (!file || !path) return;
    showToast("Uploading asset...", "info");
    try {
      const publicUrl = await uploadFileToSupabase(file, path);
      showToast("Asset uploaded! Link: " + publicUrl, "success");
      document.getElementById("mediaForm").reset();
    } catch (err) {
      showToast("Upload error: " + err.message, "error");
    }
  });

  // Initialise Admin State
  async function initialiseAdmin() {
    if (!config.enabled || !base || !config.anonKey) {
      if (setupPanel) setupPanel.hidden = false;
      if (authPanel) authPanel.hidden = true;
      updateConnectionBadge();
      return;
    }

    if (!session?.access_token) {
      showLogin();
      return;
    }

    try {
      await ensureFreshSession();
      showDashboard();
    } catch (error) {
      showLogin();
    }
  }

  initialiseAdmin();
})();
