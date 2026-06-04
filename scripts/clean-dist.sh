#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist_dir="${repo_root}/dist"

if [[ ! -d "${dist_dir}" ]]; then
  mkdir -p "${dist_dir}"
  exit 0
fi

case "${dist_dir}" in
  "${repo_root}/dist") ;;
  *)
    printf 'Refusing to clean unexpected path: %s\n' "${dist_dir}" >&2
    exit 1
    ;;
esac

find "${dist_dir}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
