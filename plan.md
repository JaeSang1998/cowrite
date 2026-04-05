# Writer MCP 기반 개인화 블록 에디터 기술결정 문서

## 문서 상태

* 상태: 승인안
* 버전: v1.0
* 작성 목적: 제품 방향, 기술 스택, 저장 포맷, MCP 인터페이스, 앱 셸, 초기 구현 범위를 하나의 기준 문서로 고정한다.

---

## 1. 한 줄 정의

우리가 만드는 제품은 **사용자 기호와 페르소나를 저장하고, Claude Code가 MCP를 통해 문서를 읽고 수정할 수 있는 Notion형 블록 기반 글쓰기 에디터**다.

이 제품은 일반적인 AI 글 생성기가 아니다. 핵심은 다음 세 가지다.

1. 사용자의 **기호와 페르소나를 UX로 직접 관리**할 수 있어야 한다.
2. 문서는 **블록 기반 JSON 문서**로 저장되어야 한다.
3. Claude Code는 브라우저를 직접 조작하는 것이 아니라 **MCP를 통해 문서/선택구간/코멘트/패치**를 의미 단위로 다뤄야 한다.

---

## 2. 이번 문서에서 최종 확정하는 결정

### 최종 결정 요약

* 제품 형태: **데스크톱 우선 앱**
* 앱 셸: **Tauri**
* 에디터: **BlockNote**
* 저장 포맷: **우리 서비스가 소유하는 canonical JSON 문서 포맷**
* AI 연결 방식: **local stdio MCP 서버 (`writer-mcp`)**
* Claude 연동 대상: **Claude Code**
* 문서 수정 방식: **preview-first patch apply**
* 사용자 스타일 모델: **Persona + Preference Profile 분리 구조**
* 주석 방식: **highlight/annotation + thread/comment 분리 저장**
* 초기 저장 전략: **로컬 파일 우선 + 선택적 클라우드 동기화는 후순위**
* VS Code 연동: **2단계 확장 전략**, 초기 핵심 제품 아님

### 이번에 채택하지 않는 것

* 웹 브라우저만으로 시작하는 SaaS 우선 전략
* Markdown을 canonical source로 쓰는 전략
* DOM 직접 조작 기반 AI 편집 구조
* Claude Code 대신 자체 agent runtime을 먼저 만드는 전략
* 협업/실시간 멀티플레이를 v1 핵심 범위에 넣는 것

---

## 3. 제품 목표와 비목표

## 목표

* 사용자가 자신의 말투, 문장 리듬, 싫어하는 표현, 선호 문체를 서비스 안에서 직접 관리할 수 있게 한다.
* 긴 글, 에세이, 브레인덤프, 메모, 업무 문서 초안을 블록 단위로 편집하게 한다.
* 형광펜, 댓글, 선택 구간 피드백을 통해 AI가 특정 범위만 재작성하게 한다.
* Claude Code가 MCP를 통해 현재 문서, 활성 페르소나, 선택 영역, 스레드를 읽고 패치를 제안하게 한다.
* 사용자의 채택/거절/수동 수정 로그를 향후 preference 업데이트에 활용한다.

## 비목표

* AI 탐지기 우회 서비스가 되는 것
* 완전 자동 문서 생성기가 되는 것
* 코드 에디터를 대체하는 것
* Google Docs/Notion 급 협업 플랫폼을 첫 버전에 재현하는 것
* 복잡한 멀티 유저 권한/조직 관리 기능을 v1에 넣는 것

---

## 4. 제품 원칙

### 4.1 전체 재작성보다 부분 수정

문서 전체를 다시 생성하는 것보다, 블록/문장/선택 구간 수준의 수정이 우선이다.

### 4.2 스타일과 내용 보존을 분리

AI는 말투와 표현을 바꿀 수 있지만, 사용자의 논지와 핵심 의미를 임의로 재구성해서는 안 된다.

### 4.3 사용자 취향은 설명보다 행동으로 학습

설정 페이지에서 입력한 페르소나도 중요하지만, 실제 accept/reject/manual edit 행동이 더 중요한 신호다.

### 4.4 모든 자동 수정은 preview-first

기본 동작은 바로 덮어쓰기가 아니라 patch preview 후 승인이다.

### 4.5 편집기의 주도권은 앱이 가진다

