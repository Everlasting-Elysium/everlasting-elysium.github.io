#!/usr/bin/env bash
# blog.sh — Elysian Realm 博客管理脚本

set -euo pipefail

POSTS_DIR="$(cd "$(dirname "$0")" && pwd)/source/_posts"

# ── 颜色 ──────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▸ $*${RESET}"; }
success() { echo -e "${GREEN}✔ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
error()   { echo -e "${RED}✘ $*${RESET}" >&2; }
ask()     { echo -e "${BOLD}$*${RESET}"; }

# ── 工具函数 ──────────────────────────────────────────────────────────────────

# 将标题转换为文件名 slug（小写，非字母数字转连字符）
slugify() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9一-龿\-]/-/g' \
    | sed 's/--*/-/g' \
    | sed 's/^-//;s/-$//'
}

# 列出所有文章，返回文件路径数组
list_posts() {
  local posts=()
  while IFS= read -r f; do
    posts+=("$f")
  done < <(ls -t "$POSTS_DIR"/*.md 2>/dev/null)
  echo "${posts[@]:-}"
}

# 从 front-matter 提取字段值
get_fm_field() {
  local file="$1" field="$2"
  grep -m1 "^${field}:" "$file" | sed 's/^[^:]*: *//' | tr -d '"'
}

# ── 命令：新建文章 ─────────────────────────────────────────────────────────────
cmd_new() {
  echo
  ask "📝 新建文章"
  echo "──────────────────────────────"

  # 标题
  while true; do
    read -rp "$(echo -e "${BOLD}标题${RESET}: ")" title
    [[ -n "$title" ]] && break
    warn "标题不能为空"
  done

  # 日期（默认今天）
  local today; today=$(date +%Y-%m-%d)
  read -rp "$(echo -e "${BOLD}日期${RESET} [${today}]: ")" input_date
  local post_date="${input_date:-$today}"

  # 分类
  read -rp "$(echo -e "${BOLD}分类${RESET} (可空，多个用逗号分隔): ")" input_cats

  # 标签
  read -rp "$(echo -e "${BOLD}标签${RESET} (可空，多个用逗号分隔): ")" input_tags

  # 封面图
  read -rp "$(echo -e "${BOLD}封面图${RESET} headimg (可空，如 /img/elysia.jpg): ")" headimg

  # 生成文件名
  local slug; slug=$(slugify "$title")
  local filename="${post_date}-${slug}.md"
  local filepath="${POSTS_DIR}/${filename}"

  if [[ -f "$filepath" ]]; then
    warn "文件已存在：$filename"
    read -rp "覆盖? [y/N]: " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { info "已取消"; return; }
  fi

  # 构建 front-matter
  local fm="---\ntitle: \"${title}\"\ndate: ${post_date}"

  if [[ -n "$headimg" ]]; then
    fm+="\nheadimg: ${headimg}"
  fi

  if [[ -n "$input_cats" ]]; then
    fm+="\ncategories:"
    IFS=',' read -ra cats <<< "$input_cats"
    for c in "${cats[@]}"; do
      c="$(echo "$c" | xargs)"
      fm+="\n  - ${c}"
    done
  fi

  if [[ -n "$input_tags" ]]; then
    fm+="\ntags:"
    IFS=',' read -ra tags <<< "$input_tags"
    for t in "${tags[@]}"; do
      t="$(echo "$t" | xargs)"
      fm+="\n  - ${t}"
    done
  fi

  fm+="\n---\n"

  echo -e "$fm" > "$filepath"
  success "已创建：source/_posts/${filename}"

  # 询问是否用编辑器打开
  if command -v code &>/dev/null; then
    read -rp "用 VS Code 打开? [Y/n]: " open_it
    [[ ! "$open_it" =~ ^[Nn]$ ]] && code "$filepath"
  fi
}

# ── 命令：删除文章 ─────────────────────────────────────────────────────────────
cmd_delete() {
  echo
  ask "🗑  删除文章"
  echo "──────────────────────────────"

  local files=()
  while IFS= read -r f; do
    [[ -n "$f" ]] && files+=("$f")
  done < <(ls -t "$POSTS_DIR"/*.md 2>/dev/null || true)

  if [[ ${#files[@]} -eq 0 ]]; then
    warn "没有找到任何文章"
    return
  fi

  echo
  local i=1
  for f in "${files[@]}"; do
    local title; title=$(get_fm_field "$f" "title")
    local date;  date=$(get_fm_field "$f" "date")
    printf "  ${CYAN}%2d${RESET}. ${BOLD}%-50s${RESET} %s\n" "$i" "${title:-$(basename "$f")}" "${date:-}"
    ((i++))
  done
  echo

  read -rp "$(echo -e "${BOLD}选择序号${RESET} (多个用逗号，0 取消): ")" input
  [[ "$input" == "0" || -z "$input" ]] && { info "已取消"; return; }

  local to_delete=()
  IFS=',' read -ra nums <<< "$input"
  for n in "${nums[@]}"; do
    n="$(echo "$n" | xargs)"
    if [[ "$n" =~ ^[0-9]+$ ]] && (( n >= 1 && n <= ${#files[@]} )); then
      to_delete+=("${files[$((n-1))]}")
    else
      warn "无效序号：$n，跳过"
    fi
  done

  [[ ${#to_delete[@]} -eq 0 ]] && { warn "没有有效选择"; return; }

  echo
  warn "将要删除以下文章："
  for f in "${to_delete[@]}"; do
    echo "  - $(basename "$f")"
  done
  read -rp "确认删除? [y/N]: " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || { info "已取消"; return; }

  for f in "${to_delete[@]}"; do
    rm "$f"
    success "已删除：$(basename "$f")"
  done
}

# ── 命令：更新主题 ─────────────────────────────────────────────────────────────
cmd_update_theme() {
  echo
  info "更新主题子模块..."
  local before; before=$(git -C "$(dirname "$0")" submodule status | awk '{print $1}' | sed 's/^[-+ ]//')
  git -C "$(dirname "$0")" submodule update --remote --merge
  local after; after=$(git -C "$(dirname "$0")" submodule status | awk '{print $1}' | sed 's/^[-+ ]//')

  if [[ "$before" == "$after" ]]; then
    success "主题已是最新（${after:0:7}）"
  else
    success "主题已更新：${before:0:7} → ${after:0:7}"
  fi
}

# ── 命令：推送 ────────────────────────────────────────────────────────────────
cmd_push() {
  echo
  local repo_dir; repo_dir="$(dirname "$0")"
  info "检查工作区状态..."

  local status; status=$(git -C "$repo_dir" status --short)
  if [[ -z "$status" ]]; then
    success "没有需要提交的更改"
    return
  fi

  echo
  git -C "$repo_dir" status --short
  echo

  # commit message
  read -rp "$(echo -e "${BOLD}commit 信息${RESET}: ")" msg
  if [[ -z "$msg" ]]; then
    # 自动生成
    local added;   added=$(git -C "$repo_dir" status --short | grep -c '^[AM?]' || true)
    local changed; changed=$(git -C "$repo_dir" status --short | grep -c '^ M' || true)
    local deleted; deleted=$(git -C "$repo_dir" status --short | grep -c '^ D\|^D' || true)
    msg="update: ${added} added, ${changed} changed, ${deleted} deleted"
    info "自动生成 commit 信息：${msg}"
  fi

  git -C "$repo_dir" add -A
  git -C "$repo_dir" commit -m "$msg"
  info "推送中..."
  git -C "$repo_dir" push
  success "已推送到远程"
}

# ── 命令：本地预览 ────────────────────────────────────────────────────────────
cmd_serve() {
  echo
  info "启动本地预览服务器（Ctrl+C 停止）..."
  cd "$(dirname "$0")" && npx hexo server
}

# ── 命令：查看状态 ────────────────────────────────────────────────────────────
cmd_status() {
  echo
  local repo_dir; repo_dir="$(dirname "$0")"
  info "Git 状态"
  git -C "$repo_dir" status --short
  echo
  info "最近 5 次提交"
  git -C "$repo_dir" log --oneline -5
  echo
  info "主题版本"
  git -C "$repo_dir" submodule status
}

# ── 菜单 ──────────────────────────────────────────────────────────────────────
show_menu() {
  echo
  echo -e "${BOLD}═══════════════════════════════${RESET}"
  echo -e "${BOLD}     Elysian Realm 博客管理     ${RESET}"
  echo -e "${BOLD}═══════════════════════════════${RESET}"
  echo -e "  ${CYAN}1${RESET}. 📝 新建文章"
  echo -e "  ${CYAN}2${RESET}. 🗑  删除文章"
  echo -e "  ${CYAN}3${RESET}. 🔄 更新主题"
  echo -e "  ${CYAN}4${RESET}. 🚀 推送"
  echo -e "  ${CYAN}5${RESET}. 🔄 更新主题 + 🚀 推送"
  echo -e "  ${CYAN}6${RESET}. 🌐 本地预览"
  echo -e "  ${CYAN}7${RESET}. 📊 查看状态"
  echo -e "  ${CYAN}0${RESET}. 退出"
  echo -e "${BOLD}───────────────────────────────${RESET}"
}

# ── 入口 ──────────────────────────────────────────────────────────────────────

# 支持直接传参：./blog.sh new / push / delete / update / serve / status
if [[ $# -gt 0 ]]; then
  case "$1" in
    new|n)    cmd_new ;;
    delete|d) cmd_delete ;;
    update|u) cmd_update_theme ;;
    push|p)   cmd_push ;;
    serve|s)  cmd_serve ;;
    status)   cmd_status ;;
    *)        error "未知命令：$1"; echo "用法：$0 [new|delete|update|push|serve|status]"; exit 1 ;;
  esac
  exit 0
fi

# 交互菜单
while true; do
  show_menu
  read -rp "$(echo -e "${BOLD}选择操作${RESET}: ")" choice
  case "$choice" in
    1) cmd_new ;;
    2) cmd_delete ;;
    3) cmd_update_theme ;;
    4) cmd_push ;;
    5) cmd_update_theme; cmd_push ;;
    6) cmd_serve ;;
    7) cmd_status ;;
    0|q|quit|exit) echo -e "\n${GREEN}bye ✨${RESET}\n"; exit 0 ;;
    *) warn "无效选项：$choice" ;;
  esac
done
