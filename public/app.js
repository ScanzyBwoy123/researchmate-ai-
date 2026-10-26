“use strict”;

document.addEventListener(“DOMContentLoaded”, () => {
const API_BASE_URL = “https://researchmate-ai.ddangote701.workers.dev”;

const $ = (selector) => document.querySelector(selector);

const sidebar = $(”#sidebar”);
const menuButton = $(”#menuButton”);
const breadcrumbPage = $(”#breadcrumbPage”);
const statusDot = $(”#statusDot”);
const statusText = $(”#statusText”);
const apiIndicator = $(”#apiIndicator”);
const apiDescription = $(”#apiDescription”);
const apiState = $(”#apiState”);
const toast = $(”#toast”);

let toastTimer;

const pageNames = {
overview: “Overview”,
“research-planner”: “Research Planner”,
literature: “Literature Discovery”,
analysis: “Data Analysis”,
verification: “Source Verification”,
writing: “Writing Studio”,
innovation: “Innovation Lab”
};

const pageDescriptions = {
literature:
“Explore scholarly literature, compare publications, and investigate evidence-supported research gaps.”,
analysis:
“Prepare datasets for statistical analysis, data visualisation, and research interpretation.”,
verification:
“Review references and assess whether research claims are supported by reliable sources.”,
writing:
“Organise academic documents and prepare manuscripts for editing, formatting, and review.”,
innovation:
“Develop testable research questions, explore ideas, and plan prototypes and evaluations.”
};

function showToast(message) {
if (!toast) return;

toast.textContent = message;
toast.classList.add("visible");
clearTimeout(toastTimer);
toastTimer = setTimeout(() => {
  toast.classList.remove("visible");
}, 3500);

}

function closeSidebar() {
if (!sidebar || !menuButton) return;

sidebar.classList.remove("open");
menuButton.setAttribute("aria-expanded", "false");
menuButton.setAttribute("aria-label", "Open navigation");

}

function openSidebar() {
if (!sidebar || !menuButton) return;

sidebar.classList.add("open");
menuButton.setAttribute("aria-expanded", "true");
menuButton.setAttribute("aria-label", "Close navigation");

}

function navigateTo(page, updateHash = true) {
if (!Object.prototype.hasOwnProperty.call(pageNames, page)) {
page = “overview”;
}

const overviewPage = $("#overviewPage");
const plannerPage = $("#plannerPage");
const placeholderPage = $("#placeholderPage");
if (overviewPage) {
  overviewPage.hidden = page !== "overview";
}
if (plannerPage) {
  plannerPage.hidden = page !== "research-planner";
}
if (placeholderPage) {
  const isPlaceholder = ![
    "overview",
    "research-planner"
  ].includes(page);
  placeholderPage.hidden = !isPlaceholder;
  if (isPlaceholder) {
    const title = $("#placeholderTitle");
    const description = $("#placeholderDescription");
    if (title) title.textContent = pageNames[page];
    if (description) {
      description.textContent =
        pageDescriptions[page] || "Research tools for your workspace.";
    }
  }
}
document.querySelectorAll("[data-page]").forEach((element) => {
  if (!element.classList.contains("nav-link")) return;
  const isActive = element.dataset.page === page;
  element.classList.toggle("active", isActive);
  if (isActive) {
    element.setAttribute("aria-current", "page");
  } else {
    element.removeAttribute("aria-current");
  }
});
if (breadcrumbPage) {
  breadcrumbPage.textContent = pageNames[page];
}
if (updateHash) {
  history.replaceState(null, "", `#${page}`);
}
closeSidebar();
window.scrollTo({ top: 0, behavior: "smooth" });

}

document.querySelectorAll(”[data-page]”).forEach((element) => {
element.addEventListener(“click”, (event) => {
event.preventDefault();
navigateTo(element.dataset.page);
});
});

if (menuButton) {
menuButton.addEventListener(“click”, () => {
if (sidebar && sidebar.classList.contains(“open”)) {
closeSidebar();
} else {
openSidebar();
}
});
}

document.addEventListener(“click”, (event) => {
if (
window.innerWidth <= 850 &&
sidebar &&
menuButton &&
sidebar.classList.contains(“open”) &&
!sidebar.contains(event.target) &&
!menuButton.contains(event.target)
) {
closeSidebar();
}
});

window.addEventListener(“resize”, () => {
if (window.innerWidth > 850) {
closeSidebar();
}
});

window.addEventListener(“hashchange”, () => {
const page = window.location.hash.replace(”#”, “”) || “overview”;
navigateTo(page, false);
});

function setApiStatus(online, message) {
if (statusDot) {
statusDot.classList.toggle(“online”, online);
statusDot.classList.toggle(“offline”, !online);
}

if (statusText) {
  statusText.textContent = online ? "API connected" : "API unavailable";
}
if (apiIndicator) {
  apiIndicator.classList.toggle("online", online);
  apiIndicator.classList.toggle("offline", !online);
}
if (apiDescription) {
  apiDescription.textContent = message;
}
if (apiState) {
  apiState.textContent = online ? "CONNECTED" : "UNAVAILABLE";
  apiState.style.color = online ? "#159b72" : "#d45d68";
}

}

async function checkApiHealth() {
try {
const response = await fetch(${API_BASE_URL}/api/health, {
method: “GET”,
headers: { Accept: “application/json” },
cache: “no-store”
});

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }
  const data = await response.json();
  if (data.success !== true || data.status !== "healthy") {
    throw new Error("The API health response was unexpected.");
  }
  setApiStatus(
    true,
    `Cloudflare connected · version ${data.version || "unknown"}`
  );
} catch (error) {
  console.error("API health check failed:", error);
  setApiStatus(
    false,
    "Unable to reach the Cloudflare API. Check the deployment and connection."
  );
}

}

async function requestOutline(form) {
const formData = new FormData(form);

const payload = {
  topic: String(formData.get("topic") || "").trim(),
  researchType: String(
    formData.get("researchType") || "research-proposal"
  ),
  field: String(formData.get("field") || "").trim(),
  level: String(formData.get("level") || "").trim()
};
if (payload.topic.length < 5) {
  showToast("Please enter a topic with at least 5 characters.");
  return;
}
if (payload.topic.length > 500) {
  showToast("Your topic must not exceed 500 characters.");
  return;
}
const submitButton = form.querySelector('button[type="submit"]');
if (!submitButton) return;
const originalButtonText = submitButton.textContent;
submitButton.disabled = true;
submitButton.textContent = "Building outline...";
try {
  const response = await fetch(
    `${API_BASE_URL}/api/research/outline`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) {
    throw new Error(
      data.message || "Could not generate the outline."
    );
  }
  renderOutline(data);
  if (form.id === "quickResearchForm") {
    navigateTo("research-planner");
    const topicField = $("#researchTopic");
    const typeField = $("#researchType");
    const fieldField = $("#researchField");
    const levelField = $("#researchLevel");
    if (topicField) topicField.value = payload.topic;
    if (typeField) typeField.value = payload.researchType;
    if (fieldField) fieldField.value = payload.field;
    if (levelField) levelField.value = payload.level;
  }
  showToast("Your research outline is ready.");
} catch (error) {
  console.error("Research outline request failed:", error);
  showToast(
    error.message ||
      "Unable to generate an outline. Check your Cloudflare API connection."
  );
} finally {
  submitButton.disabled = false;
  submitButton.textContent = originalButtonText;
}

}

function renderOutline(data) {
const resultPanel = $(”#outlineResult”);
const resultSubtitle = $(”#outlineSubtitle”);
const outlineMessage = $(”#outlineMessage”);
const outlineList = $(”#outlineList”);
const integrityNote = $(”#integrityNote”);

if (
  !resultPanel ||
  !resultSubtitle ||
  !outlineMessage ||
  !outlineList ||
  !integrityNote
) {
  return;
}
const research = data.research || {};
resultSubtitle.textContent = research.topic || "Research outline";
outlineMessage.textContent =
  data.message || "Outline generated successfully.";
outlineList.replaceChildren();
(Array.isArray(data.outline) ? data.outline : []).forEach((section) => {
  const item = document.createElement("li");
  const heading = document.createElement("strong");
  const guidance = document.createElement("p");
  heading.textContent = section.title || "Untitled section";
  guidance.textContent = section.guidance || "";
  item.append(heading, guidance);
  outlineList.appendChild(item);
});
integrityNote.textContent =
  data.integrityNote ||
  "Review this outline and adapt it to your institution's requirements.";
resultPanel.hidden = false;
resultPanel.scrollIntoView({
  behavior: "smooth",
  block: "start"
});

}

const quickResearchForm = $(”#quickResearchForm”);
const researchForm = $(”#researchForm”);

if (quickResearchForm) {
quickResearchForm.addEventListener(“submit”, (event) => {
event.preventDefault();
requestOutline(quickResearchForm);
});
}

if (researchForm) {
researchForm.addEventListener(“submit”, (event) => {
event.preventDefault();
requestOutline(researchForm);
});
}

const copyButton = $(”#copyOutline”);

if (copyButton) {
copyButton.addEventListener(“click”, async () => {
const title =
$(”#outlineSubtitle”)?.textContent || “Research outline”;

  const items = $("#outlineList")?.querySelectorAll("li") || [];
  const lines = [title, ""];
  items.forEach((item, index) => {
    const heading =
      item.querySelector("strong")?.textContent || "";
    const guidance =
      item.querySelector("p")?.textContent || "";
    lines.push(`${index + 1}. ${heading}`);
    if (guidance) {
      lines.push(`   ${guidance}`);
    }
    lines.push("");
  });
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("Outline copied to clipboard.");
  } catch (error) {
    console.error("Clipboard operation failed:", error);
    showToast(
      "Copy is unavailable in this browser. Select the text manually."
    );
  }
});

}

const initialPage = window.location.hash.replace(”#”, “”) || “overview”;

navigateTo(initialPage, false);
checkApiHealth();
setInterval(checkApiHealth, 60000);
});