Claude Code는 외부 편집 에이전트다. 문서 상태와 저장, 버전, 승인 절차는 앱이 통제한다.

---

## 5. 전체 시스템 구조

```text
[Tauri Desktop App]
  ├─ React UI
  ├─ BlockNote Editor
  ├─ Persona Studio
  ├─ Comment / Thread Sidebar
  ├─ Diff / Patch Review
  └─ Local File Manager

[writer-core]
  ├─ canonical document schema
  ├─ annotation/thread model
  ├─ persona/profile model
  ├─ patch format
  └─ validation / migrations

[writer-mcp]
  ├─ stdio MCP server
  ├─ document resources
  ├─ persona resources
  ├─ patch tools
  ├─ comment tools
  └─ prompt templates

[Claude Code]
  └─ uses writer-mcp as external MCP server
```

핵심은 **UI, 문서 모델, MCP 서버를 분리**하는 것이다.

* Tauri 앱은 사용자 경험을 담당한다.
* `writer-core`는 문서와 스타일의 진실한 데이터 모델을 담당한다.
* `writer-mcp`는 Claude Code가 접근하는 표면이다.

---

## 6. 최종 기술 선택

## 6.1 앱 셸: Tauri

### 선택 이유

* 데스크톱 앱으로 빠르게 배포 가능하다.
* 프론트는 React/TypeScript로 작성하고, 로컬 시스템 자원 접근은 Tauri가 담당한다.
* 외부 바이너리(sidecar)와의 결합이 용이하다.
* 이후 Windows/macOS/Linux를 동시에 지원하기 쉽다.

### 최종 판단

**초기 제품의 공식 셸은 Tauri다.**

### 대안과 기각 이유

* Electron: 생태계는 넓지만 앱 크기와 리소스 측면에서 초기 방향과 맞지 않는다.
* 웹앱 우선: Claude Code + local stdio MCP 조합과의 결합력이 떨어지고 로컬 파일 경험이 약하다.

---

## 6.2 에디터: BlockNote

### 선택 이유

* 블록 기반 문서 모델이 제품 방향과 직접 맞닿아 있다.
* 드래그 가능한 블록 UX를 기본 전제로 가진다.
* JSON 기반 문서 구조가 명확하다.
* 댓글/스레드/협업 확장 가능성이 있다.

### 최종 판단

**초기 리치 텍스트 편집기는 BlockNote를 사용한다.**

### 대안과 기각 이유

* Tiptap: 강력하지만 범용 rich-text tree 성격이 더 강해서 block-first discipline을 별도로 강하게 설계해야 한다.
* Lexical: 성능과 구조는 좋지만 이번 제품의 블록 중심 UX와 생태계 측면에서 BlockNote보다 직접적이지 않다.

---

## 6.3 저장 포맷: app-owned canonical JSON

### 최종 판단

문서는 Markdown이 아니라 **우리 앱이 소유하는 canonical JSON 문서 포맷**으로 저장한다.

### 이유

* 블록 ID를 안정적으로 유지할 수 있다.
* 형광펜/댓글/스레드/anchor를 안정적으로 연결할 수 있다.
* Claude Code가 block/selection/patch 단위로 문서를 다루기 좋다.
* 향후 schema migration과 versioning이 쉽다.

### 저장 포맷 원칙

* BlockNote 내부 표현을 그대로 영구 저장 포맷으로 삼지 않는다.
* BlockNote는 렌더링/편집 런타임이다.
* 장기 저장 포맷은 `writer-core`가 정의한 schema를 따른다.

### 파생 포맷

* Markdown: export 용도
* HTML: render / preview 용도
* plain text: 검색 / LLM 압축 입력 용도

canonical source는 오직 JSON 문서다.

---

## 6.4 AI 연결 방식: local stdio MCP

### 최종 판단

Claude Code와의 1차 연결 방식은 **local stdio MCP**로 고정한다.

### 이유

* 개발이 가장 단순하다.
* Claude Code와의 연결 방식이 명확하다.
* 로컬 문서와 사용자 스타일 데이터를 안전하게 같은 머신에서 다루기 쉽다.
* 클라우드 인프라 없이도 제품의 핵심 가치를 검증할 수 있다.

### 대안과 기각 이유

* remote MCP from day 1: 인증/인가/호스팅/멀티테넌시 부담이 너무 크다.
* 직접 API 통합: MCP가 주는 표준 자산을 버리게 된다.

