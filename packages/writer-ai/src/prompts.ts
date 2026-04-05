import {
  summarizePersonaConstraints,
  type Persona,
  type PreferenceProfile,
  type StyleExample
} from "@cowrite/writer-core";

export interface RewriteRequest {
  selectionText: string;
  instruction: string;
  persona: Persona;
  preferenceProfile?: PreferenceProfile;
}

export interface RewriteCandidate {
  id: string;
  label: string;
  text: string;
  reason: string;
}

const phrasePairs: Array<[RegExp, string]> = [
  [/지금 문장은/gu, "이 문장은"],
  [/지나치게/gu, "너무"],
  [/조금 더/gu, "좀 더"],
  [/느껴진다/gu, "보인다"],
  [/할 수 있다/gu, "된다"],
  [/것이다\./gu, "다."],
  [/정말/gu, ""],
  [/매우/gu, ""]
];

function compactWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripDislikedPhrases(text: string, persona: Persona): string {
  return persona.dislikedPhrases.reduce((current, phrase) => {
    if (!phrase.trim()) {
      return current;
    }

    return current.replaceAll(phrase, "");
  }, text);
}

function applyPhraseHeuristics(text: string): string {
  return phrasePairs.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement);
  }, text);
}

function shortenSentence(text: string): string {
  return compactWhitespace(
    text
      .replace(/그리고/gu, "")
      .replace(/그러니까/gu, "")
      .replace(/그래서/gu, "")
      .replace(/\s+,/g, ",")
  );
}

function softenSentence(text: string): string {
  return compactWhitespace(
    text
      .replace(/다\./gu, "다.")
      .replace(/보인다\./gu, "보이는 편이다.")
  );
}

function directifySentence(text: string): string {
  return compactWhitespace(
    text
      .replace(/보이는 편이다\./gu, "보인다.")
      .replace(/인 것 같다\./gu, "다.")
  );
}

function baseRewrite({ selectionText, persona }: RewriteRequest): string {
  return compactWhitespace(
    applyPhraseHeuristics(stripDislikedPhrases(selectionText, persona))
  );
}

export function createRewriteCandidates(
  request: RewriteRequest
): RewriteCandidate[] {
  const base = baseRewrite(request);
  const concise = request.persona.voice.brevity >= 70 ? shortenSentence(base) : base;
  const direct = request.persona.voice.directness >= 60 ? directifySentence(base) : base;
  const soft = request.persona.voice.softness >= 50 ? softenSentence(base) : base;

  return [
    {
      id: "candidate_concise",
      label: "Compact",
      text:
        request.instruction.includes("짧") || request.instruction.includes("담백")
          ? concise
          : base,
      reason: "문장 길이를 줄이고 수식어를 덜어낸다."
    },
    {
      id: "candidate_direct",
      label: "Direct",
      text:
        request.instruction.includes("건조") || request.instruction.includes("AI")
          ? direct
          : concise,
      reason: "완곡한 표현을 줄이고 논지 전달을 곧게 만든다."
    },
    {
      id: "candidate_soft",
      label: "Soft",
      text: soft,
      reason: "리듬은 유지하되 과도한 직설감을 약하게 누른다."
    }
  ].map((candidate) => ({
    ...candidate,
    text: compactWhitespace(candidate.text)
  }));
}

export function rewriteSelectionLocally(
  request: RewriteRequest
): {
  text: string;
  reason: string;
  candidates: RewriteCandidate[];
} {
  const candidates = createRewriteCandidates(request);
  const preferred =
    request.instruction.includes("덜 친절") || request.instruction.includes("건조")
      ? candidates[1]
      : request.instruction.includes("짧") || request.instruction.includes("담백")
        ? candidates[0]
        : candidates[0];

  return {
    text: preferred.text,
    reason: `${request.persona.name} 페르소나와 현재 지시문에 맞춰 어조를 조정했다.`,
    candidates
  };
}

function formatStyleExamples(examples: StyleExample[]): string {
  return examples
    .map(
      (ex, i) =>
        `예시 ${i + 1}${ex.note ? ` (${ex.note})` : ""}\n- Before: ${ex.before}\n- After: ${ex.after}`
    )
    .join("\n\n");
}

