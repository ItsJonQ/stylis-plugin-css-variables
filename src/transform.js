import memoize from 'memize';

import { getRootPropertyValue, hasVariable } from './utils';

/**
 * Returns new string, removes characters from source string
 * @param {number} start Index at which to start changing the string.
 * @param {number} delCount An integer indicating the number of old chars to remove.
 * @param {string} newSubStr The String that is spliced in.
 * @return {string} A new string with the spliced substring.
 */
function splice(str, index, count, newSubStr = '') {
	if (index > str.length - 1) return str;
	return str.substring(0, index) + newSubStr + str.substring(index + count);
}

/**
 * Interprets and retrieves the CSS property and value of a declaration rule.
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {Array<string, ?string>} [prop, value] parsed from the declaration.
 */
function getPropValue(declaration) {
	// Start be separating (and preparing) the prop and value from the declaration.
	let [prop, value] = declaration.split(/:/);
	prop = prop.trim();

	// Creating map of string with var, parentheses and vars values.
	const regexp = new RegExp(/var|\(|\)/, 'g');
	const map = { var: [], ob: [], cb: [], values: {} };
	let matches = regexp.exec(value);
	while (matches != null) {
		switch (matches[0]) {
			case 'var':
				map.var.push(matches.index);
				break;
			case '(':
				map.ob.push(matches.index);
				break;
			case ')':
			default:
				map.cb.push(matches.index);
				break;
		}

		matches = regexp.exec(value);
	}

	if (map.var.length === 0 || map.cb.length !== map.ob.length) {
		return [prop, undefined];
	}

	// filling character`s indices for removing
	const removeIndices = [];
	for (let i = 0; i < map.var.length; i++) {
		// calc var`s opened parentheses index
		const obIndex = map.ob.indexOf(map.var[i] + 3);
		// calc var`s closed parentheses index
		let cbIndex = 0;
		let ob = obIndex;
		while (map.ob[ob + 1] < map.cb[cbIndex] && ob < map.ob.length - 1) {
			ob++;
			cbIndex++;
		}

		while (map.ob[ob] > map.cb[cbIndex] && cbIndex < map.cb.length - 1) {
			cbIndex++;
		}

		// removes var and parentheses
		removeIndices.push(map.var[i]);
		removeIndices.push(map.var[i] + 1);
		removeIndices.push(map.var[i] + 2);
		removeIndices.push(map.ob[obIndex]);
		removeIndices.push(map.cb[cbIndex]);

		// removes var`s name
		let n = map.ob[obIndex] + 1;
		while (value[n - 1 || 0] !== ',' && n < map.cb[cbIndex]) {
			removeIndices.push(n);
			n++;
		}

		// gets var`s value from root
		const [name] = value
			.substring(map.ob[obIndex] + 1, map.cb[cbIndex])
			.trim()
			.split(',');
		const rootValue = getRootPropertyValue(name);

		// needs to fill value from root
		if (n === map.cb[cbIndex] || rootValue) {
			// removes var`s default value
			while (n < map.cb[cbIndex]) {
				removeIndices.push(n);
				n++;
			}

			map.values[map.var[i]] = rootValue;
		}

		// trim whitespaces
		while (value[n] === ' ') {
			removeIndices.push(n);
			n++;
		}
	}

	// applies map to string - removes var and insert values
	let count = 1;
	removeIndices
		.sort((a, b) => b - a)
		.forEach((sIndex, iIndex) => {
			if (map.values[sIndex] != null) {
				value = splice(value, sIndex, count, map.values[sIndex]);
				count = 1;
				return;
			}

			if (
				iIndex === removeIndices.length - 1 ||
				removeIndices[iIndex + 1] !== sIndex - 1
			) {
				value = splice(value, sIndex, count);
				count = 1;
				return;
			}

			count++;
		});

	return [prop, value.trim()];
}

/**
 * Interprets and retrieves the CSS fallback value of a declaration rule.
 *
 * @param {string} declaration A CSS declaration rule to parse.
 * @return {?string} A CSS declaration rule with a fallback (if applicable).
 */
export function getFallbackDeclaration(declaration) {
	if (!hasVariable(declaration)) return undefined;

	const [prop, value] = getPropValue(declaration);

	return value ? [prop, value].join(':') : undefined;
}

/**
 * Parses the incoming content from stylis to add fallback CSS values for
 * variables.
 *
 * @param {string} content Stylis content to parse.
 * @return {string} The transformed content with CSS variable fallbacks.
 */
export function transformContent(content) {
	/*
	 * Attempts to deconstruct the content to retrieve prop/value
	 * CSS declaration pairs.
	 *
	 * Before:
	 * 'background-color:var(--bg, black); font-size:14px;'
	 *
	 * After:
	 * ['background-color:var(--bg, black)', ' font-size:14px']
	 */
	const declarations = content.split(';').filter(Boolean);
	let didTransform = false;

	/*
	 * With the declaration collection, we'll iterate over every declaration
	 * to provide fallbacks (if applicable.)
	 */
	const parsed = declarations.reduce((styles, declaration) => {
		// If no CSS variable is used, we return the declaration untouched.
		if (!hasVariable(declaration)) {
			return [...styles, declaration];
		}
		// Retrieve the fallback a CSS variable is used in this declaration.
		const fallback = getFallbackDeclaration(declaration);
		/*
		 * Prepend the fallback in our styles set.
		 *
		 * Before:
		 * [
		 * 	 ...styles,
		 *   'background-color:var(--bg, black);'
		 * ]
		 *
		 * After:
		 * [
		 * 	 ...styles,
		 *   'background:black;',
		 *   'background-color:var(--bg, black);'
		 * ]
		 */
		if (fallback) {
			didTransform = true;
			return [...styles, fallback, declaration];
		}
		return [...styles, declaration];
	}, []);

	/*
	 * We'll rejoin our declarations with a ; separator.
	 * Note: We need to add a ; at the end for stylis to interpret correctly.
	 */
	const result = parsed.join(';').concat(';');

	// We only want to return a value if we're able to locate a fallback value.
	return didTransform ? result : undefined;
}

export const memoizedTransformContent = memoize(transformContent);