---

## 6.5 Claude 연동 대상: Claude Code

### 최종 판단

초기 AI 편집 엔진은 **Claude Code**를 우선 대상으로 한다.

### 이유

* MCP 친화적이다.
* 로컬 파일 및 외부 도구와의 결합 모델이 자연스럽다.
* 개발자가 실제로 사용하는 흐름과 가깝다.
* 이후 VS Code 진입점 확장에도 유리하다.

### 비고

앱 내부에 별도 에이전트 런타임을 직접 구현하는 것은 후순위다.

---

## 6.6 VS Code 연동의 위치

### 최종 판단

VS Code는 **2단계 확장 포인트**로 둔다.

### 정의

* 1단계: Tauri 앱이 제품의 공식 메인 경험
* 2단계: 동일한 문서 포맷을 VS Code custom editor 또는 companion extension으로 연다

### 이유

이번 제품의 핵심은 코드 편집이 아니라 **개인화된 글쓰기 편집 경험**이다. 따라서 VS Code는 핵심 제품이 아니라 추가 진입점이다.

---

## 7. 도메인 모델

## 7.1 핵심 엔터티

* User
* Persona
* PreferenceProfile
* Document
* Block
* Annotation
* Thread
* Comment
* PatchProposal
* DocumentVersion

---

## 7.2 Persona와 PreferenceProfile의 분리

### Persona

사용자가 명시적으로 정의하는 상위 캐릭터다.
예시:

* 담백하고 건조한 설명형
* 부드럽고 차분한 회고형
* 짧고 단정한 메모형

### PreferenceProfile

실제 행동 로그를 반영한 하위 선호 모델이다.
예시:

* 길이가 2문장 이하일 때 수락률이 높음
* 과한 연결어 포함 시 거절률 상승
* 문장 말미 완곡 표현을 싫어함

### 최종 판단

**Persona는 명시적 UX 객체로, PreferenceProfile은 학습형 내부 모델로 분리한다.**

---

## 8. canonical document schema

## 8.1 문서 최상위 구조

```json
{
  "schemaVersion": 1,
  "docId": "doc_123",
  "title": "초안",
  "activePersonaId": "persona_default",
  "blocks": [],
  "annotations": [],
  "threads": [],
  "versions": [],
  "metadata": {
    "createdAt": "2026-04-01T10:00:00+09:00",
    "updatedAt": "2026-04-01T10:00:00+09:00",
    "tags": []
  }
}
```

## 8.2 Block 구조

```json
{
  "id": "b1",
  "type": "paragraph",
  "props": {
    "textAlign": "left"
  },
  "content": [
    {
      "type": "text",
      "text": "이 문장은 조금 과하게 정리된 느낌이 난다.",
      "marks": []
    }
  ],
  "children": []
}
```

## 8.3 Annotation 구조

```json
{
  "id": "a1",
  "kind": "highlight",
  "anchor": {
    "blockId": "b1",
    "start": 4,
    "end": 15,
    "quote": "조금 과하게 정리된"
  },
  "threadId": "t1"
}
```

## 8.4 Thread / Comment 구조

```json
{
  "id": "t1",
  "resolved": false,
  "comments": [
    {
      "id": "c1",
      "authorId": "u1",
      "body": "너무 AI 같음. 더 건조하게.",
      "createdAt": "2026-04-01T10:00:00+09:00"
    }
  ]
}
```

### schema 원칙

* 블록은 블록대로 저장한다.
* 주석은 본문 안에 인라인으로 박지 않는다.
* highlight/selection/comment를 분리 저장한다.
* anchor는 가능한 한 stable identifier + quote + offset 조합으로 가진다.

---

## 9. 패치 모델

## 9.1 왜 patch 모델이 필요한가

Claude Code가 전체 문서를 다시 생성하면 승인, diff, 되돌리기, 부분 적용이 어렵다. 따라서 모든 AI 편집은 **patch proposal** 형태로 다룬다.

## 9.2 PatchProposal 구조

```json
{
  "patchId": "p1",
  "docId": "doc_123",
  "target": {
    "type": "range",
    "blockId": "b1",
    "start": 4,
    "end": 15
  },
  "operation": "replace_text",
  "before": "조금 과하게 정리된",
  "after": "다소 매끈하게 정리된",
  "reason": "활성 페르소나의 건조하고 덜 과장된 스타일에 맞춤"
}
```

