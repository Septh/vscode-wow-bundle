'use strict';

import * as path from 'path'
import externals from 'rollup-plugin-node-externals'
import resolve from 'rollup-plugin-node-resolve'
import typescript from '@wessberg/rollup-plugin-ts'
import { terser } from 'rollup-plugin-terser'
import fileSize from 'rollup-plugin-filesize'

const isProd = false

const extensionConfig = {
	input: 'src/extension/main.ts',
	output: {
		file: 'extension/main.js',
		format: 'cjs',
		sourcemap: true,
	},
	plugins: [
		externals(),
		typescript(),
		terser({
			ecma: 7,
			sourcemap: true,
			mangle: isProd,
			compress: isProd,
			output: {
				beautify: true,
				indent_level: 2,
				comments: false,
				semicolons: false
			}
		}),
		fileSize({ showMinifiedSize: false, showGzippedSize: false, showBrotliSize: false }),
	]
}

const webviewConfig = {
	input: 'src/webview/index.ts',
	output: {
		format: 'iife',
		file: 'extension/webview/index.js',
		name: 'wowBundle',
		globals: {
			angular: 'angular',
			ng: 'angular'
		},
		sourcemap: true,
		// sourcemapPathTransform: p => { const pp = path.join(__dirname, 'extension', 'webview', p); console.log('%o => %o', p, pp); return pp }
	},
	plugins: [
		externals({
			// Explicitly mark angular as external as it is not in our depepencies
			include: 'angular'
		}),
		resolve({
			// RxJs's package.json 'module' entry points to an ES5 version of the lib.
			// We prefer the ES2015 version, accessible via the, well, 'es2015' entry.
			mainFields: [ 'es2015', 'module', 'jsnext' ]
		}),
		typescript(),
		terser({
			ecma: 8,
			sourcemap: true,
			mangle: isProd,
			compress: isProd,
			output: {
				beautify: true,
				indent_level: 2,
				comments: false,
				semicolons: false
			}
		}),
		fileSize({ showMinifiedSize: false, showGzippedSize: false, showBrotliSize: false }),
	]
}

export default [ extensionConfig, webviewConfig ]
