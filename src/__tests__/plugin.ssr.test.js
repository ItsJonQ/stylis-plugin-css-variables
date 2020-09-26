import { stylisPluginCssVariables } from '../plugin';

describe('stylisPluginCssVariables', () => {
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

	test('doesnt blow up when rendering server side', () => {
		// this should be in jest-env-node, so just gotta do the thing
		const plugin = stylisPluginCssVariables();
		const args = { ...baseArgs };

		expect(typeof window).toBe('undefined');

		const input = ['font-size: var( --font, 14px );'];

		args.content = input.join('');

		const result = plugin(...Object.values(args));

		const compiled = ['font-size:14px;', 'font-size: var( --font, 14px );'];

		expect(result).toBe(compiled.join(''));
	});
});