## 9.3 패치 원칙

* 모든 자동 편집은 patch로 제안한다.
* 사용자는 accept / reject / edit before apply를 할 수 있어야 한다.
* 문서 전체 replace는 v1에서 금지한다.
* 여러 patch를 묶어서 batch apply는 가능하되, UI상 검토 단계를 반드시 둔다.

---

## 10. MCP 설계

## 10.1 MCP 서버 이름

`writer-mcp`

## 10.2 역할

* 문서, 선택 구간, 페르소나, 코멘트, 버전을 Claude Code에 노출한다.
* Claude Code가 문서를 직접 수정하지 않고, tool을 통해 patch proposal을 생성/적용하게 한다.

## 10.3 MCP 리소스

### resources

* `writer://users/{userId}/personas`
* `writer://users/{userId}/active-persona`
* `writer://users/{userId}/preference-profile`
* `writer://docs/{docId}`
* `writer://docs/{docId}/blocks/{blockId}`
* `writer://docs/{docId}/threads`
* `writer://docs/{docId}/versions`

### 원칙

* 리소스는 읽기 전용 맥락 전달에 사용한다.
* 리소스로 현재 상태를 읽고, 실제 변경은 tool로 수행한다.

---

## 10.4 MCP 툴

### 문서 관련

* `document.list`
* `document.read`
* `document.create`
* `document.export`

### 선택/주석 관련

* `selection.create`
* `annotation.create_highlight`
* `thread.create`
* `comment.create`
* `thread.resolve`

### 편집 관련

* `rewrite.selection`
* `rewrite.block`
* `rewrite.blocks`
* `patch.preview`
* `patch.apply`
* `patch.reject`

### 페르소나 관련

* `persona.list`
* `persona.create`
* `persona.update`
* `persona.activate`
* `preference.record_feedback`

### Arena 관련

* `arena.generate_candidates`
* `arena.choose_candidate`

---

## 10.5 MCP prompts

* `rewrite_as_active_persona`
* `soften_selected_text`
* `make_less_ai_like_without_losing_meaning`
* `review_selected_block`
* `summarize_persona_constraints`

prompts는 사용자 주도 명령의 UX 표현으로 사용한다.

---

## 11. UX 설계

## 11.1 핵심 화면

### A. Document Editor

* BlockNote 기반 블록 에디터
* 드래그로 블록 순서 변경
* 인라인 텍스트 선택
* formatting toolbar
* highlight 추가
* comment 생성

### B. Threads Sidebar

* 선택 구간과 연결된 코멘트 스레드 목록
* reply / resolve / reopen
* AI 제안 스레드와 사용자 스레드를 구분

### C. Persona Studio

* 페르소나 카드 목록
* 축 슬라이더
* hard rules 입력
* 좋아하는 표현 / 싫어하는 표현 관리
* 문서 타입별 기본 페르소나 설정

### D. Patch Review Panel

* before / after diff
* patch 별 승인
* reason 표시
* batch apply

### E. Arena Panel

* 같은 대상에 대해 2~3개 rewrite 후보 표시
* 어떤 후보가 더 나은지 선택
* 선택 이유 태그 입력

---

## 11.2 v1 UX 원칙

* Notion 전체를 복제하지 않는다.
* 블록 드래그, 선택 기반 주석, 패치 승인에 집중한다.
* command palette나 slash command는 최소 범위만 제공한다.
* 멀티 유저 협업은 UI로 노출하지 않는다.

---

## 12. 저장 전략

## 12.1 로컬 우선 저장

초기 버전의 기본 저장소는 로컬 파일 시스템이다.

### 이유

* local stdio MCP와 결합이 단순하다.
* 개인정보/문서가 로컬에 남는다.
* 클라우드 계정/동기화 없이도 제품 가치 검증이 가능하다.

## 12.2 파일 구조

기본 제안:

* `project.writer/`

  * `document.json`
  * `personas.json`
  * `preferences.json`
  * `versions/`
  * `exports/`

또는 단일 문서 파일 모델:

* `my-draft.writer.json`

### 최종 판단

**v1은 단일 문서 파일 + 보조 사용자 설정 파일 구조**로 간다.

예시:

