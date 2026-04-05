# Cowrite

> AI-native block editor with personalized writing personas — powered by Claude Code via MCP.

Cowrite는 사용자의 글쓰기 스타일과 페르소나를 학습하고, Claude Code가 MCP 프로토콜을 통해 문서를 직접 읽고 수정할 수 있는 **데스크톱 블록 에디터**입니다.

## Highlights

- **Block-based Editor** — BlockNote 기반 Notion 스타일 블록 에디터
- **Persona System** — 글쓰기 톤과 스타일을 페르소나로 관리
- **MCP Integration** — Claude Code가 문서를 의미 단위로 조회·수정
- **Preview-first Patches** — AI 수정 사항을 미리보고 승인/거절
- **Local-first** — 모든 데이터는 로컬에 저장, 클라우드 의존 없음

## Tech Stack

| Layer | Tech |
|-------|------|
| App Shell | Tauri 2 + React |
| Editor | BlockNote |
| AI Bridge | MCP (stdio) → Claude Code |
| Language | TypeScript + Rust |
| Runtime | Bun |

## Project Structure

```
apps/
  desktop/          Tauri + React desktop app
  vscode/           VS Code extension (planned)

packages/
  writer-ai         Prompt engineering & rewrite helpers
  writer-core       Document schema, types, adapters, patch logic
  writer-mcp        Local stdio MCP server
  writer-storage    File persistence & snapshots
  writer-ui         Shared React UI components
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) 1.1+
- [Rust](https://rustup.rs) toolchain
- Xcode Command Line Tools (macOS)

```bash
# macOS에서 빠진 도구 설치
brew install rustup-init && rustup-init
xcode-select --install
```

### Run

```bash
bun install
bun run dev          # Tauri 데스크톱 앱 실행
```

```bash
bun run dev:mcp      # MCP 서버 단독 실행
```

### Build

```bash
bun run build        # 전체 워크스페이스 빌드
bun run typecheck    # 타입 체크
```

## MCP Server

Claude Code에서 Cowrite 문서에 접근하려면 MCP 설정을 추가하세요:

```json
{
  "mcpServers": {
    "writer-mcp": {
      "command": "bun",
      "args": ["run", "dev:mcp"],
      "cwd": "/path/to/cowrite"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `document.list` | 문서 목록 조회 |
| `document.read` | 문서 내용 읽기 |
| `document.create` | 새 문서 생성 |
| `document.export` | 문서 내보내기 |
| `rewrite.selection` | 선택 영역 리라이트 |
| `patch.preview` | 패치 미리보기 |
| `patch.apply` | 패치 적용 |
| `patch.reject` | 패치 거절 |
| `persona.list` | 페르소나 목록 |
| `persona.activate` | 페르소나 활성화 |
| `preference.record_feedback` | 사용자 피드백 기록 |

## License

Private — All rights reserved.
