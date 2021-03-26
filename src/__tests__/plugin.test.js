/**
 * @jest-environment jsdom
 */

import { stylisPluginCssVariables } from '../plugin';

describe('stylisPluginCssVariables', () => {
	beforeEach(() => {
		// Clear root HTML node styles
		document.documentElement.style = null;
	});

	/* eslint-disable */
	const baseArgs = {
		context: 2,
		content: '',
		selectors: ['.font'],
		parents: [],
		line: 80,
		column: 2,
		length: 10,
		type: 105,
	};
	/* eslint-enable */

	// in JSDOM, `window.CSS` is undefined (at least in the environment used here)
	// so we don't need to process supported browsers
	const createPlugin = () => stylisPluginCssVariables();

	test('should return undefined if no fallbacks are available', () => {
		const plugin = createPlugin();
		const args = { ...baseArgs };
		args.content = 'font-size: 14px';

		const result = plugin(...Object.values(args));

		expect(result).toBe(undefined);
	});

	test('should return fallback declaration and variablized declaration if var() is used and fallbacks are available', () => {
		const plugin = createPlugin();
		const args = { ...baseArgs };

		const input = ['font-size: var( --font, 14px );'];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		const compiled = ['font-size:14px;', 'font-size: var( --font, 14px );'];

		expect(result).toBe(compiled.join(''));
	});

	test('should handle declarations with parentheses values', () => {
		const plugin = createPlugin();
		const args = { ...baseArgs };

		const input = [
			'font-size: var( --font, 14px );',
			'filter: var( --blur, blur(20px) );',
			'transform: translate3d(0, 0, 0);',
			'background-image: var(--gradient,linear-gradient(90deg,rgba(2,0,36,1) 20%, rgba(9,9,121,0.5872724089635855) 35%, rgba(0,212,255,0) 40%));',
		];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		const compiled = [
			'font-size:14px;',
			'font-size: var( --font, 14px );',
			'filter:blur(20px);',
			'filter: var( --blur, blur(20px) );',
			'transform: translate3d(0, 0, 0);',
			'background-image:linear-gradient(90deg,rgba(2,0,36,1) 20%, rgba(9,9,121,0.5872724089635855) 35%, rgba(0,212,255,0) 40%);',
			'background-image: var(--gradient,linear-gradient(90deg,rgba(2,0,36,1) 20%, rgba(9,9,121,0.5872724089635855) 35%, rgba(0,212,255,0) 40%));',
		];

		expect(result).toBe(compiled.join(''));
	});

	test('should return fallback declarations for every var() call', () => {
		// Set :root variables
		document.documentElement.style.setProperty('--bg', 'black');
		document.documentElement.style.setProperty('--height', '30px');
		document.documentElement.style.setProperty('--size', '2');

		const plugin = createPlugin();
		const args = { ...baseArgs };

		const input = [
			'background: var( --bg );',
			'font-size: var( --font, 14px );',
			'height: calc((var(--height, 20px) * 1.2));',
			'transform: translate( var(--x, 0) , 0) scale( var(--size, 1) );',
			'z-index: var( --z, var( --z2, 2) );',
		];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		const compiled = [
			'background:black;',
			'background: var( --bg );',
			'font-size:14px;',
			'font-size: var( --font, 14px );',
			'height:calc((30px * 1.2));',
			'height: calc((var(--height, 20px) * 1.2));',
			'transform:translate( 0 , 0) scale( 2 );',
			'transform: translate( var(--x, 0) , 0) scale( var(--size, 1) );',
			'z-index:2;',
			'z-index: var( --z, var( --z2, 2) );',
		];

		expect(result).toBe(compiled.join(''));
	});

	test('should return if a single fallback was transformed out of many', () => {
		const plugin = createPlugin();
		const args = { ...baseArgs };

		const input = [
			'background: var( --bg );',
			'font-size: var( --font, 14px );',
			'z-index: var( --z );',
		];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		const compiled = [
			'background: var( --bg );',
			'font-size:14px;',
			'font-size: var( --font, 14px );',
			'z-index: var( --z );',
		];

		expect(result).toBe(compiled.join(''));
	});

	test('it should skip when the browser is supported', () => {
		// reset the module registry
		jest.resetModules();
		// actually make JSDOM look like it supports CSS vars (it doesn't by default)
		window.CSS = {
			supports: jest.fn(() => true),
		};
		// re-require the plugin to re-run the side-effect-y `isNativeSupport`
		const {
			stylisPluginCssVariables: pluginFactory,
		} = require('../plugin');

		// create the plugin w/ the factory from the re-required
		const plugin = pluginFactory();
		const args = { ...baseArgs };

		const input = ['font-size: var( --font, 14px );'];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		expect(result).toBe(undefined);

		// the default value for window.CSS in JSDOM
		window.CSS = undefined;
	});

	test('it should not skip supported browsers when skipSupportedBrowsers is false', () => {
		// reset the module registry
		jest.resetModules();
		// actually make JSDOM look like it supports CSS vars (it doesn't by default)
		window.CSS = {
			supports: jest.fn(() => true),
		};
		// re-require the plugin to re-run the side-effect-y `isNativeSupport`
		const {
			stylisPluginCssVariables: pluginFactory,
		} = require('../plugin');

		// create the plugin w/ the factory from the re-required
		const plugin = pluginFactory({ skipSupportedBrowsers: false });
		const args = { ...baseArgs };

		const input = ['font-size: var( --font, 14px );'];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		const compiled = ['font-size:14px;', 'font-size: var( --font, 14px );'];

		expect(result).toBe(compiled.join(''));
	});
});
