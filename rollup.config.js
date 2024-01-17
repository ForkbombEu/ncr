import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import path from 'path';

// const uws = 'uws_' + process.platform + '_' + process.arch + '_' + process.versions.modules + '.node';
const uws = 'uws_' + process.platform + '_' + process.arch + '_108.node';
const src = path.join('node_modules', 'uWebSockets.js', uws);

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.cjs',
		format: 'cjs',
		inlineDynamicImports: true,
	},
	plugins: [
		json(),
		typescript(),
		nodeResolve({ preferBuiltins: true }),
		commonjs({ ignoreDynamicRequires: true }),
		copy({
			targets: [
				{ src: src, dest: 'dist/' },
				{ src: './src/openapi.html', dest: 'dist/' }
			]
		})
	]
};
