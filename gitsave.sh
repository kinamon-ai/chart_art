#!/bin/bash

# エラーが発生したらその時点で実行を中止する
set -e

# 1. ビルドを試行
echo "Running build check..."
npm run build

# 2. 今日の日付とコミット数を取得
TODAY=$(date +%Y%m%d)
COUNT=$(git log --oneline --since="midnight" | wc -l)
NEXT_COUNT=$(printf "%02d" $((COUNT + 1)))

# 3. メッセージの決定
MESSAGE=${1:-"${TODAY}_${NEXT_COUNT}"}

# 4. Git 操作
echo "Saving with message: $MESSAGE"
git add .
git commit -m "$MESSAGE"
git push origin main

echo "Successfully saved and pushed!"
