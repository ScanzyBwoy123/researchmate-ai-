"use strict";
// ResearchMate AI frontend
const API_BASE_URL = "https://researchmate-ai.ddangote701.workers.dev";
document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeHealthCheck();
  initializeResearchOutline();
});
function initializeNavigation() {
  const navLinks = document.querySelectorAll("[data-page]");

  const overviewPage = document.getElementById("overviewPage");
  const plannerPage = document.getElementById("plannerPage");
  const placeholderPage = document.getElementById("placeholderPage");

  const pages = {
    overview: overviewPage,
    "research-planner": plannerPage,
    literature: placeholderPage,
    analysis: placeholderPage,
    verification: placeholderPage,
    writing: placeholderPage,
    innovation: placeholderPage
  };

  const pageDetails = {
    literature: {
      title: "Literature Discovery",
      description: "Explore scholarly literature in a future development stage."
    },
    analysis: {
      title: "Research Analysis",
      description: "Prepare research data for analysis in a future development stage."
    },
    verification: {
      title: "Source Verification",
      description: "Reference verification is planned for a future development stage."
    },
    writing: {
      title: "Writing Studio",
      description: "Academic writing tools are planned for a future development stage."
    },
    innovation: {
      title: "Innovation Lab",
      description: "Research innovation tools are planned for a future development stage."
    }
  };

  function showPage(pageName) {
    const selectedPage = pages[pageName];

    if (!selectedPage) return;

    [overviewPage, plannerPage, placeholderPage].forEach(page => {
      if (page) page.hidden = page !== selectedPage;
    });

    navLinks.forEach(link => {
      link.classList.toggle(
        "active",
        link.getAttribute("data-page") === pageName
      );
    });

    const breadcrumb = document.getElementById("breadcrumbPage");

    if (breadcrumb) {
      breadcrumb.textContent =
        pageName === "research-planner"
          ? "Research Planner"
          : pageName === "overview"
            ? "Overview"
            : pageDetails[pageName]?.title || "Research Workspace";
    }

    if (pageName !== "overview" && pageName !== "research-planner") {
      const details = pageDetails[pageName];

      if (details) {
        const title = document.getElementById("placeholderTitle");
        const description = document.getElementById("placeholderDescription");

        if (title) title.textContent = details.title;
        if (description) description.textContent = details.description;
      }
    }
  }

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showPage(link.getAttribute("data-page"));
    });
  });

  showPage("overview");
}
async function initializeHealthCheck() {
  const apiDescription = document.getElementById("apiDescription");
  const apiState = document.getElementById("apiState");
  const apiIndicator = document.getElementById("apiIndicator");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  function updateConnection(message, state) {
    if (apiDescription) {
      apiDescription.textContent =
        state === "success"
          ? "Backend connected successfully"
          : state === "error"
            ? "Unable to connect to backend"
            : "Checking connection...";
    }
    if (apiState) {
      apiState.textContent =
        state === "success"
          ? "ONLINE"
          : state === "error"
            ? "OFFLINE"
            : "CHECKING";
    }
    [apiIndicator, statusDot].forEach((element) => {
      if (!element) return;
      element.classList.remove("success", "error", "loading");
      element.classList.add(state);
    });
    if (statusText) {
      statusText.textContent = message;
    }
  }
  updateConnection("Checking server...", "loading");
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (data.success && data.status === "healthy") {
      updateConnection("Backend connected", "success");
    } else {
      throw new Error("Unexpected health-check response");
    }
  } catch (error) {
    console.error("Backend health check failed:", error);
    updateConnection("Connection failed", "error");
  }
}
function setStatus(elements, message, state) {
  elements.forEach((element) => {
    element.textContent = message;
    element.dataset.status = state;
    element.classList.remove("success", "error", "warning", "loading");
    element.classList.add(state);
  });
}
function initializeResearchOutline() {
  const forms = [
    document.getElementById("researchForm"),
    document.getElementById("quickResearchForm")
  ].filter(Boolean);
  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const topicInput =
        form.querySelector('[name="topic"]');
      const topic = topicInput?.value.trim();
      if (!topic) {
        alert("Please enter your research topic.");
        return;
      }
      const typeInput = form.querySelector('[name="researchType"]');
      const levelInput = form.querySelector('[name="level"]');
      const fieldInput = form.querySelector('[name="field"]');
      const button = form.querySelector('button[type="submit"]');
      const originalText = button?.textContent;
      if (button) {
        button.disabled = true;
        button.textContent = "Building outline...";
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/research/outline`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              topic,
              researchType: typeInput?.value || "research-proposal",
              academicLevel: levelInput?.value || "Undergraduate",
              field: fieldInput?.value || ""
            })
          }
        );
        const data = await response.json();
        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || data.error || "Could not build the outline."
          );
        }
        if (form.id === "quickResearchForm") {
          const plannerLink = document.querySelector(
            '[data-page="research-planner"]'
          );
          if (plannerLink) {
            plannerLink.click();
          }
          const plannerTopic = document.getElementById("researchTopic");
          if (plannerTopic) {
            plannerTopic.value = topic;
          }
        }
        displayOutline(data);
        const result = document.getElementById("outlineResult");
        if (result) {
          result.hidden = false;
          result.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      } catch (error) {
        console.error("Outline generation failed:", error);
        alert(error.message || "Unable to build the outline. Please try again.");
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText || "Build my outline";
        }
      }
    });
  });
}
function displayOutline(data) {
  const output =
    document.getElementById("outlineResult") ||
    document.getElementById("results") ||
    document.getElementById("researchResults");
  if (!output) {
    console.log("Research outline response:", data);
    return;
  }
  const outline = data.outline || data.data?.outline || data.result || data.data;
  output.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = "Research Outline";
  output.appendChild(heading);
  if (typeof outline === "string") {
    const paragraph = document.createElement("p");
    paragraph.textContent = outline;
    output.appendChild(paragraph);
  } else if (outline && typeof outline === "object") {
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(outline, null, 2);
    output.appendChild(pre);
  } else {
    const pre = document.createElement("pre");
    pre.textContent = JSON.stringify(data, null, 2);
    output.appendChild(pre);
  }
  output.hidden = false;
  output.scrollIntoView({ behavior: "smooth", block: "start" });
}
function showMessage(message, state = "info") {
  const element =
    document.getElementById("message") ||
    document.getElementById("statusMessage") ||
    document.getElementById("formMessage");
  if (element) {
    element.textContent = message;
    element.dataset.status = state;
    element.classList.remove("success", "error", "warning", "loading");
    element.classList.add(state);
  } else {
    console.info(message);
  }
}
