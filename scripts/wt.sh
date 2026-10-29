#!/usr/bin/env bash
# Per-worktree environment: own Postgres container, ports, .env, deps, migrations, seed.
#
#   scripts/wt.sh new <branch> [base]   create worktree + full environment
#   scripts/wt.sh setup [--no-seed]     (re)provision the current worktree (idempotent)
#   scripts/wt.sh down                  stop this worktree's containers (keeps data)
#   scripts/wt.sh rm [-y]               drop containers + data, remove the worktree
#   scripts/wt.sh list                  show every worktree with ports and DB state
#   scripts/wt.sh install-hook          auto-run `setup` on every `git worktree add`
set -euo pipefail

BEGIN_MARK="# >>> wt-env (managed, do not edit) >>>"
END_MARK="# <<< wt-env <<<"
APP_BASE=8500
PG_BASE=55500
MANAGED_KEYS='DATABASE_URL|DIRECT_URL|PORT|APP_PORT|POSTGRES_PORT|COMPOSE_PROJECT_NAME|NEXT_PUBLIC_SITE_URL|WT_INDEX'

log() { printf '\033[1;34m[wt]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[wt]\033[0m %s\n' "$*" >&2; exit 1; }

common_dir() { git rev-parse --path-format=absolute --git-common-dir; }
main_root() { dirname "$(common_dir)"; }
this_root() { git rev-parse --show-toplevel; }
is_linked() { [ "$(git rev-parse --absolute-git-dir)" != "$(common_dir)" ]; }

slugify() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-' | sed -E 's/-+/-/g; s/^-|-$//g'; }

port_free() { ! lsof -iTCP:"$1" -sTCP:LISTEN -nP >/dev/null 2>&1; }

env_get() { [ -f "$1" ] && grep -E "^$2=" "$1" | tail -n1 | cut -d= -f2- | tr -d '"' || true; }

# Indexes already claimed by other worktrees.
used_indexes() {
  local self="$1" p
  git worktree list --porcelain | awk '/^worktree /{print substr($0,10)}' | while read -r p; do
    [ "$p" = "$self" ] && continue
    env_get "$p/.env" WT_INDEX
  done
}

pick_index() {
  local root="$1" slug="$2" idx taken i
  idx="$(env_get "$root/.env" WT_INDEX)"
  if [ -n "$idx" ]; then echo "$idx"; return; fi
  taken=" $(used_indexes "$root" | tr '\n' ' ') "
  idx=$(( $(printf '%s' "$slug" | cksum | cut -d' ' -f1) % 100 ))
  for i in $(seq 0 99); do
    local cand=$(( (idx + i) % 100 ))
    case "$taken" in *" $cand "*) continue ;; esac
    if port_free $((APP_BASE + cand)) && port_free $((PG_BASE + cand)); then echo "$cand"; return; fi
  done
  die "no free port slot left"
}

write_env() {
  local root="$1" slug="$2" idx="$3" main src app pg
  main="$(main_root)"
  app=$((APP_BASE + idx)); pg=$((PG_BASE + idx))

  if [ ! -f "$root/.env" ]; then
    src="$main/.env"; [ -f "$src" ] || src="$main/.env.example"
    [ -f "$src" ] || die "no .env or .env.example in $main"
    log "seeding .env from ${src#"$main"/}"
    grep -vE "^($MANAGED_KEYS)=" "$src" > "$root/.env" || true
  else
    # Drop a previous managed block, keep manual edits.
    sed -i.bak "/^$BEGIN_MARK\$/,/^$END_MARK\$/d" "$root/.env" && rm -f "$root/.env.bak"
  fi

  # Main's .env.local points at main's DB and would shadow ours.
  rm -f "$root/.env.local"

  cat >> "$root/.env" <<EOF
$BEGIN_MARK
WT_INDEX=$idx
COMPOSE_PROJECT_NAME=memora-$slug
APP_PORT=$app
PORT=$app
POSTGRES_PORT=$pg
NEXT_PUBLIC_SITE_URL=http://localhost:$app
DATABASE_URL=postgresql://memora:memora@localhost:$pg/memora
DIRECT_URL=postgresql://memora:memora@localhost:$pg/memora
$END_MARK
EOF
}

db_has_schema() {
  [ "$(docker compose exec -T postgres psql -U memora -d memora -tAc "select to_regclass('public._prisma_migrations') is not null" 2>/dev/null)" = "t" ]
}

