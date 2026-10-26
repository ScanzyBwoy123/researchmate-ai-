const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
// Serve the website from the public folder.
app.use(express.static(path.join(__dirname, "public")));
// Basic API health check.
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ResearchMate AI",
    status: "healthy",
    version: "0.1.0",
    timestamp: new Date().toISOString()
  });
});
// List the current API capabilities.
app.get("/api/capabilities", (req, res) => {
  res.json({
    success: true,
    service: "ResearchMate AI",
    version: "0.1.0",
    available: [
      "health-check",
      "capabilities",
      "research-outline"
    ],
    planned: [
      "academic-literature-search",
      "reference-verification",
      "research-gap-analysis",
      "statistical-data-analysis",
      "document-generation",
      "research-innovation-lab"
    ],
    notice: "This is an early prototype. Planned capabilities are not yet implemented."
  });
});
// Create a structured research outline.
// This initial version uses templates, not a live AI model.
app.post("/api/research/outline", (req, res) => {
  const { topic, researchType, field, level } = req.body || {};
  if (typeof topic !== "string" || topic.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: "INVALID_TOPIC",
      message: "Enter a research topic containing at least 5 characters."
    });
  }
  if (topic.trim().length > 500) {
    return res.status(400).json({
      success: false,
      error: "TOPIC_TOO_LONG",
      message: "Your research topic must not exceed 500 characters."
    });
  }
  const allowedTypes = [
    "research-proposal",
    "literature-review",
    "thesis",
    "journal-article"
  ];
  const type = allowedTypes.includes(researchType)
    ? researchType
    : "research-proposal";
  const templates = {
    "research-proposal": [
      "Proposed Title",
      "Chapter One: Introduction",
      "Background of the Study",
      "Problem Statement",
      "Aim and Specific Objectives",
      "Research Questions or Hypotheses",
      "Significance of the Study",
      "Scope and Delimitations",
      "Literature Review",
      "Research Methodology",
      "Ethical Considerations",
      "Expected Outcomes",
      "Work Plan and Timeline",
      "Budget, if applicable",
      "References"
    ],
    "literature-review": [
      "Proposed Title",
      "Abstract",
      "Introduction and Review Scope",
      "Search Strategy and Information Sources",
      "Eligibility and Selection Criteria",
      "Thematic Synthesis of Existing Research",
      "Comparison of Findings",
      "Methodological Strengths and Limitations",
      "Research Gaps",
      "Implications for Research and Practice",
      "Conclusion",
      "References"
    ],
    thesis: [
      "Title Page",
      "Abstract",
      "Chapter One: Introduction",
      "Chapter Two: Literature Review",
      "Chapter Three: Research Methodology",
      "Chapter Four: Results or Findings",
      "Chapter Five: Discussion",
      "Chapter Six: Conclusion and Recommendations",
      "References",
      "Appendices"
    ],
    "journal-article": [
      "Proposed Title",
      "Abstract",
      "Keywords",
      "Introduction",
      "Methods",
      "Results",
      "Discussion",
      "Limitations",
      "Conclusion",
      "Declarations and Ethics Statements, where applicable",
      "References"
    ]
  };
  const outline = templates[type].map((section, index) => ({
    number: index + 1,
    title: section,
    guidance: getSectionGuidance(section, topic.trim())
  }));
  return res.json({
    success: true,
    mode: "template-based-prototype",
    message: "Outline generated. Review and adapt it to your institution's requirements.",
    research: {
      topic: topic.trim(),
      researchType: type,
      field: typeof field === "string" ? field.trim().slice(0, 100) : "",
      level: typeof level === "string" ? level.trim().slice(0, 100) : ""
    },
    outline,
    integrityNote:
      "This prototype does not search academic databases, verify references, or generate evidence-based findings."
  });
});
function getSectionGuidance(section, topic) {
  const guidance = {
    "Proposed Title": `Develop a clear, specific title describing the study of ${topic}.`,
    "Background of the Study":
      "Introduce the subject using reliable, verifiable evidence and relevant context.",
    "Problem Statement":
      "Explain the specific problem, who is affected, what is known, and what remains uncertain.",
    "Aim and Specific Objectives":
      "State one overall aim and measurable objectives aligned with the research problem.",
    "Research Questions or Hypotheses":
      "Formulate focused, answerable questions or testable hypotheses where appropriate.",
    "Literature Review":
      "Synthesize relevant scholarly literature, compare findings, and identify limitations.",
    "Research Methodology":
      "Explain the design, setting, population, sampling, instruments, procedures, and analysis plan.",
    "Ethical Considerations":
      "Address consent, confidentiality, participant safety, permissions, and ethics review where applicable.",
    "References":
      "Include only sources actually consulted and verify their bibliographic details.",
    "Methods":
      "Describe procedures in enough detail for readers to understand and assess the study.",
    "Results or Findings":
      "Report actual results only. Never invent data, participants, or findings.",
    "Results":
      "Present the actual findings accurately, with appropriate tables or figures where needed.",
    "Discussion":
      "Interpret the findings in relation to the research questions and relevant literature.",
    "Research Gaps":
      "Identify gaps supported by the literature reviewed; do not claim novelty without comparison.",
    "Conclusion":
      "Summarize conclusions supported by the available evidence.",
    "Abstract":
      "Summarize the purpose, approach, main findings when available, and conclusions."
  };
  return guidance[section] ||
    `Plan the ${section.toLowerCase()} section for the topic: ${topic}. Follow your institution's or target journal's guidelines.`;
}
// Return JSON for unknown API routes.
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "The requested API endpoint does not exist."
  });
});
// General error handler.
app.use((err, req, res, next) => {
  console.error("ResearchMate AI error:", err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: "The server encountered an unexpected error."
  });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`ResearchMate AI server listening on port ${PORT}`);
});
