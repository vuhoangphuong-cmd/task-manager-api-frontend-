#!/usr/bin/env bash
set -e

echo "=== CHECK DROPDOWN MARKERS IN src/TaskBoard.jsx ==="

if grep -nE "Chọn người được giao|task-user-list|<datalist|users\.map\(\(u\)|loadingUsers" src/TaskBoard.jsx; then
  echo ""
  echo "❌ PHAT HIEN DAU HIEU DROPDOWN. DUNG LAI."
  exit 1
else
  echo "✅ KHONG PHAT HIEN DAU HIEU DROPDOWN"
fi