cmd_setup() {
  local seed=1
  [ "${1:-}" = "--no-seed" ] && seed=0
  is_linked || die "this is the main worktree; it keeps the default env (ports 8443/55432)"
  command -v docker >/dev/null || die "docker not found"

  local root slug idx
  root="$(this_root)"; slug="$(slugify "$(basename "$root")")"
  cd "$root"

  mkdir "$root/.wt-setup.lock" 2>/dev/null || die "setup already running (rm -r .wt-setup.lock if stale)"
  trap "rmdir '$root/.wt-setup.lock' 2>/dev/null || true" EXIT

  idx="$(pick_index "$root" "$slug")"
  write_env "$root" "$slug" "$idx"
  log "app :$((APP_BASE + idx))  postgres :$((PG_BASE + idx))  project memora-$slug"

  log "starting postgres"
  docker compose up -d --wait postgres

  log "installing dependencies"
  pnpm install --frozen-lockfile

  local fresh=0
  db_has_schema || fresh=1
  log "applying migrations"
  pnpm exec prisma migrate deploy
  if [ "$fresh" = 1 ] && [ "$seed" = 1 ]; then
    log "seeding fresh database"
    pnpm db:seed
  fi

  log "ready -> cd $root && pnpm dev   (http://localhost:$((APP_BASE + idx)))"
}

cmd_new() {
  local branch="${1:-}" base="${2:-main}" main dir
  [ -n "$branch" ] || die "usage: wt.sh new <branch> [base]"
  main="$(main_root)"
  dir="$main.worktrees/$(slugify "$branch")"
  mkdir -p "$main.worktrees"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    WT_NO_HOOK=1 git worktree add "$dir" "$branch"
  else
    WT_NO_HOOK=1 git worktree add -b "$branch" "$dir" "$base"
  fi
  (cd "$dir" && "$main/scripts/wt.sh" setup)
}

cmd_down() {
  is_linked || die "run inside a linked worktree"
  docker compose down
}

cmd_rm() {
  is_linked || die "run inside a linked worktree"
  local root slug ans="${1:-}"
  root="$(this_root)"; slug="$(slugify "$(basename "$root")")"
  [ -z "$(git status --porcelain)" ] || die "worktree has uncommitted changes; commit or stash first"
  if [ "$ans" != "-y" ]; then
    read -r -p "Delete containers, DB volume and worktree $root? [y/N] " ans
    [ "$ans" = "y" ] || die "aborted"
  fi
  cd "$(main_root)"
  docker compose -p "memora-$slug" down -v --remove-orphans || true
  git worktree remove "$root"
  log "removed $root"
}

cmd_list() {
  local p br idx state
  printf '%-52s %-34s %-6s %-6s %s\n' WORKTREE BRANCH APP PG DB
  git worktree list --porcelain | awk '/^worktree /{p=substr($0,10)} /^branch /{print p"\t"substr($0,8)}' | while IFS=$'\t' read -r p br; do
    idx="$(env_get "$p/.env" WT_INDEX)"
    if [ -z "$idx" ]; then
      [ "$p" = "$(main_root)" ] && printf '%-52s %-34s %-6s %-6s %s\n' "${p##*/}" "${br#refs/heads/}" 8443 55432 "(main)"
      continue
    fi
    state="$(cd "$p" && docker compose ps --status running --services 2>/dev/null | grep -c postgres || true)"
    printf '%-52s %-34s %-6s %-6s %s\n' "${p##*/}" "${br#refs/heads/}" $((APP_BASE + idx)) $((PG_BASE + idx)) "$([ "$state" = 1 ] && echo up || echo down)"
  done
}

cmd_install_hook() {
  local hook; hook="$(common_dir)/hooks/post-checkout"
  if [ -f "$hook" ] && ! grep -q 'wt-env-hook' "$hook"; then
    die "$hook already exists; add the wt-env call manually"
  fi
  cat > "$hook" <<'EOF'
#!/bin/sh
# wt-env-hook: provision the env when a linked worktree is created (also for agent-created ones)
[ "$1" = "0000000000000000000000000000000000000000" ] || exit 0
[ -z "$WT_NO_HOOK" ] || exit 0
gd=$(git rev-parse --absolute-git-dir); cd_=$(git rev-parse --path-format=absolute --git-common-dir)
[ "$gd" != "$cd_" ] || exit 0
script="$(dirname "$cd_")/scripts/wt.sh"
[ -x "$script" ] || exit 0
nohup "$script" setup </dev/null >"$PWD/wt-setup.log" 2>&1 &
exit 0
EOF
  chmod +x "$hook"
  log "installed $hook (setup output goes to <worktree>/wt-setup.log)"
}

case "${1:-}" in
  new) shift; cmd_new "$@" ;;
  setup) shift; cmd_setup "$@" ;;
  down) cmd_down ;;
  rm) shift; cmd_rm "$@" ;;
  list) cmd_list ;;
  install-hook) cmd_install_hook ;;
  *) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
