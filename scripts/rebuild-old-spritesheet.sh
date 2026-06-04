#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work_dir="${repo_root}/tmp/sprite_audit"
build_dir="${work_dir}/build"
current_dir="${work_dir}/current"
old_export_dir="${work_dir}/old_export_128"
rearranged_dir="${work_dir}/rearranged"
out_sheet="${repo_root}/static/lizsprites_old_rearranged.png"
inferred_source_sheet="${work_dir}/sprites_inferred_16px_source.png"

require_file() {
  local path="$1"
  if [[ ! -f "${path}" ]]; then
    printf 'Missing required file: %s\n' "${path}" >&2
    exit 1
  fi
}

clean_dir() {
  local path="$1"
  case "${path}" in
    "${repo_root}/tmp/sprite_audit"/*) ;;
    *)
      printf 'Refusing to clean unexpected path: %s\n' "${path}" >&2
      exit 1
      ;;
  esac

  mkdir -p "${path}"
  find "${path}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
}

crop_sheet() {
  local src="$1"
  local cell="$2"
  local dest="$3"

  clean_dir "${dest}"
  magick "${src}" -crop "${cell}" +repage "${dest}/frame_%02d.png"
}

place_frame() {
  local index="$1"
  local image="$2"
  local x=$(( (index % 26) * 32 ))
  local y=$(( (index / 26) * 32 ))

  require_file "${image}"
  magick "${out_sheet}" "${image}" -geometry "+${x}+${y}" -composite "PNG32:${out_sheet}"
}

place_henchman_pair() {
  local current_index="$1"
  local old_index="$2"
  local old_name
  old_name="$(printf '%02d' "${old_index}")"

  place_frame "${current_index}" "${build_dir}/base/${old_name}.png"
  place_frame "$(( current_index + 1 ))" "${build_dir}/overlay/${old_name}.png"
}

require_file "${repo_root}/static/lizsprites.png"
require_file "${repo_root}/static/sprites.png"

mkdir -p "${work_dir}"
crop_sheet "${repo_root}/static/lizsprites.png" "32x32" "${current_dir}"
crop_sheet "${repo_root}/static/sprites.png" "128x128" "${old_export_dir}"
magick "${repo_root}/static/sprites.png" -filter point -resize 128x128 "PNG32:${inferred_source_sheet}"

clean_dir "${build_dir}"
mkdir -p "${build_dir}/resized" "${build_dir}/base" "${build_dir}/overlay"

for old_frame in "${old_export_dir}"/frame_*.png; do
  old_base="$(basename "${old_frame}")"
  old_number="${old_base#frame_}"
  old_number="${old_number%.png}"
  source_16="${build_dir}/source16/${old_number}.png"
  resized="${build_dir}/resized/${old_number}.png"

  mkdir -p "${build_dir}/source16"
  magick "${old_frame}" -filter point -resize 16x16 "PNG32:${source_16}"
  magick "${source_16}" -filter point -resize 32x32 "PNG32:${resized}"
  magick "${resized}" -channel A -fx 'a*(intensity<0.70)' +channel "PNG32:${build_dir}/base/${old_number}.png"
  magick "${resized}" -fill white -colorize 100 -channel A -fx 'a*(intensity>=0.70)' +channel "PNG32:${build_dir}/overlay/${old_number}.png"
done

magick -size 832x64 xc:none "PNG32:${out_sheet}"

# Henchmen: current even-index frame plus tint overlay at index + 1.
place_henchman_pair 0 0    # STAND
place_henchman_pair 2 2    # STUNNED
place_henchman_pair 4 10   # DODGING
place_henchman_pair 8 11   # BLOCKING
place_henchman_pair 10 9   # DEAD
place_henchman_pair 12 17  # PUNCH_AFTER
place_henchman_pair 14 16  # PUNCH_BEFORE
place_henchman_pair 18 8   # PRONE
place_henchman_pair 20 24  # SHOOT_BEFORE
place_henchman_pair 22 25  # SHOOT_AFTER

# Player frames are single-layer in current code, so these are copied complete.
place_frame 26 "${build_dir}/resized/41.png" # BM_STUN_AFTER / current misc fallback
place_frame 27 "${build_dir}/resized/46.png" # BM_PUNCH_BEFORE
place_frame 28 "${build_dir}/resized/47.png" # BM_PUNCH_AFTER
place_frame 29 "${build_dir}/resized/44.png" # BM_THROW_BEFORE, unused by current code
place_frame 30 "${build_dir}/resized/45.png" # BM_THROW_AFTER, unused by current code
place_frame 31 "${build_dir}/resized/40.png" # BM_STAND_S fallback from old BM_STAND
place_frame 32 "${build_dir}/resized/42.png" # BM_STUNNED fallback from old BM_STUN_BEFORE
place_frame 33 "${build_dir}/resized/40.png" # BM_STAND_E fallback from old BM_STAND
place_frame 34 "${build_dir}/resized/40.png" # BM_STAND_N fallback from old BM_STAND

crop_sheet "${out_sheet}" "32x32" "${rearranged_dir}"

rearranged_frames=()
while IFS= read -r -d '' frame; do
  rearranged_frames+=("${frame}")
done < <(find "${rearranged_dir}" -name 'frame_*.png' -print0 | sort -z)

magick montage "${rearranged_frames[@]}" \
  -background '#d8d8d8' \
  -filter point \
  -resize 300% \
  -geometry +4+4 \
  "${work_dir}/rearranged_contact.png"

printf 'Wrote %s\n' "${out_sheet}"
printf 'Wrote %s\n' "${work_dir}/rearranged_contact.png"