* `draft.writer.json`
* `~/.writer/personas.json`
* `~/.writer/preferences.json`

---

## 13. 버전 관리와 되돌리기

## 13.1 원칙

* 모든 patch apply 전후에 snapshot을 남긴다.
* 최소 문서 단위 undo/redo와 patch revert를 지원한다.
* AI 편집은 항상 version note를 남긴다.

## 13.2 버전 저장 방식

v1에서는 CRDT가 아니라 **snapshot + patch log** 방식으로 간다.

### 이유

* 단일 사용자 데스크톱 중심 제품에 충분하다.
* 디버깅과 복구가 단순하다.
* 복잡한 협업 동기화 문제를 피할 수 있다.

---

## 14. 향후 협업 전략

협업은 v1 범위가 아니다. 다만 에디터 선택과 데이터 모델은 향후 협업을 막지 않아야 한다.

### 미래 방향

* Yjs 기반 동기화 레이어 도입 가능성 고려
* 코멘트/스레드/annotations는 이미 협업 친화적으로 분리 저장
* 단, v1 canonical JSON은 snapshot source이며 CRDT source는 아니다

### 결정

**실시간 협업은 roadmap에 두되, 현재 구현 범위에서는 제외한다.**

---

## 15. 보안 및 안전성

## 15.1 기본 원칙

* AI가 직접 문서를 덮어쓰지 못하게 한다.
* 모든 실제 변경은 patch apply tool을 거친다.
* destructive operation은 UI 승인이 필요하다.

## 15.2 Tauri 보안 원칙

* shell/plugin 사용 범위를 최소화한다.
* 실행 가능한 바이너리와 인자 범위를 제한한다.
* 문서 경로 접근은 명시적 허용 범위로 제한한다.

## 15.3 MCP 보안 원칙

* writer-mcp는 최소 권한 원칙으로 동작한다.
* 문서 읽기와 변경 툴을 명확히 구분한다.
* apply 도구는 사용자의 승인 상태 없이는 실행되지 않는다.

---

## 16. 모노레포 구조

```text
/apps
  /desktop        -> Tauri + React 앱
  /vscode         -> 향후 VS Code extension

/packages
  /writer-core    -> schema, types, patch engine, validators, migrations
  /writer-ui      -> shared UI components
  /writer-mcp     -> local stdio MCP server
  /writer-ai      -> prompt builders, candidate generation helpers
  /writer-storage -> local file read/write, version snapshots
```

### 언어 선택

* 프론트엔드: TypeScript
* MCP 서버: TypeScript
* Tauri 네이티브 셸: Rust

### 결정 이유

초기 속도와 재사용성을 위해 core, mcp, ui를 TypeScript 중심으로 구성한다.

---

## 17. 구현 우선순위

## Phase 1: core foundations

* canonical schema 정의
* block/annotation/thread/persona 타입 구현
* document load/save
* patch format + validation

## Phase 2: editor app

* Tauri 앱 셸
* BlockNote 에디터 렌더링
* highlight + comment sidebar
* persona studio
* patch review panel

## Phase 3: writer-mcp

* stdio MCP 서버
* resource surface 구현
* rewrite / patch / comment tool 구현
* Claude Code 연동 테스트

## Phase 4: preference loop

* accept/reject/manual edit 로그 수집
* Arena 후보 생성
* 선택 결과 반영
* preference profile 업데이트

## Phase 5: export and polish

* markdown/html export
* document history UI
* crash recovery
* packaging and install flow

---

## 18. v1 필수 기능 범위

### 반드시 포함

* 블록 기반 문서 편집
* 형광펜 선택 및 코멘트
* Persona Studio
* 활성 페르소나 기반 rewrite
* patch preview / apply / reject
* local stdio MCP server
* Claude Code 연결 가이드

### 있으면 좋지만 v1 필수는 아님

* Arena 비교 UI
* 문서 export 템플릿
* 다중 문서 workspace
* VS Code 확장

### v1 제외

* 실시간 협업
* 팀 워크스페이스
* 원격 동기화
* 모바일 앱
* 완전 자동 리라이트 모드

---

## 19. 성공 기준

### 제품 성공 지표

* 사용자가 직접 설정한 persona를 재사용하는 비율
* AI 패치 수락률
* 패치 후 수동 재수정 비율
* comment 기반 편집 요청 반복 사용률
* "내 글 같다" 자가 평가

