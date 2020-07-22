# stylis-plugin-css-variables

> Stylis plugin that transforms CSS variable into static values for non-supported browsers.

## Install

```
npm install --save stylis-plugin-css-variables
```

## Usage

```js
import Stylis from 'stylis';
import cssVariablesPlugin from 'stylis-plugin-css-variables';

const stylis = new Stylis();
stylis.use(cssVariablesPlugin());

const rules = stylis(
	'',
	`.hello {
        background: var(--bg, black);
    }
    `,
);

console.log(rules);
// .hello {background:black;background: var(--bg, black);}
```

## How it works

By default, this plugin will only run in environments that **do not support CSS variables**. For the web, that typically means IE11 and below. It will not generate various for browsers like Chrome, Safari, or Firefix.

If you need this to always run, there is a `skipSupportedBrowsers` option that can be passed:

```js
stylis.use(cssVariablesPlugin({ skipSupportedBrowsers: false }));
```

This plugin looks for any `var()` usage in the CSS declarations. If `var()` is found, it will attempt to retrieve the value from `:root`. If the CSS variable value is not available, it will attempt to use the provided fallback.

If a fallback is found, the static value will be prepended before the original CSS declaration:

**Before**

```css
.hello {
	background: var(--bg, black);
}
```

**After**

```css
.hello {
	background: black;
	background: var(--bg, black);
}
```

However, if there are no `:root` values or fallbacks, then no static vaue will be generated.

Nested `var()` is supported!

```css
.hello {
	background: var(--bg, var(--black, var(--dark, black)));
}
```

**After**

```css
.hello {
	background: black;
	background: var(--bg, var(--black, var(--dark, black)));
}
```

## Limitations

Automatic variable value retrieval is limited only to the `:root` scope.

## License

MIT © [Q](https://jonquach.com) ✌️❤️
