// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { program } from '../src/cli';

const res = {
	basepath: '',
	debug: false,
	hostname: '0.0.0.0',
	openapiInfo: './openapi_info.json',
	openapiPath: '/docs',
	port: 0,
	template: './applet_template.html',
	zencodeDirectory: './',
	zenroomVersion: '4.12.0'
};

describe('some test command', () => {
	it('should return the default values of options', async () => {
		expect(program).toBeDefined();
		expect(program.parse().opts()).toEqual(res);
	});
});