export function buildAnalyzeStylePrompt(persona: Persona): string {
  if (persona.styleExamples.length === 0) {
    return "분석할 Before/After 예시가 아직 없습니다. 먼저 예시를 추가해주세요.";
  }

  const currentState = [
    persona.hardRules.length > 0
      ? `현재 하드 규칙:\n${persona.hardRules.map((r) => `- ${r}`).join("\n")}`
      : "현재 하드 규칙: 없음",
    persona.likedPhrases.length > 0
      ? `현재 선호 표현: ${persona.likedPhrases.join(", ")}`
      : "현재 선호 표현: 없음",
    persona.dislikedPhrases.length > 0
      ? `현재 비선호 표현: ${persona.dislikedPhrases.join(", ")}`
      : "현재 비선호 표현: 없음",
    `현재 보이스: 간결 ${persona.voice.brevity} / 따뜻 ${persona.voice.warmth} / 직접 ${persona.voice.directness} / 부드러움 ${persona.voice.softness}`
  ].join("\n");

  return [
    `너는 글쓰기 페르소나 "${persona.name}"의 말투를 분석하는 도우미다.`,
    "",
    "아래 Before/After 예시들을 보고, 이 사람의 말투 특징을 깊이 분석해서 페르소나 설정을 업데이트해줘.",
    "",
    "## Before/After 예시",
    "",
    formatStyleExamples(persona.styleExamples),
    "",
    "## 현재 페르소나 설정",
    "",
    currentState,
    "",
    "## 분석 관점",
    "",
    "아래 관점들을 모두 살펴보고, Before→After 변환에서 반복되는 패턴을 찾아줘.",
    "",
    "### 1. 어미·종결 패턴",
    "- After가 사용하는 문장 종결 어미는 무엇인가? (~요 체, ~다 체, ~습니다 체, 반말 등)",
    "- Before에서 쓰이던 종결 어미 중 After에서 의도적으로 제거된 것은?",
    "",
    "### 2. 번역투·한문투 제거",
    "- 긴 관형절(수식어) 체인: 명사 앞에 수식이 여러 단 쌓이는 패턴이 After에서 어떻게 풀렸는가?",
    "- 명사화 종결: '~하는 것이다', '~하는 것입니다' 같은 패턴이 After에서 어떻게 바뀌었는가?",
    "- '~적' 접미사 남발: '본질적으로', '구조적으로', '표면적인' 등이 After에서 줄었는가?",
    "- 피동·보고체: '~로 설명됩니다', '~로 받아들여졌습니다' 같은 표현이 After에서 어떻게 바뀌었는가?",
    "- 한문투 조사 결합: '~에 대한', '~을 통해', '~을 전제로' 같은 패턴이 After에서 어떻게 풀렸는가?",
    "",
    "### 3. 문장 리듬·호흡",
    "- 한 문장의 평균 길이가 Before과 After에서 어떻게 다른가?",
    "- 한 문단에 담기는 아이디어 수가 다른가?",
    "- 문장 사이의 호흡(짧은 문장 → 긴 문장 교차, 단문과 복문의 비율)에 차이가 있는가?",
    "",
    "### 4. 연결·전환 방식",
    "- Before에서 쓰이던 논리 접속사(따라서, 즉, 나아가, 그럼에도)가 After에서 어떻게 바뀌었는가?",
    "- After가 섹션이나 문단을 연결할 때 어떤 방식을 쓰는가? (독자 향 질문, 자연스러운 이어짐 문장 등)",
    "",
    "### 5. 화자 태도·독자 관계",
    "- 의견 표시 방식: 객관적 서술에 녹이는가, 명시적으로 분리하는가?",
    "- 독자를 어떻게 대하는가? (관객으로 두는가, 말을 거는가, 함께 생각하는가)",
    "",
    "### 6. 설명 순서·구조",
    "- Before이 정의→근거(연역) 순서라면 After는 어떤 순서인가?",
    "- 인용·레퍼런스를 본문에 섞는가, 끝에 모으는가?",
    "- 코드·이미지·비유 같은 보조 자료를 어떻게 활용하는가?",
    "",
    "## 요청 사항",
    "",
    "위 분석을 바탕으로 다음을 업데이트해줘:",
    "1. **hardRules**: Before→After 변환에서 일관되게 적용되는 규칙. 위 분석 관점에서 발견된 패턴을 구체적으로 작성한다. (예: '긴 관형절 체인을 쓰지 않는다. 명사 앞에 수식이 3단 이상 쌓이면 문장을 나눈다.')",
    "2. **likedPhrases**: After에서 반복적으로 등장하는 표현 (종결어미, 전환어, 태도 표현 포함)",
    "3. **dislikedPhrases**: Before에는 있지만 After에서 의도적으로 제거/회피하는 표현 (번역투·한문투·피동 표현 포함)",
    "4. **voice**: 예시의 전반적 톤에 맞게 brevity/warmth/directness/softness (0-100) 조정",
    "",
    "기존 설정에 이미 있는 항목은 중복 추가하지 마.",
    "분석이 끝나면 persona.update 도구를 호출해서 결과를 바로 반영해줘.",
  ].join("\n");
}

export function buildRewriteSelectionPrompt(request: RewriteRequest): string {
  return [
    "너는 개인화 글쓰기 에디터의 리라이트 도우미다.",
    "",
    "지시문",
    request.instruction,
    "",
    "선택 구간",
    request.selectionText,
    "",
    "스타일 제약",
    summarizePersonaConstraints(request.persona, request.preferenceProfile),
    "",
    "원칙",
    "- 의미를 바꾸지 않는다.",
    "- 전체 문서가 아니라 선택 구간만 수정한다.",
    "- 출력은 수정된 텍스트만 제안한다."
  ].join("\n");
}