### 기술 성공 지표

* 손상 없이 문서 round-trip 가능
* patch apply 실패율 낮음
* annotation anchor 유지율 높음
* app crash 후 복구 가능
* Claude Code + writer-mcp 연결 성공률 높음

---

## 20. 주요 리스크와 대응

## 리스크 1: canonical schema와 editor runtime 간 불일치

대응:

* `writer-core`를 유일한 source of truth로 둔다.
* BlockNote adapter layer를 둔다.
* import/export 테스트를 만든다.

## 리스크 2: selection anchor가 편집 후 깨짐

대응:

* blockId + offset + quote 기반 앵커 사용
* patch 적용 시 re-anchor 로직 도입
* resolve 불가능한 경우 사용자에게 재연결 요청

## 리스크 3: Claude Code가 과도하게 넓은 변경을 제안

대응:

* tool schema에서 target scope를 강하게 제한
* selection/block rewrite만 허용
* whole-document replace는 금지

## 리스크 4: 앱이 너무 IDE처럼 보이거나 너무 노션처럼 보이는 정체성 혼란

대응:

* 제품 메시지를 "개인화 글쓰기 편집기"로 고정
* 코딩 기능보다 문서 편집 경험을 전면에 둔다.

---

## 21. 초기 구현 상세 결정

### 프론트엔드 프레임워크

* React + TypeScript

### 상태 관리

* Zustand

### 스타일링

* Tailwind CSS

### 스키마 검증

* Zod

### 로컬 저장

* JSON 파일 + app data directory

### diff 엔진

* 텍스트 단위 diff + block 범위 diff 조합

### IDs

* ULID 또는 nanoid 기반 stable ID

### 시간 표현

* ISO 8601 string 저장

---

## 22. 문서 편집 명령의 기본 UX

사용자가 텍스트를 선택하고 아래 중 하나를 실행한다.

* 이 부분만 더 담백하게
* 이 부분만 내 말투로
* 더 건조하게
* 덜 친절하게
* 더 짧게
* 리듬만 살리고 의미는 유지
* AI 같은 느낌 줄이기

이 명령은 내부적으로 다음 순서로 동작한다.

1. selection 생성
2. active persona 조회
3. 관련 hard rules / preference 조회
4. rewrite tool 실행
5. patch proposal 생성
6. preview 표시
7. accept / reject / edit
8. feedback 기록

---

## 23. 출시 전략

## v1 출시 형태

* macOS 우선
* local-only app
* Claude Code 사용자 대상 초기 배포

## 이유

* Claude Code와 MCP 활용도가 높은 초기 타깃과 맞는다.
* 데스크톱 글쓰기 툴의 로컬 경험을 먼저 검증할 수 있다.
* macOS 중심으로 먼저 품질을 맞추기 쉽다.

## 이후 확장

* Windows 지원
* remote sync 옵션
* VS Code extension
* collaborative mode

---

## 24. 최종 결론

우리는 다음 구조로 제품을 만든다.

* **제품 형태**: 개인화 글쓰기용 데스크톱 블록 에디터
* **앱 셸**: Tauri
* **에디터**: BlockNote
* **문서 소스**: app-owned canonical JSON
* **AI 연결**: local stdio MCP (`writer-mcp`)
* **AI 실행자**: Claude Code
* **스타일 모델**: Persona + PreferenceProfile
* **편집 방식**: 선택 구간 기반 patch preview + apply
* **주석 모델**: highlight/annotation + thread/comment 분리
* **로드맵**: Tauri first, VS Code later, remote sync later, collaboration later

이 문서는 v1 구현의 기준 문서로 사용한다. 이후 변경은 별도의 ADR 또는 버전 갱신으로만 수행한다.

---

## 25. 바로 착수할 작업 목록

1. `writer-core` 타입 시스템 정의
2. `writer-doc.schema.json` 작성
3. BlockNote adapter 설계
4. Tauri 앱 초기 셸 생성
5. `writer-mcp serve` stdio 서버 생성
6. `document.read`, `rewrite.selection`, `patch.apply` 3개 툴부터 구현
7. Persona Studio 첫 화면 제작
8. Patch Review 패널 제작

이 8개가 끝나면 첫 번째 작동 가능한 프로토타입이 나온다.
