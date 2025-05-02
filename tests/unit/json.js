// copied from https://github.com/duailibe/jest-json

'use strict';

/**
 * Asymmetric matcher to check the format of a JSON string.
 *
 *   expect({ foo: fooJson }).toEqual({
 *     foo: expect.jsonMatching(expected),
 *   })
 */
export function jsonMatching(received, expected) {
	let pass = false;
	try {
		received = JSON.parse(received);
		pass = this.equals(received, expected);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty
	} catch (err) {}
	return { pass };
}
