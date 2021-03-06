let htmlRootNode;
/* istanbul ignore next */
if (typeof window !== 'undefined') {
	htmlRootNode = window?.document?.documentElement;
}

/*
 * Caching the computedStyle instance for document.documentElement.
 * We do this so to prevent additional getComputedStyle calls, which greatly
 * improves performance. We use the .getPropertyValue() method from this
 * reference to retrieve CSS variable values.
 *
 * Although the instance is cached, the values retrieved by .getPropertyValue()
 * are up to date. This is important in cases where global :root variables
 * are updated.
 */
const rootComputedStyles =
	htmlRootNode && window.getComputedStyle(htmlRootNode);

/**
 * Retrieves the custom CSS variable from the :root selector.
 *
 * @param {string} key The CSS variable property to retrieve.
 * @return {?string} The value of the CSS variable.
 */
export function getRootPropertyValue(key) {
	// We'll attempt to get the CSS variable from :root.
	let rootStyles = rootComputedStyles;

	/* istanbul ignore next */
	if (process.env.NODE_ENV === 'test') {
		/*
		 * The cached rootComputedStyles does not retrieve the latest values
		 * in our environment (JSDOM). In that case, we'll create a fresh
		 * instance computedStyles on the root HTML element.
		 */
		rootStyles =
			typeof window !== 'undefined' &&
			window.getComputedStyle(document.documentElement);
	}

	return rootStyles?.getPropertyValue?.(key)?.trim();
}

/**
 * Checks to see if a CSS declaration rule uses var().
 *
 * @param {string} declaration  A CSS declaration rule.
 * @return {boolean} Result of whether declaration contains a CSS variable.
 */
export function hasVariable(declaration) {
	return declaration.includes('var(');
}
