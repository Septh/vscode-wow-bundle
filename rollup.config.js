'use strict';

import nodeExternals from 'rollup-plugin-node-externals'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonJS from 'rollup-plugin-commonjs'
import typescript from '@wessberg/rollup-plugin-ts'
import loadHtml from 'rollup-plugin-html'
import postCss from 'rollup-plugin-postcss'
import genHtml from 'rollup-plugin-gen-html'
import { terser } from 'rollup-plugin-terser'
import fileSize from 'rollup-plugin-filesize'

// Quick access to some terser options I want to play with
const compress = false,
	  mangle = false,
	  comments = false,
	  semicolons = false,
	  beautify = true

// Extension config - the easy one
const extensionConfig = {
	input: 'src/extension/main.ts',
	output: {
		file: 'extension/main.js',
		format: 'cjs',
		sourcemap: true,
	},
	plugins: [
		nodeExternals(),
		typescript(),
		terser({
			ecma: 7,
			sourcemap: true,
			mangle,
			compress,
			output: {
				beautify,
				indent_level: 2,
				comments,
				semicolons
			}
		}),
		fileSize({ showMinifiedSize: false, showGzippedSize: false, showBrotliSize: false }),
	]
}

// Wevbiew config - the bold one
const webviewConfig = {
	input: 'src/webview/index.ts',
	output: {
		format: 'iife',
		file: 'extension/webview/index.js',
		name: 'wowBundle',
		globals: {
			angular: 'angular'
		},
		sourcemap: true
	},
	plugins: [
		nodeExternals({
			// Explicitly mark the Angular family as external as we use it with a <script> tag in index.html
			include: /^angular/
		}),
		nodeResolve({
			// RxJs's package.json 'module' entry points to an ES5 version of the lib.
			// We prefer the ES2015 version, accessible via the, well, 'es2015' entry.
			mainFields: [ 'es2015', 'module', 'jsnext' ]
		}),
		commonJS(),
		typescript(),
		postCss({
			// Consolidate all our styles in index.css
			inject: false,
			extract: true,
			sourceMap: true
		}),
		loadHtml({
			// Import component templates as strings inside code.
			// Make sure to include only templates and exclude index
			include: [ 'src/webview/app/**/*.html' ],
			exclude: [ 'src/webview/index.html' ],
			htmlMinifierOptions: {
				collapseWhitespace: true,
				collapseBooleanAttributes: true,
				conservativeCollapse: false,
				removeComments: true
			}
		}),
		genHtml({
			// Generate index.html.
			// Make sure to include only index and exclude templates
			include: [ 'src/webview/index.html' ],
			exclude: ['src/webview/app/**/*.html']
		}),
		terser({
			ecma: 7,
			sourcemap: true,
			mangle,
			compress,
			output: {
				beautify,
				indent_level: 2,
				comments,
				semicolons
			}
		}),
		fileSize({ showMinifiedSize: false, showGzippedSize: false, showBrotliSize: false }),
	]
}

export default [ extensionConfig, webviewConfig ]
