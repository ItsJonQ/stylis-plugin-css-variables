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
		args.selectors = [':root'];
		args.content = `--fontSize: 14px;`;

		const result = plugin(...Object.values(args));

		expect(result).toBe(undefined);
	});
});
