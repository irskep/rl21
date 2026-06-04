#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work_dir="${repo_root}/tmp/sprite_audit"
build_dir="${work_dir}/hybrid_build"
liz_frames="${build_dir}/liz16"
old_export_frames="${build_dir}/old_export_128"
old_source_frames="${build_dir}/old16"
old_base_frames="${build_dir}/old_base"
old_overlay_frames="${build_dir}/old_overlay"
liz_sheet="${repo_root}/static/sprites_liz_reformatted.png"
hybrid_sheet="${repo_root}/static/sprites_hybrid.png"
manifest="${work_dir}/sprites_hybrid_manifest.json"
layout_doc="${work_dir}/sprites_hybrid_layout.md"

cols=32
rows=5
cell_size=16
sheet_width=$((cols * cell_size))
sheet_height=$((rows * cell_size))

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

cell_index() {
  local row="$1"
  local col="$2"
  printf '%d' "$((row * cols + col))"
}

place_frame() {
  local sheet="$1"
  local row="$2"
  local col="$3"
  local image="$4"
  local x=$((col * cell_size))
  local y=$((row * cell_size))

  require_file "${image}"
  magick "${sheet}" "${image}" -geometry "+${x}+${y}" -composite "PNG32:${sheet}"
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

manifest_first=1
manifest_start() {
  printf '[\n' > "${manifest}"
}

manifest_entry() {
  local row="$1"
  local col="$2"
  local name="$3"
  local source="$4"
  local source_index="$5"
  local status="$6"
  local notes="$7"
  local comma=""
  if [[ "${manifest_first}" -eq 0 ]]; then
    comma=","
  fi
  manifest_first=0

  printf '%s  {"name":"%s","row":%d,"col":%d,"index":%d,"x":%d,"y":%d,"w":16,"h":16,"source":"%s","sourceIndex":"%s","status":"%s","notes":"%s"}\n' \
    "${comma}" \
    "$(json_escape "${name}")" \
    "${row}" \
    "${col}" \
    "$(cell_index "${row}" "${col}")" \
    "$((col * cell_size))" \
    "$((row * cell_size))" \
    "$(json_escape "${source}")" \
    "$(json_escape "${source_index}")" \
    "$(json_escape "${status}")" \
    "$(json_escape "${notes}")" >> "${manifest}"
}

manifest_finish() {
  printf ']\n' >> "${manifest}"
}

copy_liz_henchman() {
  local col="$1"
  local name="$2"
  local current_base="$3"
  local status="$4"
  local notes="$5"
  local base_name
  local overlay_name
  base_name="$(printf '%02d' "${current_base}")"
  overlay_name="$(printf '%02d' "$((current_base + 1))")"

  place_frame "${liz_sheet}" 0 "${col}" "${liz_frames}/${base_name}.png"
  place_frame "${liz_sheet}" 1 "${col}" "${liz_frames}/${overlay_name}.png"
}

copy_hybrid_henchman_from_old() {
  local col="$1"
  local name="$2"
  local old_index="$3"
  local old_name
  old_name="$(printf '%02d' "${old_index}")"

  place_frame "${hybrid_sheet}" 0 "${col}" "${old_base_frames}/${old_name}.png"
  place_frame "${hybrid_sheet}" 1 "${col}" "${old_overlay_frames}/${old_name}.png"
  manifest_entry 0 "${col}" "henchman_base.${name}" "sprites.png" "${old_index}" "old" "Old pose downsampled from inferred 16x16 source."
  manifest_entry 1 "${col}" "henchman_overlay.${name}" "sprites.png" "${old_index}" "old" "Tint layer split from old light pixels."
}

copy_hybrid_henchman_from_liz() {
  local col="$1"
  local name="$2"
  local current_base="$3"
  local status="$4"
  local notes="$5"
  local base_name
  local overlay_name
  base_name="$(printf '%02d' "${current_base}")"
  overlay_name="$(printf '%02d' "$((current_base + 1))")"

  place_frame "${hybrid_sheet}" 0 "${col}" "${liz_frames}/${base_name}.png"
  place_frame "${hybrid_sheet}" 1 "${col}" "${liz_frames}/${overlay_name}.png"
  manifest_entry 0 "${col}" "henchman_base.${name}" "lizsprites.png" "${current_base}" "${status}" "${notes}"
  manifest_entry 1 "${col}" "henchman_overlay.${name}" "lizsprites.png" "$((current_base + 1))" "${status}" "${notes}"
}

copy_liz_batman() {
  local row="$1"
  local col="$2"
  local name="$3"
  local current_index="$4"
  local status="$5"
  local notes="$6"
  local current_name
  current_name="$(printf '%02d' "${current_index}")"

  place_frame "${liz_sheet}" "${row}" "${col}" "${liz_frames}/${current_name}.png"
}

copy_hybrid_batman_from_old() {
  local row="$1"
  local col="$2"
  local name="$3"
  local old_index="$4"
  local old_name
  old_name="$(printf '%02d' "${old_index}")"

  place_frame "${hybrid_sheet}" "${row}" "${col}" "${old_source_frames}/${old_name}.png"
  manifest_entry "${row}" "${col}" "${name}" "sprites.png" "${old_index}" "old" "Old pose downsampled from inferred 16x16 source."
}

copy_hybrid_batman_from_liz() {
  local row="$1"
  local col="$2"
  local name="$3"
  local current_index="$4"
  local status="$5"
  local notes="$6"
  local current_name
  current_name="$(printf '%02d' "${current_index}")"

  place_frame "${hybrid_sheet}" "${row}" "${col}" "${liz_frames}/${current_name}.png"
  manifest_entry "${row}" "${col}" "${name}" "lizsprites.png" "${current_index}" "${status}" "${notes}"
}

make_contact_sheet() {
  local sheet="$1"
  local out="$2"
  local crop_dir="$3"

  clean_dir "${crop_dir}"
  magick "${sheet}" -crop "${cell_size}x${cell_size}" +repage "${crop_dir}/frame_%03d.png"

  local frames=()
  while IFS= read -r -d '' frame; do
    frames+=("${frame}")
  done < <(find "${crop_dir}" -name 'frame_*.png' -print0 | sort -z)

  magick montage "${frames[@]}" \
    -background '#d8d8d8' \
    -filter point \
    -resize 400% \
    -geometry +4+4 \
    "${out}"
}

make_layout_doc() {
  cat > "${layout_doc}" <<'EOF'
# Hybrid Sprite Atlas Layout

All cells are 16x16. The atlas is 32 columns by 5 rows.

## Rows

- Row 0: `henchman_base`
- Row 1: `henchman_overlay`
- Row 2: `batman`
- Row 3: `batman_interact`
- Row 4: `objects_future`

## Columns

| Col | Pose |
|---:|---|
| 0 | stand_s |
| 1 | stand_e |
| 2 | stand_n |
| 3 | stumble |
| 4 | charge |
| 5 | dodge_forward |
| 6 | dodge_backward |
| 7 | dodging |
| 8 | stunned |
| 9 | stun_before |
| 10 | stun_after |
| 11 | prone |
| 12 | dead |
| 13 | block |
| 14 | punch_before |
| 15 | punch_after |
| 16 | punch_miss |
| 17 | super_before |
| 18 | super_after |
| 19 | knife_before |
| 20 | knife_after |
| 21 | shoot_hold |
| 22 | shoot_before |
| 23 | shoot_after |
| 24 | pickup |
| 25 | take_weapon |
| 26 | disable_weapon |
| 27 | throw_before |
| 28 | throw_after |
| 29 | catch |
| 30 | lose_weapon |
| 31 | box_flying |

## Notes

- `shoot_hold` is intentionally a Liz missing/redraw target in `sprites_hybrid.png`.
- Row 1 cells are henchman tint-overlay cells. Some are only a few hair/accent pixels, so they can look like stray dots when viewed alone.
EOF
}

require_file "${repo_root}/static/lizsprites.png"
require_file "${repo_root}/static/sprites.png"

mkdir -p "${work_dir}"
clean_dir "${build_dir}"
mkdir -p "${liz_frames}" "${old_export_frames}" "${old_source_frames}" "${old_base_frames}" "${old_overlay_frames}"

magick "${repo_root}/static/lizsprites.png" -crop 32x32 +repage "${build_dir}/liz32_%02d.png"
for frame in "${build_dir}"/liz32_*.png; do
  frame_base="$(basename "${frame}")"
  frame_number="${frame_base#liz32_}"
  frame_number="${frame_number%.png}"
  magick "${frame}" -sample 16x16 "PNG32:${liz_frames}/${frame_number}.png"
done

magick "${repo_root}/static/sprites.png" -crop 128x128 +repage "${old_export_frames}/frame_%02d.png"
for frame in "${old_export_frames}"/frame_*.png; do
  frame_base="$(basename "${frame}")"
  frame_number="${frame_base#frame_}"
  frame_number="${frame_number%.png}"
  magick "${frame}" -sample 16x16 "PNG32:${old_source_frames}/${frame_number}.png"
  magick "${old_source_frames}/${frame_number}.png" -channel A -fx 'a*(intensity<0.70)' +channel "PNG32:${old_base_frames}/${frame_number}.png"
  magick "${old_source_frames}/${frame_number}.png" -fill white -colorize 100 -channel A -fx 'a*(intensity>=0.70)' +channel "PNG32:${old_overlay_frames}/${frame_number}.png"
done

magick -size "${sheet_width}x${sheet_height}" xc:none "PNG32:${liz_sheet}"
magick -size "${sheet_width}x${sheet_height}" xc:none "PNG32:${hybrid_sheet}"
manifest_start

# Column map:
# 0 stand_s, 1 stand_e, 2 stand_n, 3 stumble, 4 charge, 5 dodge_forward,
# 6 dodge_backward, 7 dodging, 8 stunned, 9 stun_before, 10 stun_after,
# 11 prone, 12 dead, 13 block, 14 punch_before, 15 punch_after,
# 16 punch_miss, 17 super_before, 18 super_after, 19 knife_before,
# 20 knife_after, 21 shoot_hold, 22 shoot_before, 23 shoot_after,
# 24 pickup, 25 take_weapon, 26 disable_weapon, 27 throw_before,
# 28 throw_after, 29 catch, 30 lose_weapon, 31 box_flying.

# Liz compatibility sheet: fill runtime poses exactly, leave future-only slots transparent unless there is a reasonable current fallback.
copy_liz_henchman 0 "stand_s" 0 "liz" "Current runtime stand pose."
copy_liz_henchman 7 "dodging" 4 "liz" "Current runtime dodge pose."
copy_liz_henchman 8 "stunned" 2 "liz" "Current runtime stunned pose."
copy_liz_henchman 11 "prone" 18 "liz" "Current runtime prone pose."
copy_liz_henchman 12 "dead" 10 "liz" "Current runtime dead pose."
copy_liz_henchman 13 "block" 8 "liz" "Current runtime block pose."
copy_liz_henchman 14 "punch_before" 14 "liz" "Current runtime punch windup pose."
copy_liz_henchman 15 "punch_after" 12 "liz" "Current runtime punch followthrough pose."
copy_liz_henchman 16 "punch_miss" 6 "liz" "Current runtime miss pose."
copy_liz_henchman 17 "super_before" 14 "liz_fallback" "Current code aliases superpunch windup to punch windup."
copy_liz_henchman 18 "super_after" 12 "liz_fallback" "Current code aliases superpunch followthrough to punch followthrough."
copy_liz_henchman 21 "shoot_hold" 24 "liz" "Current runtime gun hold pose."
copy_liz_henchman 22 "shoot_before" 20 "liz" "Current runtime shoot windup pose."
copy_liz_henchman 23 "shoot_after" 22 "liz" "Current runtime shoot followthrough pose."

copy_liz_batman 2 0 "batman.stand_s" 31 "liz" "Current runtime south standing pose."
copy_liz_batman 2 1 "batman.stand_e" 33 "liz" "Current runtime east standing pose."
copy_liz_batman 2 2 "batman.stand_n" 34 "liz" "Current runtime north standing pose."
copy_liz_batman 2 8 "batman.stunned" 32 "liz" "Current runtime stunned pose."
copy_liz_batman 2 9 "batman.stun_before" 26 "liz_fallback" "Current code aliases Batman stun windup to misc/stun pose."
copy_liz_batman 2 10 "batman.stun_after" 26 "liz" "Current runtime misc/stun alias pose."
copy_liz_batman 2 12 "batman.dead" 26 "liz_fallback" "Current code aliases Batman dead to misc/stun pose."
copy_liz_batman 2 14 "batman.punch_before" 27 "liz" "Current runtime punch windup pose."
copy_liz_batman 2 15 "batman.punch_after" 28 "liz" "Current runtime punch followthrough pose."
copy_liz_batman 3 25 "batman_interact.take_weapon" 26 "liz_fallback" "Current code aliases taking weapon to misc/stun pose."
copy_liz_batman 3 26 "batman_interact.disable_weapon" 26 "liz_fallback" "Current code aliases disabling weapon to misc/stun pose."

# Hybrid sheet: old art wherever the old sheet had the pose; Liz art for missing or fallback slots.
copy_hybrid_henchman_from_old 0 "stand_s" 0
copy_hybrid_henchman_from_old 3 "stumble" 1
copy_hybrid_henchman_from_old 4 "charge" 3
copy_hybrid_henchman_from_old 5 "dodge_forward" 4
copy_hybrid_henchman_from_old 7 "dodging" 10
copy_hybrid_henchman_from_old 8 "stunned" 2
copy_hybrid_henchman_from_old 11 "prone" 8
copy_hybrid_henchman_from_old 12 "dead" 9
copy_hybrid_henchman_from_old 13 "block" 11
copy_hybrid_henchman_from_old 14 "punch_before" 16
copy_hybrid_henchman_from_old 15 "punch_after" 17
copy_hybrid_henchman_from_liz 16 "punch_miss" 6 "liz_missing" "Old sheet had no PUNCH_MISS equivalent."
copy_hybrid_henchman_from_old 17 "super_before" 26
copy_hybrid_henchman_from_old 18 "super_after" 27
copy_hybrid_henchman_from_old 19 "knife_before" 18
copy_hybrid_henchman_from_old 20 "knife_after" 19
copy_hybrid_henchman_from_liz 21 "shoot_hold" 24 "liz_missing" "Old sheet had no SHOOT_HOLD equivalent."
copy_hybrid_henchman_from_old 22 "shoot_before" 24
copy_hybrid_henchman_from_old 23 "shoot_after" 25
copy_hybrid_henchman_from_old 24 "pickup" 32
copy_hybrid_henchman_from_old 27 "throw_before" 33
copy_hybrid_henchman_from_old 28 "throw_after" 34
copy_hybrid_henchman_from_old 30 "lose_weapon" 36

copy_hybrid_batman_from_old 2 0 "batman.stand_s" 40
copy_hybrid_batman_from_liz 2 1 "batman.stand_e" 33 "liz_missing" "Old sheet had one rotatable BM_STAND, not a distinct east pose."
copy_hybrid_batman_from_liz 2 2 "batman.stand_n" 34 "liz_missing" "Old sheet had one rotatable BM_STAND, not a distinct north pose."
copy_hybrid_batman_from_old 2 5 "batman.dodge_forward" 43
copy_hybrid_batman_from_liz 2 8 "batman.stunned" 32 "liz_fallback" "Old sheet had stun before/after but no exact BM_STUNNED runtime pose."
copy_hybrid_batman_from_old 2 9 "batman.stun_before" 42
copy_hybrid_batman_from_old 2 10 "batman.stun_after" 41
copy_hybrid_batman_from_old 2 12 "batman.dead" 53
copy_hybrid_batman_from_old 2 14 "batman.punch_before" 46
copy_hybrid_batman_from_old 2 15 "batman.punch_after" 47
copy_hybrid_batman_from_old 3 6 "batman_interact.dodge_backward" 52
copy_hybrid_batman_from_old 3 25 "batman_interact.take_weapon" 49
copy_hybrid_batman_from_old 3 26 "batman_interact.disable_weapon" 50
copy_hybrid_batman_from_old 3 27 "batman_interact.throw_before" 44
copy_hybrid_batman_from_old 3 28 "batman_interact.throw_after" 45
copy_hybrid_batman_from_old 3 29 "batman_interact.catch" 48
copy_hybrid_batman_from_old 3 24 "batman_interact.pickup" 51
copy_hybrid_batman_from_old 4 31 "objects.box_flying" 35

manifest_finish

make_contact_sheet "${liz_sheet}" "${work_dir}/sprites_liz_reformatted_contact.png" "${build_dir}/liz_contact_cells"
make_contact_sheet "${hybrid_sheet}" "${work_dir}/sprites_hybrid_contact.png" "${build_dir}/hybrid_contact_cells"
make_layout_doc

missing_cells=()
while IFS= read -r line; do
  row="$(printf '%s' "${line}" | sed -n 's/.*"row":\([0-9]*\).*/\1/p')"
  col="$(printf '%s' "${line}" | sed -n 's/.*"col":\([0-9]*\).*/\1/p')"
  status="$(printf '%s' "${line}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
  if [[ "${status}" == "liz_missing" || "${status}" == "liz_fallback" ]]; then
    cell="$(cell_index "${row}" "${col}")"
    missing_cells+=("${build_dir}/hybrid_contact_cells/frame_$(printf '%03d' "${cell}").png")
  fi
done < "${manifest}"

if [[ "${#missing_cells[@]}" -gt 0 ]]; then
  magick montage "${missing_cells[@]}" \
    -background '#d8d8d8' \
    -filter point \
    -resize 400% \
    -geometry +4+4 \
    "${work_dir}/sprites_hybrid_missing_or_fallback_contact.png"
fi

printf 'Wrote %s\n' "${liz_sheet}"
printf 'Wrote %s\n' "${hybrid_sheet}"
printf 'Wrote %s\n' "${manifest}"
