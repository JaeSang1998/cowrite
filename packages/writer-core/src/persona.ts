import { createId, nowIso } from "./document.js";

import type {
  Persona,
  PersonasFile,
  PreferenceFeedback,
  PreferenceProfile
} from "./types.js";

export function createDefaultPersona(): Persona {
  const timestamp = nowIso();

  return {
    id: "persona_default",
    name: "담백한 설명형",
    description:
      "논지를 과장하지 않고, 짧고 또렷한 문장으로 설명을 이어가는 기본 페르소나다.",
    hardRules: [
      "과한 완곡 표현을 피한다.",
      "한 문장에서 연결어를 두 번 이상 반복하지 않는다.",
      "의미를 바꾸는 과장 표현을 추가하지 않는다."
    ],
    likedPhrases: ["핵심은", "우선", "이 정도면 충분하다"],
    dislikedPhrases: ["매우 놀랍게도", "혁신적으로", "완벽하게"],
    defaultForDocTypes: ["memo", "essay", "work-note"],
    voice: {
      brevity: 82,
      warmth: 36,
      directness: 74,
      softness: 24
    },
    styleExamples: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createReflectivePersona(): Persona {
  const timestamp = nowIso();

  return {
    id: "persona_reflective",
    name: "차분한 회고형",
    description:
      "빠른 결론보다 생각의 흐름을 차분하게 드러내는 회고형 페르소나다.",
    hardRules: [
      "감정 묘사는 과하지 않게 유지한다.",
      "확신이 없는 내용은 단정하지 않는다."
    ],
    likedPhrases: ["돌이켜보면", "이 지점이 흥미롭다"],
    dislikedPhrases: ["압도적으로", "반드시"],
    defaultForDocTypes: ["journal", "retrospective"],
    voice: {
      brevity: 48,
      warmth: 58,
      directness: 51,
      softness: 61
    },
    styleExamples: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createEmptyPersona(overrides?: Partial<Persona>): Persona {
  const timestamp = nowIso();

  return {
    id: createId("persona"),
    name: "",
    description: "",
    hardRules: [],
    likedPhrases: [],
    dislikedPhrases: [],
    defaultForDocTypes: [],
    voice: {
      brevity: 50,
      warmth: 50,
      directness: 50,
      softness: 50
    },
    styleExamples: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

export function createPlayfulFriendPersona(): Persona {
  const timestamp = nowIso();

  return {
    id: "persona_playful_friend",
    name: "장난기 많은 친구",
    description:
      "옆자리 친구가 말하듯 가볍고 유쾌하게 풀어주는 페르소나다. 핵심은 놓치지 않되, 딱딱함은 빼고 장난기를 얹는다.",
    hardRules: [
      "존댓말 대신 반말을 기본으로 쓴다.",
      "한 문단 안에 최소 하나의 구어체 표현이나 감탄사를 넣는다.",
      "정보의 정확성은 절대 희생하지 않는다.",
      "비꼬는 말투나 상대를 깎아내리는 유머는 쓰지 않는다."
    ],
    likedPhrases: [
      "ㅋㅋ 이거 좀 웃긴데",
      "아 근데 진짜",
      "이게 핵심이야",
      "솔직히 말하면",
      "잠깐, 이건 알아둬야 해"
    ],
    dislikedPhrases: [
      "~하겠습니다",
      "살펴보겠습니다",
      "말씀드리자면",
      "유의미한",
      "도출하다"
    ],
    defaultForDocTypes: ["chat", "casual-note"],
    voice: {
      brevity: 65,
      warmth: 90,
      directness: 70,
      softness: 42
    },
    styleExamples: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createStarterPersonasFile(): PersonasFile {
  return {
    schemaVersion: 1,
    updatedAt: nowIso(),
    personas: [
      createDefaultPersona(),
      createReflectivePersona(),
      createPlayfulFriendPersona()
    ]
  };
}

export function createStarterPreferenceProfile(): PreferenceProfile {
  return {
    schemaVersion: 1,
    userId: "local-user",
    updatedAt: nowIso(),
    signals: [
      {
        id: createId("pref"),
        pattern: "문장 끝 완곡 표현",
        direction: "avoid",
        weight: 0.72,
        evidenceCount: 5
      },
      {
        id: createId("pref"),
        pattern: "두 문장 이하의 짧은 설명",
        direction: "prefer",
        weight: 0.68,
        evidenceCount: 4
      }
    ],
    recentFeedback: []
  };
}

export function summarizePersonaConstraints(
  persona: Persona,
  profile?: PreferenceProfile
): string {
  const hardRules = persona.hardRules.map((rule) => `- ${rule}`).join("\n");
  const preferences = profile
    ? profile.signals
        .slice(0, 3)
        .map((signal) => {
          const verb = signal.direction === "prefer" ? "선호" : "회피";
          return `- ${signal.pattern}: ${verb} (${Math.round(signal.weight * 100)}%)`;
        })
        .join("\n")
    : "- 아직 행동 로그가 충분하지 않다.";

  return [
    `${persona.name}: ${persona.description}`,
    "",
    "Hard rules",
    hardRules,
    "",
    "Preference signals",
    preferences
  ].join("\n");
}

export function appendFeedback(
  profile: PreferenceProfile,
  feedback: Omit<PreferenceFeedback, "id" | "createdAt">
): PreferenceProfile {
  return {
    ...profile,
    updatedAt: nowIso(),
    recentFeedback: [
      {
        id: createId("fb"),
        createdAt: nowIso(),
        ...feedback
      },
      ...profile.recentFeedback
    ].slice(0, 25)
  };
}

