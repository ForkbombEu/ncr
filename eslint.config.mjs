// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import tsParser from '@typescript-eslint/parser';
import tsEslint from 'typescript-eslint';
import globals from 'globals';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	...tsEslint.configs.recommended,
	eslintConfigPrettier,
	{
		languageOptions: {
			globals: {
				...globals.node
			},
			ecmaVersion: 2020,
			sourceType: 'module',
			parser: tsParser,
		},
		files: ['src/*.ts'],
	},
	{
		ignores: [
			'coverage',
			'dist',
			'tests',
			'node_modules',
		],
	}
];