#!/usr/bin/env bash

set -euo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "Missing dependency: bun"
  echo "Install Bun first, then run 'bun install'."
  exit 1
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "Missing dependency: cargo"
  echo "Tauri needs the Rust toolchain."
  echo "Install Rust with one of the following:"
  echo "  brew install rustup-init && rustup-init"
  echo "  curl https://sh.rustup.rs -sSf | sh"
  echo "After install, restart the shell and confirm with 'cargo --version'."
  exit 1
fi

if ! command -v rustc >/dev/null 2>&1; then
  echo "Missing dependency: rustc"
  echo "Rust appears incomplete. Re-run rustup init or restart the shell."
  exit 1
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  if ! xcode-select -p >/dev/null 2>&1; then
    echo "Missing dependency: Xcode Command Line Tools"
    echo "Run 'xcode-select --install' and retry."
    exit 1
  fi
fi

echo "desktop-env-ok"

