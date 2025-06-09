# SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
#
# SPDX-License-Identifier: AGPL-3.0-or-later

.DEFAULT_GOAL := help
.PHONY: help

# detect the operating system
OSFLAG 				:=
ifneq ($(OS),Windows_NT)
	UNAME_S := $(shell uname -s)
	ifeq ($(UNAME_S),Linux)
		OSFLAG += LINUX
	endif
	ifeq ($(UNAME_S),Darwin)
		OSFLAG += OSX
	endif
endif


help: ## 🛟 Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-7s\033[0m %s\n", $$1, $$2}'

clean: ## 🧹 Clean the project
	@echo "🧹 Brooming"
	@rm -fr dist && rm -f ncr

.PHONY: setup
setup: ## ⬇️ Install deps
	@echo "⬇️  Install deps"
	@pnpm i

build: setup clean ## 📦 Build the binary
	@echo "📦 Building"
	@pnpm sea
	
build-raspi32: setup clean ## 📦 Build the binary for Arm32
	@echo "📦 Building"
	@pnpm raspi32

up: ## 🚀 Run the project in development mode
	@pnpm dev $@

