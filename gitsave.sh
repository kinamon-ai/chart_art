#!/bin/bash

# 今日の日付を取得 (YYYYMMDD)
TODAY=$(date +%Y%m%d)

# 本日のコミット数を取得して、次の番号 (+1) を計算
# git log で今日の日付から始まるコミットを数えます
COUNT=$(git log --oneline --since="midnight" | wc -l)
NEXT_COUNT=$(printf "%02d" $((COUNT + 1)))

# 第1引数があればそれをメッセージに、なければ「日付_番号」にする
MESSAGE=${1:-"${TODAY}_${NEXT_COUNT}"}

echo "Saving with message: $MESSAGE"

git add .
git commit -m "$MESSAGE"
git push origin main
