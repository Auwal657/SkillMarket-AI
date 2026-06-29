#!/usr/bin/env bash
set -e

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building frontend..."
pnpm --filter @workspace/skillmarket build

echo "==> Building backend..."
pnpm --filter @workspace/api-server build

echo "==> Build complete."
