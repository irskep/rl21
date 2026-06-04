#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

remove_path() {
  local path="$1"
  case "${path}" in
    "${repo_root}/yarn.lock" | \
    "${repo_root}/yarn-error.log" | \
    "${repo_root}/node_modules" | \
    "${repo_root}/.yarn" | \
    "${repo_root}/.yarnrc.yml")
      ;;
    *)
      printf 'Refusing to remove unexpected path: %s\n' "${path}" >&2
      exit 1
      ;;
  esac

  if [[ -e "${path}" || -L "${path}" ]]; then
    rm -rf -- "${path}"
    printf 'Removed %s\n' "${path}"
  fi
}

remove_path "${repo_root}/yarn.lock"
remove_path "${repo_root}/yarn-error.log"
remove_path "${repo_root}/node_modules"
remove_path "${repo_root}/.yarn"
remove_path "${repo_root}/.yarnrc.yml"
