/* 공개 소개용 문구입니다. 투자 내역이나 연락처는 넣지 않았습니다. */
(() => {
  "use strict";
  const lenses = {
    startup: {
      number: "01", label: "STARTUP",
      question: ["중고등학생 커리어", "멘토링 사업"],
      description: "공동창업 · 서비스 기획 · 운영"
    },
    business: {
      number: "02", label: "BUSINESS DEVELOPMENT",
      question: ["LG전자", "사업개발"],
      description: "스마트TV 플랫폼 · 아시아 지역 파트너십"
    },
    venture: {
      number: "03", label: "VENTURE CAPITAL",
      question: ["GS벤처스", "투자 심사역"],
      description: "산업 리서치 · 기업 분석 · 투자 검토"
    },
    learning: {
      number: "04", label: "EDUCATION",
      question: ["KAIST", "기술경영학 석사과정"],
      description: "기술경영학 석사과정 재학 중"
    }
  };
  const card = document.querySelector(".lens-card");
  const controls = document.querySelector(".lens-controls");
  if (!card || !controls) return;
  const buttons = [...controls.querySelectorAll("button[data-lens]")];
  function selectLens(key) {
    const lens = lenses[key];
    if (!lens) return;
    card.dataset.lens = key;
    document.getElementById("lens-count").textContent = `${lens.number} / 04`;
    document.getElementById("lens-label").textContent = lens.label;
    const question = document.getElementById("lens-question");
    question.replaceChildren(document.createTextNode(lens.question[0]), document.createElement("br"), document.createTextNode(lens.question[1]));
    document.getElementById("lens-description").textContent = lens.description;
    buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lens === key)));
  }
  buttons.forEach(button => button.addEventListener("click", () => selectLens(button.dataset.lens)));
  controls.hidden = false;
  document.querySelector(".lens-hint").hidden = false;
})();
