'use strict';

import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'
import sourcemaps from 'rollup-plugin-sourcemaps'

const extensionConfig = {
	input: 'src/main.ts',
	output: {
		format: 'cjs',
		file: 'dist/main.js',
		sourcemap: true,
	},
	plugins: [
		resolve(),
		typescript({
			// verbosity: 3,
			tsconfig: 'src/tsconfig.json'
		}),
		cleanup(),
		sourcemaps(),
	],
	external: [
		'vscode', 'path', 'fs'
	]
}

const webviewConfig = {
	input: 'src/webview/index.ts',
	output: {
		format: 'iife',
		file: 'dist/webview/index.js',
		name: 'wowBundle',
		globals: {
			angular: 'angular',
			ng: 'angular'
		},
		sourcemap: true,
	},
	plugins: [
		commonjs(),
		resolve(),
		typescript({
			// verbosity: 3,
			tsconfig: 'src/webview/tsconfig.json'
		}),
		cleanup(),
		sourcemaps()
	],
	external: [
		'angular'
	]
}

export default [ extensionConfig, webviewConfig ]
