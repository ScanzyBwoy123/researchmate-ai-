"use strict";

// ResearchMate AI 2.0
// Connects to the existing ResearchMate Cloudflare API.

const API_BASE_URL =
  "https://researchmate-ai.ddangote701.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
  initializeResearchPlanner();
});

function initializeResearchPlanner() {
  const form = document.getElementById("researchForm");
  const generateBtn = document.getElementById("generateBtn");
  const buttonText = document.getElementById("buttonText");
  const statusMessage = document.getElementById("statusMessage");

  const resultsSection = document.getElementById("resultsSection");
  const outlineContainer = document.getElementById("outlineContainer");
  const researchSummary = document.getElementById("researchSummary");
  const copyBtn = document.getElementById("copyBtn");

  let generatedOutlineText = "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const topic = document.getElementById("topic").value.trim();
    const discipline = document.getElementById("discipline").value;
    const level = document.getElementById("level").value;
    const documentType = document.getElementById("documentType").value;

    if (topic.length < 5) {
      showStatus("Please enter a research topic with at least 5 characters.", "error");
      return;
    }

    if (topic.length > 500) {
      showStatus("Your topic must not exceed 500 characters.", "error");
      return;
    }

    // Convert the selected document type into the API's supported values.
    const researchTypeMap = {
      "Research Proposal": "research-proposal",
      "Thesis": "thesis",
      "Dissertation": "thesis",
      "Research Project": "research-proposal",
      "Journal Article": "journal-article"
    };

    const researchType = researchTypeMap[documentType];

    generateBtn.disabled = true;
    buttonText.textContent = "Generating your outline...";
    resultsSection.classList.add("hidden");

    showStatus("Connecting to ResearchMate AI...", "loading");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/research/outline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic: topic,
            researchType: researchType,
            field: discipline,
            level: level
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to generate your research outline."
        );
      }

      displayResearchResults(data);

      showStatus(
        "Your research outline has been generated successfully.",
        "success"
      );

      resultsSection.classList.remove("hidden");

      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {
      console.error("ResearchMate AI error:", error);

      showStatus(
        error.message || "Connection failed. Please try again.",
        "error"
      );

    } finally {
      generateBtn.disabled = false;
      buttonText.textContent = "Generate Research Outline";
    }
  });

  function displayResearchResults(data) {
    outlineContainer.replaceChildren();

    const research = data.research || {};
    const outline = Array.isArray(data.outline) ? data.outline : [];

    researchSummary.replaceChildren();

    const summaryTitle = document.createElement("h3");
    summaryTitle.textContent = research.topic || "Research topic";

    const summaryDetails = document.createElement("p");
    summaryDetails.textContent =
      `${research.field || "Academic discipline"} · ` +
      `${research.level || "Academic level"} · ` +
      `${research.researchType || "Research document"}`;

    researchSummary.append(summaryTitle, summaryDetails);

    generatedOutlineText =
      `RESEARCH TOPIC\n${research.topic || ""}\n\n` +
      `DISCIPLINE: ${research.field || ""}\n` +
      `LEVEL: ${research.level || ""}\n\n`;

    if (outline.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No outline sections were returned.";
      outlineContainer.appendChild(message);
      return;
    }

    outline.forEach((section, index) => {
      const card = document.createElement("article");
      card.className = "outline-card";

      const heading = document.createElement("h3");
      heading.textContent =
        `${section.number || index + 1}. ${section.title || "Research section"}`;

      const guidance = document.createElement("p");
      guidance.textContent =
        section.guidance || "Review this section and adapt it to your research.";

      card.append(heading, guidance);
      outlineContainer.appendChild(card);

      generatedOutlineText +=
        `${section.number || index + 1}. ${section.title || ""}\n` +
        `${section.guidance || ""}\n\n`;
    });

    if (data.integrityNote) {
      generatedOutlineText +=
        `ACADEMIC INTEGRITY NOTICE\n${data.integrityNote}`;
    }
  }

  copyBtn.addEventListener("click", async () => {
    if (!generatedOutlineText) {
      showStatus("Generate an outline before copying.", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedOutlineText);

      copyBtn.textContent = "Copied!";

      setTimeout(() => {
        copyBtn.textContent = "Copy outline";
      }, 2000);

    } catch (error) {
      showStatus(
        "Copy failed. Try selecting and copying the outline manually.",
        "error"
      );
    }
  });

  function showStatus(message, state) {
    statusMessage.textContent = message;
    statusMessage.className = "status-message " + state;
  }
}
