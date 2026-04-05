import { summarizePersonaConstraints } from "@vvrite/writer-core";
const phrasePairs = [
    [/지금 문장은/gu, "이 문장은"],
    [/지나치게/gu, "너무"],
    [/조금 더/gu, "좀 더"],
    [/느껴진다/gu, "보인다"],
    [/할 수 있다/gu, "된다"],
    [/것이다\./gu, "다."],
    [/정말/gu, ""],
    [/매우/gu, ""]
];
function compactWhitespace(text) {
    return text.replace(/\s+/g, " ").trim();
}
function stripDislikedPhrases(text, persona) {
    return persona.dislikedPhrases.reduce((current, phrase) => {
        if (!phrase.trim()) {
            return current;
        }
        return current.replaceAll(phrase, "");
    }, text);
}
function applyPhraseHeuristics(text) {
    return phrasePairs.reduce((current, [pattern, replacement]) => {
        return current.replace(pattern, replacement);
    }, text);
}
function shortenSentence(text) {
    return compactWhitespace(text
        .replace(/그리고/gu, "")
        .replace(/그러니까/gu, "")
        .replace(/그래서/gu, "")
        .replace(/\s+,/g, ","));
}
function softenSentence(text) {
    return compactWhitespace(text
        .replace(/다\./gu, "다.")
        .replace(/보인다\./gu, "보이는 편이다."));
}
function directifySentence(text) {
    return compactWhitespace(text
        .replace(/보이는 편이다\./gu, "보인다.")
        .replace(/인 것 같다\./gu, "다."));
}
function baseRewrite({ selectionText, persona }) {
    return compactWhitespace(applyPhraseHeuristics(stripDislikedPhrases(selectionText, persona)));
}
export function createRewriteCandidates(request) {
    const base = baseRewrite(request);
    const concise = request.persona.voice.brevity >= 70 ? shortenSentence(base) : base;
    const direct = request.persona.voice.directness >= 60 ? directifySentence(base) : base;
    const soft = request.persona.voice.softness >= 50 ? softenSentence(base) : base;
    return [
        {
            id: "candidate_concise",
            label: "Compact",
            text: request.instruction.includes("짧") || request.instruction.includes("담백")
                ? concise
                : base,
            reason: "문장 길이를 줄이고 수식어를 덜어낸다."
        },
        {
            id: "candidate_direct",
            label: "Direct",
            text: request.instruction.includes("건조") || request.instruction.includes("AI")
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
export function rewriteSelectionLocally(request) {
    const candidates = createRewriteCandidates(request);
    const preferred = request.instruction.includes("덜 친절") || request.instruction.includes("건조")
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
function formatStyleExamples(examples) {
    return examples
        .map((ex, i) => `예시 ${i + 1}${ex.note ? ` (${ex.note})` : ""}\n- Before: ${ex.before}\n- After: ${ex.after}`)
        .join("\n\n");
}
export function buildAnalyzeStylePrompt(persona) {
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
        "아래 Before/After 예시들을 보고, 이 사람의 말투 특징을 분석해서 페르소나 설정을 업데이트해줘.",
        "",
        "## Before/After 예시",
        "",
        formatStyleExamples(persona.styleExamples),
        "",
        "## 현재 페르소나 설정",
        "",
        currentState,
        "",
        "## 요청 사항",
        "",
        "예시들에서 반복되는 패턴을 찾아서 다음을 업데이트해줘:",
        "1. **hardRules**: Before→After 변환에서 일관되게 적용되는 규칙 (예: '~습니다 대신 ~다 체를 쓴다')",
        "2. **likedPhrases**: After에서 반복적으로 등장하는 표현",
        "3. **dislikedPhrases**: Before에는 있지만 After에서 의도적으로 제거/회피하는 표현",
        "4. **voice**: 예시의 전반적 톤에 맞게 brevity/warmth/directness/softness (0-100) 조정",
        "",
        "기존 설정에 이미 있는 항목은 중복 추가하지 마.",
        "분석이 끝나면 persona.update 도구를 호출해서 결과를 바로 반영해줘.",
    ].join("\n");
}
export function buildRewriteSelectionPrompt(request) {
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
//# sourceMappingURL=prompts.js.map