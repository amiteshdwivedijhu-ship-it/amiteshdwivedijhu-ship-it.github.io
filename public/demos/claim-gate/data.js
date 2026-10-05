(function (root) {
  var claims = [
    {
      id: "meet",
      label: "Meeting line",
      text: "Thank you for meeting about your retirement income plan.",
      cite: {
        id: "TMP-12",
        title: "Approved follow-up opener",
        excerpt: "Thank the client for the meeting. Do not add results or promises."
      }
    },
    {
      id: "fund",
      label: "Fund line",
      text: "Harbor Balanced Fund holds a mix of stocks and bonds.",
      disclosure: "The value of this fund can go down.",
      cite: {
        id: "FS-204",
        title: "Approved fact sheet (synthetic)",
        excerpt: "Harbor Balanced Fund holds a mix of stocks and bonds. When you name the fund, add this line: the value can go down."
      }
    },
    {
      id: "results",
      label: "Results line",
      text: "Results have been strong, and you should expect the same next year.",
      cite: null,
      replace: {
        text: "I can send the approved fact sheet. I cannot promise how the fund will do.",
        cite: {
          id: "AP-09",
          title: "Approved: do not promise results",
          excerpt: "Do not say the fund will repeat past results. Offer the fact sheet instead."
        }
      }
    }
  ];

  function status(state) {
    var reasons = [];
    if (!state.disclosureOn) {
      reasons.push("The fund line is missing a required disclosure.");
    }
    if (state.claim3 === "open") {
      reasons.push("The results line has no approved citation. Remove it or replace it.");
    }
    if (state.claim3 === "blocked") {
      reasons.push("Supervision blocked the results line. Remove it or replace it before send.");
    }
    return {
      canSend: reasons.length === 0 && !state.sent,
      reasons: reasons
    };
  }

  root.CLAIM_GATE = {
    firm: "North Harbor Wealth",
    advisor: "Advisor Lee",
    client: "Client M",
    fund: "Harbor Balanced Fund",
    claims: claims,
    status: status
  };
})(typeof window !== "undefined" ? window : globalThis);
