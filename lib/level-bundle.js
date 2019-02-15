(function(f) {
	if (typeof exports === 'object' && typeof module !== 'undefined') {
		module.exports = f();
	} else if (typeof define === 'function' && define.amd) {
		define([], f);
	} else {
		var g;
		if (typeof window !== 'undefined') {
			g = window;
		} else if (typeof global !== 'undefined') {
			g = global;
		} else if (typeof self !== 'undefined') {
			g = self;
		} else {
			g = this;
		}
		g.level = f();
	}
})(function() {
	var define, module, exports;
	return (function() {
		function r(e, n, t) {
			function o(i, f) {
				if (!n[i]) {
					if (!e[i]) {
						var c = 'function' == typeof require && require;
						if (!f && c) return c(i, !0);
						if (u) return u(i, !0);
						var a = new Error("Cannot find module '" + i + "'");
						throw ((a.code = 'MODULE_NOT_FOUND'), a);
					}
					var p = (n[i] = {exports: {}});
					e[i][0].call(
						p.exports,
						function(r) {
							var n = e[i][1][r];
							return o(n || r);
						},
						p,
						p.exports,
						r,
						e,
						n,
						t
					);
				}
				return n[i].exports;
			}
			for (var u = 'function' == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
			return o;
		}
		return r;
	})()(
		{
			1: [
				function(require, module, exports) {
					'use strict';

					exports.byteLength = byteLength;
					exports.toByteArray = toByteArray;
					exports.fromByteArray = fromByteArray;

					var lookup = [];
					var revLookup = [];
					var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

					var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
					for (var i = 0, len = code.length; i < len; ++i) {
						lookup[i] = code[i];
						revLookup[code.charCodeAt(i)] = i;
					}

					// Support decoding URL-safe base64 strings, as Node.js does.
					// See: https://en.wikipedia.org/wiki/Base64#URL_applications
					revLookup['-'.charCodeAt(0)] = 62;
					revLookup['_'.charCodeAt(0)] = 63;

					function getLens(b64) {
						var len = b64.length;

						if (len % 4 > 0) {
							throw new Error('Invalid string. Length must be a multiple of 4');
						}

						// Trim off extra bytes after placeholder bytes are found
						// See: https://github.com/beatgammit/base64-js/issues/42
						var validLen = b64.indexOf('=');
						if (validLen === -1) validLen = len;

						var placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);

						return [validLen, placeHoldersLen];
					}

					// base64 is 4/3 + up to two characters of the original data
					function byteLength(b64) {
						var lens = getLens(b64);
						var validLen = lens[0];
						var placeHoldersLen = lens[1];
						return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
					}

					function _byteLength(b64, validLen, placeHoldersLen) {
						return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
					}

					function toByteArray(b64) {
						var tmp;
						var lens = getLens(b64);
						var validLen = lens[0];
						var placeHoldersLen = lens[1];

						var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

						var curByte = 0;

						// if there are placeholders, only get up to the last complete 4 chars
						var len = placeHoldersLen > 0 ? validLen - 4 : validLen;

						for (var i = 0; i < len; i += 4) {
							tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
							arr[curByte++] = (tmp >> 16) & 0xff;
							arr[curByte++] = (tmp >> 8) & 0xff;
							arr[curByte++] = tmp & 0xff;
						}

						if (placeHoldersLen === 2) {
							tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
							arr[curByte++] = tmp & 0xff;
						}

						if (placeHoldersLen === 1) {
							tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
							arr[curByte++] = (tmp >> 8) & 0xff;
							arr[curByte++] = tmp & 0xff;
						}

						return arr;
					}

					function tripletToBase64(num) {
						return lookup[(num >> 18) & 0x3f] + lookup[(num >> 12) & 0x3f] + lookup[(num >> 6) & 0x3f] + lookup[num & 0x3f];
					}

					function encodeChunk(uint8, start, end) {
						var tmp;
						var output = [];
						for (var i = start; i < end; i += 3) {
							tmp = ((uint8[i] << 16) & 0xff0000) + ((uint8[i + 1] << 8) & 0xff00) + (uint8[i + 2] & 0xff);
							output.push(tripletToBase64(tmp));
						}
						return output.join('');
					}

					function fromByteArray(uint8) {
						var tmp;
						var len = uint8.length;
						var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
						var parts = [];
						var maxChunkLength = 16383; // must be multiple of 3

						// go through the array every three bytes, we'll deal with trailing stuff later
						for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
							parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
						}

						// pad the end with zeros, but make sure to not forget the extra bytes
						if (extraBytes === 1) {
							tmp = uint8[len - 1];
							parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + '==');
						} else if (extraBytes === 2) {
							tmp = (uint8[len - 2] << 8) + uint8[len - 1];
							parts.push(lookup[tmp >> 10] + lookup[(tmp >> 4) & 0x3f] + lookup[(tmp << 2) & 0x3f] + '=');
						}

						return parts.join('');
					}
				},
				{},
			],
			2: [function(require, module, exports) {}, {}],
			3: [
				function(require, module, exports) {
					/*!
					 * The buffer module from node.js, for the browser.
					 *
					 * @author   Feross Aboukhadijeh <https://feross.org>
					 * @license  MIT
					 */
					/* eslint-disable no-proto */

					'use strict';

					var base64 = require('base64-js');
					var ieee754 = require('ieee754');

					exports.Buffer = Buffer;
					exports.SlowBuffer = SlowBuffer;
					exports.INSPECT_MAX_BYTES = 50;

					var K_MAX_LENGTH = 0x7fffffff;
					exports.kMaxLength = K_MAX_LENGTH;

					/**
					 * If `Buffer.TYPED_ARRAY_SUPPORT`:
					 *   === true    Use Uint8Array implementation (fastest)
					 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
					 *               implementation (most compatible, even IE6)
					 *
					 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
					 * Opera 11.6+, iOS 4.2+.
					 *
					 * We report that the browser does not support typed arrays if the are not subclassable
					 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
					 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
					 * for __proto__ and has a buggy typed array implementation.
					 */
					Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

					if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' && typeof console.error === 'function') {
						console.error('This browser lacks typed array (Uint8Array) support which is required by ' + '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.');
					}

					function typedArraySupport() {
						// Can typed array instances can be augmented?
						try {
							var arr = new Uint8Array(1);
							arr.__proto__ = {
								__proto__: Uint8Array.prototype,
								foo: function() {
									return 42;
								},
							};
							return arr.foo() === 42;
						} catch (e) {
							return false;
						}
					}

					Object.defineProperty(Buffer.prototype, 'parent', {
						get: function() {
							if (!(this instanceof Buffer)) {
								return undefined;
							}
							return this.buffer;
						},
					});

					Object.defineProperty(Buffer.prototype, 'offset', {
						get: function() {
							if (!(this instanceof Buffer)) {
								return undefined;
							}
							return this.byteOffset;
						},
					});

					function createBuffer(length) {
						if (length > K_MAX_LENGTH) {
							throw new RangeError('Invalid typed array length');
						}
						// Return an augmented `Uint8Array` instance
						var buf = new Uint8Array(length);
						buf.__proto__ = Buffer.prototype;
						return buf;
					}

					/**
					 * The Buffer constructor returns instances of `Uint8Array` that have their
					 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
					 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
					 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
					 * returns a single octet.
					 *
					 * The `Uint8Array` prototype remains unmodified.
					 */

					function Buffer(arg, encodingOrOffset, length) {
						// Common case.
						if (typeof arg === 'number') {
							if (typeof encodingOrOffset === 'string') {
								throw new Error('If encoding is specified then the first argument must be a string');
							}
							return allocUnsafe(arg);
						}
						return from(arg, encodingOrOffset, length);
					}

					// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
					if (typeof Symbol !== 'undefined' && Symbol.species && Buffer[Symbol.species] === Buffer) {
						Object.defineProperty(Buffer, Symbol.species, {
							value: null,
							configurable: true,
							enumerable: false,
							writable: false,
						});
					}

					Buffer.poolSize = 8192; // not used by this implementation

					function from(value, encodingOrOffset, length) {
						if (typeof value === 'number') {
							throw new TypeError('"value" argument must not be a number');
						}

						if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
							return fromArrayBuffer(value, encodingOrOffset, length);
						}

						if (typeof value === 'string') {
							return fromString(value, encodingOrOffset);
						}

						return fromObject(value);
					}

					/**
					 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
					 * if value is a number.
					 * Buffer.from(str[, encoding])
					 * Buffer.from(array)
					 * Buffer.from(buffer)
					 * Buffer.from(arrayBuffer[, byteOffset[, length]])
					 **/
					Buffer.from = function(value, encodingOrOffset, length) {
						return from(value, encodingOrOffset, length);
					};

					// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
					// https://github.com/feross/buffer/pull/148
					Buffer.prototype.__proto__ = Uint8Array.prototype;
					Buffer.__proto__ = Uint8Array;

					function assertSize(size) {
						if (typeof size !== 'number') {
							throw new TypeError('"size" argument must be of type number');
						} else if (size < 0) {
							throw new RangeError('"size" argument must not be negative');
						}
					}

					function alloc(size, fill, encoding) {
						assertSize(size);
						if (size <= 0) {
							return createBuffer(size);
						}
						if (fill !== undefined) {
							// Only pay attention to encoding if it's a string. This
							// prevents accidentally sending in a number that would
							// be interpretted as a start offset.
							return typeof encoding === 'string' ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
						}
						return createBuffer(size);
					}

					/**
					 * Creates a new filled Buffer instance.
					 * alloc(size[, fill[, encoding]])
					 **/
					Buffer.alloc = function(size, fill, encoding) {
						return alloc(size, fill, encoding);
					};

					function allocUnsafe(size) {
						assertSize(size);
						return createBuffer(size < 0 ? 0 : checked(size) | 0);
					}

					/**
					 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
					 * */
					Buffer.allocUnsafe = function(size) {
						return allocUnsafe(size);
					};
					/**
					 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
					 */
					Buffer.allocUnsafeSlow = function(size) {
						return allocUnsafe(size);
					};

					function fromString(string, encoding) {
						if (typeof encoding !== 'string' || encoding === '') {
							encoding = 'utf8';
						}

						if (!Buffer.isEncoding(encoding)) {
							throw new TypeError('Unknown encoding: ' + encoding);
						}

						var length = byteLength(string, encoding) | 0;
						var buf = createBuffer(length);

						var actual = buf.write(string, encoding);

						if (actual !== length) {
							// Writing a hex string, for example, that contains invalid characters will
							// cause everything after the first invalid character to be ignored. (e.g.
							// 'abxxcd' will be treated as 'ab')
							buf = buf.slice(0, actual);
						}

						return buf;
					}

					function fromArrayLike(array) {
						var length = array.length < 0 ? 0 : checked(array.length) | 0;
						var buf = createBuffer(length);
						for (var i = 0; i < length; i += 1) {
							buf[i] = array[i] & 255;
						}
						return buf;
					}

					function fromArrayBuffer(array, byteOffset, length) {
						if (byteOffset < 0 || array.byteLength < byteOffset) {
							throw new RangeError('"offset" is outside of buffer bounds');
						}

						if (array.byteLength < byteOffset + (length || 0)) {
							throw new RangeError('"length" is outside of buffer bounds');
						}

						var buf;
						if (byteOffset === undefined && length === undefined) {
							buf = new Uint8Array(array);
						} else if (length === undefined) {
							buf = new Uint8Array(array, byteOffset);
						} else {
							buf = new Uint8Array(array, byteOffset, length);
						}

						// Return an augmented `Uint8Array` instance
						buf.__proto__ = Buffer.prototype;
						return buf;
					}

					function fromObject(obj) {
						if (Buffer.isBuffer(obj)) {
							var len = checked(obj.length) | 0;
							var buf = createBuffer(len);

							if (buf.length === 0) {
								return buf;
							}

							obj.copy(buf, 0, 0, len);
							return buf;
						}

						if (obj) {
							if (ArrayBuffer.isView(obj) || 'length' in obj) {
								if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
									return createBuffer(0);
								}
								return fromArrayLike(obj);
							}

							if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
								return fromArrayLike(obj.data);
							}
						}

						throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.');
					}

					function checked(length) {
						// Note: cannot use `length < K_MAX_LENGTH` here because that fails when
						// length is NaN (which is otherwise coerced to zero.)
						if (length >= K_MAX_LENGTH) {
							throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes');
						}
						return length | 0;
					}

					function SlowBuffer(length) {
						if (+length != length) {
							// eslint-disable-line eqeqeq
							length = 0;
						}
						return Buffer.alloc(+length);
					}

					Buffer.isBuffer = function isBuffer(b) {
						return b != null && b._isBuffer === true;
					};

					Buffer.compare = function compare(a, b) {
						if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
							throw new TypeError('Arguments must be Buffers');
						}

						if (a === b) return 0;

						var x = a.length;
						var y = b.length;

						for (var i = 0, len = Math.min(x, y); i < len; ++i) {
							if (a[i] !== b[i]) {
								x = a[i];
								y = b[i];
								break;
							}
						}

						if (x < y) return -1;
						if (y < x) return 1;
						return 0;
					};

					Buffer.isEncoding = function isEncoding(encoding) {
						switch (String(encoding).toLowerCase()) {
							case 'hex':
							case 'utf8':
							case 'utf-8':
							case 'ascii':
							case 'latin1':
							case 'binary':
							case 'base64':
							case 'ucs2':
							case 'ucs-2':
							case 'utf16le':
							case 'utf-16le':
								return true;
							default:
								return false;
						}
					};

					Buffer.concat = function concat(list, length) {
						if (!Array.isArray(list)) {
							throw new TypeError('"list" argument must be an Array of Buffers');
						}

						if (list.length === 0) {
							return Buffer.alloc(0);
						}

						var i;
						if (length === undefined) {
							length = 0;
							for (i = 0; i < list.length; ++i) {
								length += list[i].length;
							}
						}

						var buffer = Buffer.allocUnsafe(length);
						var pos = 0;
						for (i = 0; i < list.length; ++i) {
							var buf = list[i];
							if (ArrayBuffer.isView(buf)) {
								buf = Buffer.from(buf);
							}
							if (!Buffer.isBuffer(buf)) {
								throw new TypeError('"list" argument must be an Array of Buffers');
							}
							buf.copy(buffer, pos);
							pos += buf.length;
						}
						return buffer;
					};

					function byteLength(string, encoding) {
						if (Buffer.isBuffer(string)) {
							return string.length;
						}
						if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
							return string.byteLength;
						}
						if (typeof string !== 'string') {
							string = '' + string;
						}

						var len = string.length;
						if (len === 0) return 0;

						// Use a for loop to avoid recursion
						var loweredCase = false;
						for (;;) {
							switch (encoding) {
								case 'ascii':
								case 'latin1':
								case 'binary':
									return len;
								case 'utf8':
								case 'utf-8':
								case undefined:
									return utf8ToBytes(string).length;
								case 'ucs2':
								case 'ucs-2':
								case 'utf16le':
								case 'utf-16le':
									return len * 2;
								case 'hex':
									return len >>> 1;
								case 'base64':
									return base64ToBytes(string).length;
								default:
									if (loweredCase) return utf8ToBytes(string).length; // assume utf8
									encoding = ('' + encoding).toLowerCase();
									loweredCase = true;
							}
						}
					}
					Buffer.byteLength = byteLength;

					function slowToString(encoding, start, end) {
						var loweredCase = false;

						// No need to verify that "this.length <= MAX_UINT32" since it's a read-only
						// property of a typed array.

						// This behaves neither like String nor Uint8Array in that we set start/end
						// to their upper/lower bounds if the value passed is out of range.
						// undefined is handled specially as per ECMA-262 6th Edition,
						// Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
						if (start === undefined || start < 0) {
							start = 0;
						}
						// Return early if start > this.length. Done here to prevent potential uint32
						// coercion fail below.
						if (start > this.length) {
							return '';
						}

						if (end === undefined || end > this.length) {
							end = this.length;
						}

						if (end <= 0) {
							return '';
						}

						// Force coersion to uint32. This will also coerce falsey/NaN values to 0.
						end >>>= 0;
						start >>>= 0;

						if (end <= start) {
							return '';
						}

						if (!encoding) encoding = 'utf8';

						while (true) {
							switch (encoding) {
								case 'hex':
									return hexSlice(this, start, end);

								case 'utf8':
								case 'utf-8':
									return utf8Slice(this, start, end);

								case 'ascii':
									return asciiSlice(this, start, end);

								case 'latin1':
								case 'binary':
									return latin1Slice(this, start, end);

								case 'base64':
									return base64Slice(this, start, end);

								case 'ucs2':
								case 'ucs-2':
								case 'utf16le':
								case 'utf-16le':
									return utf16leSlice(this, start, end);

								default:
									if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
									encoding = (encoding + '').toLowerCase();
									loweredCase = true;
							}
						}
					}

					// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
					// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
					// reliably in a browserify context because there could be multiple different
					// copies of the 'buffer' package in use. This method works even for Buffer
					// instances that were created from another copy of the `buffer` package.
					// See: https://github.com/feross/buffer/issues/154
					Buffer.prototype._isBuffer = true;

					function swap(b, n, m) {
						var i = b[n];
						b[n] = b[m];
						b[m] = i;
					}

					Buffer.prototype.swap16 = function swap16() {
						var len = this.length;
						if (len % 2 !== 0) {
							throw new RangeError('Buffer size must be a multiple of 16-bits');
						}
						for (var i = 0; i < len; i += 2) {
							swap(this, i, i + 1);
						}
						return this;
					};

					Buffer.prototype.swap32 = function swap32() {
						var len = this.length;
						if (len % 4 !== 0) {
							throw new RangeError('Buffer size must be a multiple of 32-bits');
						}
						for (var i = 0; i < len; i += 4) {
							swap(this, i, i + 3);
							swap(this, i + 1, i + 2);
						}
						return this;
					};

					Buffer.prototype.swap64 = function swap64() {
						var len = this.length;
						if (len % 8 !== 0) {
							throw new RangeError('Buffer size must be a multiple of 64-bits');
						}
						for (var i = 0; i < len; i += 8) {
							swap(this, i, i + 7);
							swap(this, i + 1, i + 6);
							swap(this, i + 2, i + 5);
							swap(this, i + 3, i + 4);
						}
						return this;
					};

					Buffer.prototype.toString = function toString() {
						var length = this.length;
						if (length === 0) return '';
						if (arguments.length === 0) return utf8Slice(this, 0, length);
						return slowToString.apply(this, arguments);
					};

					Buffer.prototype.toLocaleString = Buffer.prototype.toString;

					Buffer.prototype.equals = function equals(b) {
						if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
						if (this === b) return true;
						return Buffer.compare(this, b) === 0;
					};

					Buffer.prototype.inspect = function inspect() {
						var str = '';
						var max = exports.INSPECT_MAX_BYTES;
						if (this.length > 0) {
							str = this.toString('hex', 0, max)
								.match(/.{2}/g)
								.join(' ');
							if (this.length > max) str += ' ... ';
						}
						return '<Buffer ' + str + '>';
					};

					Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
						if (!Buffer.isBuffer(target)) {
							throw new TypeError('Argument must be a Buffer');
						}

						if (start === undefined) {
							start = 0;
						}
						if (end === undefined) {
							end = target ? target.length : 0;
						}
						if (thisStart === undefined) {
							thisStart = 0;
						}
						if (thisEnd === undefined) {
							thisEnd = this.length;
						}

						if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
							throw new RangeError('out of range index');
						}

						if (thisStart >= thisEnd && start >= end) {
							return 0;
						}
						if (thisStart >= thisEnd) {
							return -1;
						}
						if (start >= end) {
							return 1;
						}

						start >>>= 0;
						end >>>= 0;
						thisStart >>>= 0;
						thisEnd >>>= 0;

						if (this === target) return 0;

						var x = thisEnd - thisStart;
						var y = end - start;
						var len = Math.min(x, y);

						var thisCopy = this.slice(thisStart, thisEnd);
						var targetCopy = target.slice(start, end);

						for (var i = 0; i < len; ++i) {
							if (thisCopy[i] !== targetCopy[i]) {
								x = thisCopy[i];
								y = targetCopy[i];
								break;
							}
						}

						if (x < y) return -1;
						if (y < x) return 1;
						return 0;
					};

					// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
					// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
					//
					// Arguments:
					// - buffer - a Buffer to search
					// - val - a string, Buffer, or number
					// - byteOffset - an index into `buffer`; will be clamped to an int32
					// - encoding - an optional encoding, relevant is val is a string
					// - dir - true for indexOf, false for lastIndexOf
					function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
						// Empty buffer means no match
						if (buffer.length === 0) return -1;

						// Normalize byteOffset
						if (typeof byteOffset === 'string') {
							encoding = byteOffset;
							byteOffset = 0;
						} else if (byteOffset > 0x7fffffff) {
							byteOffset = 0x7fffffff;
						} else if (byteOffset < -0x80000000) {
							byteOffset = -0x80000000;
						}
						byteOffset = +byteOffset; // Coerce to Number.
						if (numberIsNaN(byteOffset)) {
							// byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
							byteOffset = dir ? 0 : buffer.length - 1;
						}

						// Normalize byteOffset: negative offsets start from the end of the buffer
						if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
						if (byteOffset >= buffer.length) {
							if (dir) return -1;
							else byteOffset = buffer.length - 1;
						} else if (byteOffset < 0) {
							if (dir) byteOffset = 0;
							else return -1;
						}

						// Normalize val
						if (typeof val === 'string') {
							val = Buffer.from(val, encoding);
						}

						// Finally, search either indexOf (if dir is true) or lastIndexOf
						if (Buffer.isBuffer(val)) {
							// Special case: looking for empty string/buffer always fails
							if (val.length === 0) {
								return -1;
							}
							return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
						} else if (typeof val === 'number') {
							val = val & 0xff; // Search for a byte value [0-255]
							if (typeof Uint8Array.prototype.indexOf === 'function') {
								if (dir) {
									return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
								} else {
									return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
								}
							}
							return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
						}

						throw new TypeError('val must be string, number or Buffer');
					}

					function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
						var indexSize = 1;
						var arrLength = arr.length;
						var valLength = val.length;

						if (encoding !== undefined) {
							encoding = String(encoding).toLowerCase();
							if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
								if (arr.length < 2 || val.length < 2) {
									return -1;
								}
								indexSize = 2;
								arrLength /= 2;
								valLength /= 2;
								byteOffset /= 2;
							}
						}

						function read(buf, i) {
							if (indexSize === 1) {
								return buf[i];
							} else {
								return buf.readUInt16BE(i * indexSize);
							}
						}

						var i;
						if (dir) {
							var foundIndex = -1;
							for (i = byteOffset; i < arrLength; i++) {
								if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
									if (foundIndex === -1) foundIndex = i;
									if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
								} else {
									if (foundIndex !== -1) i -= i - foundIndex;
									foundIndex = -1;
								}
							}
						} else {
							if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
							for (i = byteOffset; i >= 0; i--) {
								var found = true;
								for (var j = 0; j < valLength; j++) {
									if (read(arr, i + j) !== read(val, j)) {
										found = false;
										break;
									}
								}
								if (found) return i;
							}
						}

						return -1;
					}

					Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
						return this.indexOf(val, byteOffset, encoding) !== -1;
					};

					Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
						return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
					};

					Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
						return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
					};

					function hexWrite(buf, string, offset, length) {
						offset = Number(offset) || 0;
						var remaining = buf.length - offset;
						if (!length) {
							length = remaining;
						} else {
							length = Number(length);
							if (length > remaining) {
								length = remaining;
							}
						}

						var strLen = string.length;

						if (length > strLen / 2) {
							length = strLen / 2;
						}
						for (var i = 0; i < length; ++i) {
							var parsed = parseInt(string.substr(i * 2, 2), 16);
							if (numberIsNaN(parsed)) return i;
							buf[offset + i] = parsed;
						}
						return i;
					}

					function utf8Write(buf, string, offset, length) {
						return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
					}

					function asciiWrite(buf, string, offset, length) {
						return blitBuffer(asciiToBytes(string), buf, offset, length);
					}

					function latin1Write(buf, string, offset, length) {
						return asciiWrite(buf, string, offset, length);
					}

					function base64Write(buf, string, offset, length) {
						return blitBuffer(base64ToBytes(string), buf, offset, length);
					}

					function ucs2Write(buf, string, offset, length) {
						return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
					}

					Buffer.prototype.write = function write(string, offset, length, encoding) {
						// Buffer#write(string)
						if (offset === undefined) {
							encoding = 'utf8';
							length = this.length;
							offset = 0;
							// Buffer#write(string, encoding)
						} else if (length === undefined && typeof offset === 'string') {
							encoding = offset;
							length = this.length;
							offset = 0;
							// Buffer#write(string, offset[, length][, encoding])
						} else if (isFinite(offset)) {
							offset = offset >>> 0;
							if (isFinite(length)) {
								length = length >>> 0;
								if (encoding === undefined) encoding = 'utf8';
							} else {
								encoding = length;
								length = undefined;
							}
						} else {
							throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
						}

						var remaining = this.length - offset;
						if (length === undefined || length > remaining) length = remaining;

						if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
							throw new RangeError('Attempt to write outside buffer bounds');
						}

						if (!encoding) encoding = 'utf8';

						var loweredCase = false;
						for (;;) {
							switch (encoding) {
								case 'hex':
									return hexWrite(this, string, offset, length);

								case 'utf8':
								case 'utf-8':
									return utf8Write(this, string, offset, length);

								case 'ascii':
									return asciiWrite(this, string, offset, length);

								case 'latin1':
								case 'binary':
									return latin1Write(this, string, offset, length);

								case 'base64':
									// Warning: maxLength not taken into account in base64Write
									return base64Write(this, string, offset, length);

								case 'ucs2':
								case 'ucs-2':
								case 'utf16le':
								case 'utf-16le':
									return ucs2Write(this, string, offset, length);

								default:
									if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
									encoding = ('' + encoding).toLowerCase();
									loweredCase = true;
							}
						}
					};

					Buffer.prototype.toJSON = function toJSON() {
						return {
							type: 'Buffer',
							data: Array.prototype.slice.call(this._arr || this, 0),
						};
					};

					function base64Slice(buf, start, end) {
						if (start === 0 && end === buf.length) {
							return base64.fromByteArray(buf);
						} else {
							return base64.fromByteArray(buf.slice(start, end));
						}
					}

					function utf8Slice(buf, start, end) {
						end = Math.min(buf.length, end);
						var res = [];

						var i = start;
						while (i < end) {
							var firstByte = buf[i];
							var codePoint = null;
							var bytesPerSequence = firstByte > 0xef ? 4 : firstByte > 0xdf ? 3 : firstByte > 0xbf ? 2 : 1;

							if (i + bytesPerSequence <= end) {
								var secondByte, thirdByte, fourthByte, tempCodePoint;

								switch (bytesPerSequence) {
									case 1:
										if (firstByte < 0x80) {
											codePoint = firstByte;
										}
										break;
									case 2:
										secondByte = buf[i + 1];
										if ((secondByte & 0xc0) === 0x80) {
											tempCodePoint = ((firstByte & 0x1f) << 0x6) | (secondByte & 0x3f);
											if (tempCodePoint > 0x7f) {
												codePoint = tempCodePoint;
											}
										}
										break;
									case 3:
										secondByte = buf[i + 1];
										thirdByte = buf[i + 2];
										if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
											tempCodePoint = ((firstByte & 0xf) << 0xc) | ((secondByte & 0x3f) << 0x6) | (thirdByte & 0x3f);
											if (tempCodePoint > 0x7ff && (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)) {
												codePoint = tempCodePoint;
											}
										}
										break;
									case 4:
										secondByte = buf[i + 1];
										thirdByte = buf[i + 2];
										fourthByte = buf[i + 3];
										if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80 && (fourthByte & 0xc0) === 0x80) {
											tempCodePoint = ((firstByte & 0xf) << 0x12) | ((secondByte & 0x3f) << 0xc) | ((thirdByte & 0x3f) << 0x6) | (fourthByte & 0x3f);
											if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
												codePoint = tempCodePoint;
											}
										}
								}
							}

							if (codePoint === null) {
								// we did not generate a valid codePoint so insert a
								// replacement char (U+FFFD) and advance only 1 byte
								codePoint = 0xfffd;
								bytesPerSequence = 1;
							} else if (codePoint > 0xffff) {
								// encode to utf16 (surrogate pair dance)
								codePoint -= 0x10000;
								res.push(((codePoint >>> 10) & 0x3ff) | 0xd800);
								codePoint = 0xdc00 | (codePoint & 0x3ff);
							}

							res.push(codePoint);
							i += bytesPerSequence;
						}

						return decodeCodePointsArray(res);
					}

					// Based on http://stackoverflow.com/a/22747272/680742, the browser with
					// the lowest limit is Chrome, with 0x10000 args.
					// We go 1 magnitude less, for safety
					var MAX_ARGUMENTS_LENGTH = 0x1000;

					function decodeCodePointsArray(codePoints) {
						var len = codePoints.length;
						if (len <= MAX_ARGUMENTS_LENGTH) {
							return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
						}

						// Decode in chunks to avoid "call stack size exceeded".
						var res = '';
						var i = 0;
						while (i < len) {
							res += String.fromCharCode.apply(String, codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH)));
						}
						return res;
					}

					function asciiSlice(buf, start, end) {
						var ret = '';
						end = Math.min(buf.length, end);

						for (var i = start; i < end; ++i) {
							ret += String.fromCharCode(buf[i] & 0x7f);
						}
						return ret;
					}

					function latin1Slice(buf, start, end) {
						var ret = '';
						end = Math.min(buf.length, end);

						for (var i = start; i < end; ++i) {
							ret += String.fromCharCode(buf[i]);
						}
						return ret;
					}

					function hexSlice(buf, start, end) {
						var len = buf.length;

						if (!start || start < 0) start = 0;
						if (!end || end < 0 || end > len) end = len;

						var out = '';
						for (var i = start; i < end; ++i) {
							out += toHex(buf[i]);
						}
						return out;
					}

					function utf16leSlice(buf, start, end) {
						var bytes = buf.slice(start, end);
						var res = '';
						for (var i = 0; i < bytes.length; i += 2) {
							res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
						}
						return res;
					}

					Buffer.prototype.slice = function slice(start, end) {
						var len = this.length;
						start = ~~start;
						end = end === undefined ? len : ~~end;

						if (start < 0) {
							start += len;
							if (start < 0) start = 0;
						} else if (start > len) {
							start = len;
						}

						if (end < 0) {
							end += len;
							if (end < 0) end = 0;
						} else if (end > len) {
							end = len;
						}

						if (end < start) end = start;

						var newBuf = this.subarray(start, end);
						// Return an augmented `Uint8Array` instance
						newBuf.__proto__ = Buffer.prototype;
						return newBuf;
					};

					/*
					 * Need to make sure that buffer isn't trying to write out of bounds.
					 */
					function checkOffset(offset, ext, length) {
						if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
						if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
					}

					Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
						offset = offset >>> 0;
						byteLength = byteLength >>> 0;
						if (!noAssert) checkOffset(offset, byteLength, this.length);

						var val = this[offset];
						var mul = 1;
						var i = 0;
						while (++i < byteLength && (mul *= 0x100)) {
							val += this[offset + i] * mul;
						}

						return val;
					};

					Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
						offset = offset >>> 0;
						byteLength = byteLength >>> 0;
						if (!noAssert) {
							checkOffset(offset, byteLength, this.length);
						}

						var val = this[offset + --byteLength];
						var mul = 1;
						while (byteLength > 0 && (mul *= 0x100)) {
							val += this[offset + --byteLength] * mul;
						}

						return val;
					};

					Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 1, this.length);
						return this[offset];
					};

					Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 2, this.length);
						return this[offset] | (this[offset + 1] << 8);
					};

					Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 2, this.length);
						return (this[offset] << 8) | this[offset + 1];
					};

					Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 4, this.length);

						return (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) + this[offset + 3] * 0x1000000;
					};

					Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 4, this.length);

						return this[offset] * 0x1000000 + ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3]);
					};

					Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
						offset = offset >>> 0;
						byteLength = byteLength >>> 0;
						if (!noAssert) checkOffset(offset, byteLength, this.length);

						var val = this[offset];
						var mul = 1;
						var i = 0;
						while (++i < byteLength && (mul *= 0x100)) {
							val += this[offset + i] * mul;
						}
						mul *= 0x80;

						if (val >= mul) val -= Math.pow(2, 8 * byteLength);

						return val;
					};

					Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
						offset = offset >>> 0;
						byteLength = byteLength >>> 0;
						if (!noAssert) checkOffset(offset, byteLength, this.length);

						var i = byteLength;
						var mul = 1;
						var val = this[offset + --i];
						while (i > 0 && (mul *= 0x100)) {
							val += this[offset + --i] * mul;
						}
						mul *= 0x80;

						if (val >= mul) val -= Math.pow(2, 8 * byteLength);

						return val;
					};

					Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 1, this.length);
						if (!(this[offset] & 0x80)) return this[offset];
						return (0xff - this[offset] + 1) * -1;
					};

					Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 2, this.length);
						var val = this[offset] | (this[offset + 1] << 8);
						return val & 0x8000 ? val | 0xffff0000 : val;
					};

					Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 2, this.length);
						var val = this[offset + 1] | (this[offset] << 8);
						return val & 0x8000 ? val | 0xffff0000 : val;
					};

					Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 4, this.length);

						return this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16) | (this[offset + 3] << 24);
					};

					Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 4, this.length);

						return (this[offset] << 24) | (this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3];
					};

					Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 4, this.length);
						return ieee754.read(this, offset, true, 23, 4);
					};

					Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 4, this.length);
						return ieee754.read(this, offset, false, 23, 4);
					};

					Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 8, this.length);
						return ieee754.read(this, offset, true, 52, 8);
					};

					Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
						offset = offset >>> 0;
						if (!noAssert) checkOffset(offset, 8, this.length);
						return ieee754.read(this, offset, false, 52, 8);
					};

					function checkInt(buf, value, offset, ext, max, min) {
						if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
						if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
						if (offset + ext > buf.length) throw new RangeError('Index out of range');
					}

					Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
						value = +value;
						offset = offset >>> 0;
						byteLength = byteLength >>> 0;
						if (!noAssert) {
							var maxBytes = Math.pow(2, 8 * byteLength) - 1;
							checkInt(this, value, offset, byteLength, maxBytes, 0);
						}

						var mul = 1;
						var i = 0;
						this[offset] = value & 0xff;
						while (++i < byteLength && (mul *= 0x100)) {
							this[offset + i] = (value / mul) & 0xff;
						}

						return offset + byteLength;
					};

					Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
						value = +value;
						offset = offset >>> 0;
						byteLength = byteLength >>> 0;
						if (!noAssert) {
							var maxBytes = Math.pow(2, 8 * byteLength) - 1;
							checkInt(this, value, offset, byteLength, maxBytes, 0);
						}

						var i = byteLength - 1;
						var mul = 1;
						this[offset + i] = value & 0xff;
						while (--i >= 0 && (mul *= 0x100)) {
							this[offset + i] = (value / mul) & 0xff;
						}

						return offset + byteLength;
					};

					Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
						this[offset] = value & 0xff;
						return offset + 1;
					};

					Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
						this[offset] = value & 0xff;
						this[offset + 1] = value >>> 8;
						return offset + 2;
					};

					Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
						this[offset] = value >>> 8;
						this[offset + 1] = value & 0xff;
						return offset + 2;
					};

					Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
						this[offset + 3] = value >>> 24;
						this[offset + 2] = value >>> 16;
						this[offset + 1] = value >>> 8;
						this[offset] = value & 0xff;
						return offset + 4;
					};

					Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
						this[offset] = value >>> 24;
						this[offset + 1] = value >>> 16;
						this[offset + 2] = value >>> 8;
						this[offset + 3] = value & 0xff;
						return offset + 4;
					};

					Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) {
							var limit = Math.pow(2, 8 * byteLength - 1);

							checkInt(this, value, offset, byteLength, limit - 1, -limit);
						}

						var i = 0;
						var mul = 1;
						var sub = 0;
						this[offset] = value & 0xff;
						while (++i < byteLength && (mul *= 0x100)) {
							if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
								sub = 1;
							}
							this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
						}

						return offset + byteLength;
					};

					Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) {
							var limit = Math.pow(2, 8 * byteLength - 1);

							checkInt(this, value, offset, byteLength, limit - 1, -limit);
						}

						var i = byteLength - 1;
						var mul = 1;
						var sub = 0;
						this[offset + i] = value & 0xff;
						while (--i >= 0 && (mul *= 0x100)) {
							if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
								sub = 1;
							}
							this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
						}

						return offset + byteLength;
					};

					Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
						if (value < 0) value = 0xff + value + 1;
						this[offset] = value & 0xff;
						return offset + 1;
					};

					Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
						this[offset] = value & 0xff;
						this[offset + 1] = value >>> 8;
						return offset + 2;
					};

					Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
						this[offset] = value >>> 8;
						this[offset + 1] = value & 0xff;
						return offset + 2;
					};

					Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
						this[offset] = value & 0xff;
						this[offset + 1] = value >>> 8;
						this[offset + 2] = value >>> 16;
						this[offset + 3] = value >>> 24;
						return offset + 4;
					};

					Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
						if (value < 0) value = 0xffffffff + value + 1;
						this[offset] = value >>> 24;
						this[offset + 1] = value >>> 16;
						this[offset + 2] = value >>> 8;
						this[offset + 3] = value & 0xff;
						return offset + 4;
					};

					function checkIEEE754(buf, value, offset, ext, max, min) {
						if (offset + ext > buf.length) throw new RangeError('Index out of range');
						if (offset < 0) throw new RangeError('Index out of range');
					}

					function writeFloat(buf, value, offset, littleEndian, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) {
							checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38);
						}
						ieee754.write(buf, value, offset, littleEndian, 23, 4);
						return offset + 4;
					}

					Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
						return writeFloat(this, value, offset, true, noAssert);
					};

					Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
						return writeFloat(this, value, offset, false, noAssert);
					};

					function writeDouble(buf, value, offset, littleEndian, noAssert) {
						value = +value;
						offset = offset >>> 0;
						if (!noAssert) {
							checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308);
						}
						ieee754.write(buf, value, offset, littleEndian, 52, 8);
						return offset + 8;
					}

					Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
						return writeDouble(this, value, offset, true, noAssert);
					};

					Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
						return writeDouble(this, value, offset, false, noAssert);
					};

					// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
					Buffer.prototype.copy = function copy(target, targetStart, start, end) {
						if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer');
						if (!start) start = 0;
						if (!end && end !== 0) end = this.length;
						if (targetStart >= target.length) targetStart = target.length;
						if (!targetStart) targetStart = 0;
						if (end > 0 && end < start) end = start;

						// Copy 0 bytes; we're done
						if (end === start) return 0;
						if (target.length === 0 || this.length === 0) return 0;

						// Fatal error conditions
						if (targetStart < 0) {
							throw new RangeError('targetStart out of bounds');
						}
						if (start < 0 || start >= this.length) throw new RangeError('Index out of range');
						if (end < 0) throw new RangeError('sourceEnd out of bounds');

						// Are we oob?
						if (end > this.length) end = this.length;
						if (target.length - targetStart < end - start) {
							end = target.length - targetStart + start;
						}

						var len = end - start;

						if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
							// Use built-in when available, missing from IE11
							this.copyWithin(targetStart, start, end);
						} else if (this === target && start < targetStart && targetStart < end) {
							// descending copy from end
							for (var i = len - 1; i >= 0; --i) {
								target[i + targetStart] = this[i + start];
							}
						} else {
							Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
						}

						return len;
					};

					// Usage:
					//    buffer.fill(number[, offset[, end]])
					//    buffer.fill(buffer[, offset[, end]])
					//    buffer.fill(string[, offset[, end]][, encoding])
					Buffer.prototype.fill = function fill(val, start, end, encoding) {
						// Handle string cases:
						if (typeof val === 'string') {
							if (typeof start === 'string') {
								encoding = start;
								start = 0;
								end = this.length;
							} else if (typeof end === 'string') {
								encoding = end;
								end = this.length;
							}
							if (encoding !== undefined && typeof encoding !== 'string') {
								throw new TypeError('encoding must be a string');
							}
							if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
								throw new TypeError('Unknown encoding: ' + encoding);
							}
							if (val.length === 1) {
								var code = val.charCodeAt(0);
								if ((encoding === 'utf8' && code < 128) || encoding === 'latin1') {
									// Fast path: If `val` fits into a single byte, use that numeric value.
									val = code;
								}
							}
						} else if (typeof val === 'number') {
							val = val & 255;
						}

						// Invalid ranges are not set to a default, so can range check early.
						if (start < 0 || this.length < start || this.length < end) {
							throw new RangeError('Out of range index');
						}

						if (end <= start) {
							return this;
						}

						start = start >>> 0;
						end = end === undefined ? this.length : end >>> 0;

						if (!val) val = 0;

						var i;
						if (typeof val === 'number') {
							for (i = start; i < end; ++i) {
								this[i] = val;
							}
						} else {
							var bytes = Buffer.isBuffer(val) ? val : new Buffer(val, encoding);
							var len = bytes.length;
							if (len === 0) {
								throw new TypeError('The value "' + val + '" is invalid for argument "value"');
							}
							for (i = 0; i < end - start; ++i) {
								this[i + start] = bytes[i % len];
							}
						}

						return this;
					};

					// HELPER FUNCTIONS
					// ================

					var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

					function base64clean(str) {
						// Node takes equal signs as end of the Base64 encoding
						str = str.split('=')[0];
						// Node strips out invalid characters like \n and \t from the string, base64-js does not
						str = str.trim().replace(INVALID_BASE64_RE, '');
						// Node converts strings with length < 2 to ''
						if (str.length < 2) return '';
						// Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
						while (str.length % 4 !== 0) {
							str = str + '=';
						}
						return str;
					}

					function toHex(n) {
						if (n < 16) return '0' + n.toString(16);
						return n.toString(16);
					}

					function utf8ToBytes(string, units) {
						units = units || Infinity;
						var codePoint;
						var length = string.length;
						var leadSurrogate = null;
						var bytes = [];

						for (var i = 0; i < length; ++i) {
							codePoint = string.charCodeAt(i);

							// is surrogate component
							if (codePoint > 0xd7ff && codePoint < 0xe000) {
								// last char was a lead
								if (!leadSurrogate) {
									// no lead yet
									if (codePoint > 0xdbff) {
										// unexpected trail
										if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
										continue;
									} else if (i + 1 === length) {
										// unpaired lead
										if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
										continue;
									}

									// valid lead
									leadSurrogate = codePoint;

									continue;
								}

								// 2 leads in a row
								if (codePoint < 0xdc00) {
									if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
									leadSurrogate = codePoint;
									continue;
								}

								// valid surrogate pair
								codePoint = (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) + 0x10000;
							} else if (leadSurrogate) {
								// valid bmp char, but last char was a lead
								if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
							}

							leadSurrogate = null;

							// encode utf8
							if (codePoint < 0x80) {
								if ((units -= 1) < 0) break;
								bytes.push(codePoint);
							} else if (codePoint < 0x800) {
								if ((units -= 2) < 0) break;
								bytes.push((codePoint >> 0x6) | 0xc0, (codePoint & 0x3f) | 0x80);
							} else if (codePoint < 0x10000) {
								if ((units -= 3) < 0) break;
								bytes.push((codePoint >> 0xc) | 0xe0, ((codePoint >> 0x6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
							} else if (codePoint < 0x110000) {
								if ((units -= 4) < 0) break;
								bytes.push((codePoint >> 0x12) | 0xf0, ((codePoint >> 0xc) & 0x3f) | 0x80, ((codePoint >> 0x6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
							} else {
								throw new Error('Invalid code point');
							}
						}

						return bytes;
					}

					function asciiToBytes(str) {
						var byteArray = [];
						for (var i = 0; i < str.length; ++i) {
							// Node's code seems to be doing this and not & 0x7F..
							byteArray.push(str.charCodeAt(i) & 0xff);
						}
						return byteArray;
					}

					function utf16leToBytes(str, units) {
						var c, hi, lo;
						var byteArray = [];
						for (var i = 0; i < str.length; ++i) {
							if ((units -= 2) < 0) break;

							c = str.charCodeAt(i);
							hi = c >> 8;
							lo = c % 256;
							byteArray.push(lo);
							byteArray.push(hi);
						}

						return byteArray;
					}

					function base64ToBytes(str) {
						return base64.toByteArray(base64clean(str));
					}

					function blitBuffer(src, dst, offset, length) {
						for (var i = 0; i < length; ++i) {
							if (i + offset >= dst.length || i >= src.length) break;
							dst[i + offset] = src[i];
						}
						return i;
					}

					// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
					// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
					function isArrayBuffer(obj) {
						return obj instanceof ArrayBuffer || (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' && typeof obj.byteLength === 'number');
					}

					function numberIsNaN(obj) {
						return obj !== obj; // eslint-disable-line no-self-compare
					}
				},
				{'base64-js': 1, ieee754: 6},
			],
			4: [
				function(require, module, exports) {
					(function(Buffer) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						// NOTE: These type checking functions intentionally don't use `instanceof`
						// because it is fragile and can be easily faked with `Object.create()`.

						function isArray(arg) {
							if (Array.isArray) {
								return Array.isArray(arg);
							}
							return objectToString(arg) === '[object Array]';
						}
						exports.isArray = isArray;

						function isBoolean(arg) {
							return typeof arg === 'boolean';
						}
						exports.isBoolean = isBoolean;

						function isNull(arg) {
							return arg === null;
						}
						exports.isNull = isNull;

						function isNullOrUndefined(arg) {
							return arg == null;
						}
						exports.isNullOrUndefined = isNullOrUndefined;

						function isNumber(arg) {
							return typeof arg === 'number';
						}
						exports.isNumber = isNumber;

						function isString(arg) {
							return typeof arg === 'string';
						}
						exports.isString = isString;

						function isSymbol(arg) {
							return typeof arg === 'symbol';
						}
						exports.isSymbol = isSymbol;

						function isUndefined(arg) {
							return arg === void 0;
						}
						exports.isUndefined = isUndefined;

						function isRegExp(re) {
							return objectToString(re) === '[object RegExp]';
						}
						exports.isRegExp = isRegExp;

						function isObject(arg) {
							return typeof arg === 'object' && arg !== null;
						}
						exports.isObject = isObject;

						function isDate(d) {
							return objectToString(d) === '[object Date]';
						}
						exports.isDate = isDate;

						function isError(e) {
							return objectToString(e) === '[object Error]' || e instanceof Error;
						}
						exports.isError = isError;

						function isFunction(arg) {
							return typeof arg === 'function';
						}
						exports.isFunction = isFunction;

						function isPrimitive(arg) {
							return (
								arg === null ||
								typeof arg === 'boolean' ||
								typeof arg === 'number' ||
								typeof arg === 'string' ||
								typeof arg === 'symbol' || // ES6 symbol
								typeof arg === 'undefined'
							);
						}
						exports.isPrimitive = isPrimitive;

						exports.isBuffer = Buffer.isBuffer;

						function objectToString(o) {
							return Object.prototype.toString.call(o);
						}
					}.call(this, {isBuffer: require('../../is-buffer/index.js')}));
				},
				{'../../is-buffer/index.js': 8},
			],
			5: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					var objectCreate = Object.create || objectCreatePolyfill;
					var objectKeys = Object.keys || objectKeysPolyfill;
					var bind = Function.prototype.bind || functionBindPolyfill;

					function EventEmitter() {
						if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
							this._events = objectCreate(null);
							this._eventsCount = 0;
						}

						this._maxListeners = this._maxListeners || undefined;
					}
					module.exports = EventEmitter;

					// Backwards-compat with node 0.10.x
					EventEmitter.EventEmitter = EventEmitter;

					EventEmitter.prototype._events = undefined;
					EventEmitter.prototype._maxListeners = undefined;

					// By default EventEmitters will print a warning if more than 10 listeners are
					// added to it. This is a useful default which helps finding memory leaks.
					var defaultMaxListeners = 10;

					var hasDefineProperty;
					try {
						var o = {};
						if (Object.defineProperty) Object.defineProperty(o, 'x', {value: 0});
						hasDefineProperty = o.x === 0;
					} catch (err) {
						hasDefineProperty = false;
					}
					if (hasDefineProperty) {
						Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
							enumerable: true,
							get: function() {
								return defaultMaxListeners;
							},
							set: function(arg) {
								// check whether the input is a positive number (whose value is zero or
								// greater and not a NaN).
								if (typeof arg !== 'number' || arg < 0 || arg !== arg) throw new TypeError('"defaultMaxListeners" must be a positive number');
								defaultMaxListeners = arg;
							},
						});
					} else {
						EventEmitter.defaultMaxListeners = defaultMaxListeners;
					}

					// Obviously not all Emitters should be limited to 10. This function allows
					// that to be increased. Set to zero for unlimited.
					EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
						if (typeof n !== 'number' || n < 0 || isNaN(n)) throw new TypeError('"n" argument must be a positive number');
						this._maxListeners = n;
						return this;
					};

					function $getMaxListeners(that) {
						if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
						return that._maxListeners;
					}

					EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
						return $getMaxListeners(this);
					};

					// These standalone emit* functions are used to optimize calling of event
					// handlers for fast cases because emit() itself often has a variable number of
					// arguments and can be deoptimized because of that. These functions always have
					// the same number of arguments and thus do not get deoptimized, so the code
					// inside them can execute faster.
					function emitNone(handler, isFn, self) {
						if (isFn) handler.call(self);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self);
						}
					}
					function emitOne(handler, isFn, self, arg1) {
						if (isFn) handler.call(self, arg1);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self, arg1);
						}
					}
					function emitTwo(handler, isFn, self, arg1, arg2) {
						if (isFn) handler.call(self, arg1, arg2);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2);
						}
					}
					function emitThree(handler, isFn, self, arg1, arg2, arg3) {
						if (isFn) handler.call(self, arg1, arg2, arg3);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2, arg3);
						}
					}

					function emitMany(handler, isFn, self, args) {
						if (isFn) handler.apply(self, args);
						else {
							var len = handler.length;
							var listeners = arrayClone(handler, len);
							for (var i = 0; i < len; ++i) listeners[i].apply(self, args);
						}
					}

					EventEmitter.prototype.emit = function emit(type) {
						var er, handler, len, args, i, events;
						var doError = type === 'error';

						events = this._events;
						if (events) doError = doError && events.error == null;
						else if (!doError) return false;

						// If there is no 'error' event listener then throw.
						if (doError) {
							if (arguments.length > 1) er = arguments[1];
							if (er instanceof Error) {
								throw er; // Unhandled 'error' event
							} else {
								// At least give some kind of context to the user
								var err = new Error('Unhandled "error" event. (' + er + ')');
								err.context = er;
								throw err;
							}
							return false;
						}

						handler = events[type];

						if (!handler) return false;

						var isFn = typeof handler === 'function';
						len = arguments.length;
						switch (len) {
							// fast cases
							case 1:
								emitNone(handler, isFn, this);
								break;
							case 2:
								emitOne(handler, isFn, this, arguments[1]);
								break;
							case 3:
								emitTwo(handler, isFn, this, arguments[1], arguments[2]);
								break;
							case 4:
								emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
								break;
							// slower
							default:
								args = new Array(len - 1);
								for (i = 1; i < len; i++) args[i - 1] = arguments[i];
								emitMany(handler, isFn, this, args);
						}

						return true;
					};

					function _addListener(target, type, listener, prepend) {
						var m;
						var events;
						var existing;

						if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');

						events = target._events;
						if (!events) {
							events = target._events = objectCreate(null);
							target._eventsCount = 0;
						} else {
							// To avoid recursion in the case that type === "newListener"! Before
							// adding it to the listeners, first emit "newListener".
							if (events.newListener) {
								target.emit('newListener', type, listener.listener ? listener.listener : listener);

								// Re-assign `events` because a newListener handler could have caused the
								// this._events to be assigned to a new object
								events = target._events;
							}
							existing = events[type];
						}

						if (!existing) {
							// Optimize the case of one listener. Don't need the extra array object.
							existing = events[type] = listener;
							++target._eventsCount;
						} else {
							if (typeof existing === 'function') {
								// Adding the second element, need to change to array.
								existing = events[type] = prepend ? [listener, existing] : [existing, listener];
							} else {
								// If we've already got an array, just append.
								if (prepend) {
									existing.unshift(listener);
								} else {
									existing.push(listener);
								}
							}

							// Check for listener leak
							if (!existing.warned) {
								m = $getMaxListeners(target);
								if (m && m > 0 && existing.length > m) {
									existing.warned = true;
									var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' "' + String(type) + '" listeners ' + 'added. Use emitter.setMaxListeners() to ' + 'increase limit.');
									w.name = 'MaxListenersExceededWarning';
									w.emitter = target;
									w.type = type;
									w.count = existing.length;
									if (typeof console === 'object' && console.warn) {
										console.warn('%s: %s', w.name, w.message);
									}
								}
							}
						}

						return target;
					}

					EventEmitter.prototype.addListener = function addListener(type, listener) {
						return _addListener(this, type, listener, false);
					};

					EventEmitter.prototype.on = EventEmitter.prototype.addListener;

					EventEmitter.prototype.prependListener = function prependListener(type, listener) {
						return _addListener(this, type, listener, true);
					};

					function onceWrapper() {
						if (!this.fired) {
							this.target.removeListener(this.type, this.wrapFn);
							this.fired = true;
							switch (arguments.length) {
								case 0:
									return this.listener.call(this.target);
								case 1:
									return this.listener.call(this.target, arguments[0]);
								case 2:
									return this.listener.call(this.target, arguments[0], arguments[1]);
								case 3:
									return this.listener.call(this.target, arguments[0], arguments[1], arguments[2]);
								default:
									var args = new Array(arguments.length);
									for (var i = 0; i < args.length; ++i) args[i] = arguments[i];
									this.listener.apply(this.target, args);
							}
						}
					}

					function _onceWrap(target, type, listener) {
						var state = {fired: false, wrapFn: undefined, target: target, type: type, listener: listener};
						var wrapped = bind.call(onceWrapper, state);
						wrapped.listener = listener;
						state.wrapFn = wrapped;
						return wrapped;
					}

					EventEmitter.prototype.once = function once(type, listener) {
						if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
						this.on(type, _onceWrap(this, type, listener));
						return this;
					};

					EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
						if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
						this.prependListener(type, _onceWrap(this, type, listener));
						return this;
					};

					// Emits a 'removeListener' event if and only if the listener was removed.
					EventEmitter.prototype.removeListener = function removeListener(type, listener) {
						var list, events, position, i, originalListener;

						if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');

						events = this._events;
						if (!events) return this;

						list = events[type];
						if (!list) return this;

						if (list === listener || list.listener === listener) {
							if (--this._eventsCount === 0) this._events = objectCreate(null);
							else {
								delete events[type];
								if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
							}
						} else if (typeof list !== 'function') {
							position = -1;

							for (i = list.length - 1; i >= 0; i--) {
								if (list[i] === listener || list[i].listener === listener) {
									originalListener = list[i].listener;
									position = i;
									break;
								}
							}

							if (position < 0) return this;

							if (position === 0) list.shift();
							else spliceOne(list, position);

							if (list.length === 1) events[type] = list[0];

							if (events.removeListener) this.emit('removeListener', type, originalListener || listener);
						}

						return this;
					};

					EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
						var listeners, events, i;

						events = this._events;
						if (!events) return this;

						// not listening for removeListener, no need to emit
						if (!events.removeListener) {
							if (arguments.length === 0) {
								this._events = objectCreate(null);
								this._eventsCount = 0;
							} else if (events[type]) {
								if (--this._eventsCount === 0) this._events = objectCreate(null);
								else delete events[type];
							}
							return this;
						}

						// emit removeListener for all listeners on all events
						if (arguments.length === 0) {
							var keys = objectKeys(events);
							var key;
							for (i = 0; i < keys.length; ++i) {
								key = keys[i];
								if (key === 'removeListener') continue;
								this.removeAllListeners(key);
							}
							this.removeAllListeners('removeListener');
							this._events = objectCreate(null);
							this._eventsCount = 0;
							return this;
						}

						listeners = events[type];

						if (typeof listeners === 'function') {
							this.removeListener(type, listeners);
						} else if (listeners) {
							// LIFO order
							for (i = listeners.length - 1; i >= 0; i--) {
								this.removeListener(type, listeners[i]);
							}
						}

						return this;
					};

					EventEmitter.prototype.listeners = function listeners(type) {
						var evlistener;
						var ret;
						var events = this._events;

						if (!events) ret = [];
						else {
							evlistener = events[type];
							if (!evlistener) ret = [];
							else if (typeof evlistener === 'function') ret = [evlistener.listener || evlistener];
							else ret = unwrapListeners(evlistener);
						}

						return ret;
					};

					EventEmitter.listenerCount = function(emitter, type) {
						if (typeof emitter.listenerCount === 'function') {
							return emitter.listenerCount(type);
						} else {
							return listenerCount.call(emitter, type);
						}
					};

					EventEmitter.prototype.listenerCount = listenerCount;
					function listenerCount(type) {
						var events = this._events;

						if (events) {
							var evlistener = events[type];

							if (typeof evlistener === 'function') {
								return 1;
							} else if (evlistener) {
								return evlistener.length;
							}
						}

						return 0;
					}

					EventEmitter.prototype.eventNames = function eventNames() {
						return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
					};

					// About 1.5x faster than the two-arg version of Array#splice().
					function spliceOne(list, index) {
						for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) list[i] = list[k];
						list.pop();
					}

					function arrayClone(arr, n) {
						var copy = new Array(n);
						for (var i = 0; i < n; ++i) copy[i] = arr[i];
						return copy;
					}

					function unwrapListeners(arr) {
						var ret = new Array(arr.length);
						for (var i = 0; i < ret.length; ++i) {
							ret[i] = arr[i].listener || arr[i];
						}
						return ret;
					}

					function objectCreatePolyfill(proto) {
						var F = function() {};
						F.prototype = proto;
						return new F();
					}
					function objectKeysPolyfill(obj) {
						var keys = [];
						for (var k in obj)
							if (Object.prototype.hasOwnProperty.call(obj, k)) {
								keys.push(k);
							}
						return k;
					}
					function functionBindPolyfill(context) {
						var fn = this;
						return function() {
							return fn.apply(context, arguments);
						};
					}
				},
				{},
			],
			6: [
				function(require, module, exports) {
					exports.read = function(buffer, offset, isLE, mLen, nBytes) {
						var e, m;
						var eLen = nBytes * 8 - mLen - 1;
						var eMax = (1 << eLen) - 1;
						var eBias = eMax >> 1;
						var nBits = -7;
						var i = isLE ? nBytes - 1 : 0;
						var d = isLE ? -1 : 1;
						var s = buffer[offset + i];

						i += d;

						e = s & ((1 << -nBits) - 1);
						s >>= -nBits;
						nBits += eLen;
						for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

						m = e & ((1 << -nBits) - 1);
						e >>= -nBits;
						nBits += mLen;
						for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

						if (e === 0) {
							e = 1 - eBias;
						} else if (e === eMax) {
							return m ? NaN : (s ? -1 : 1) * Infinity;
						} else {
							m = m + Math.pow(2, mLen);
							e = e - eBias;
						}
						return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
					};

					exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
						var e, m, c;
						var eLen = nBytes * 8 - mLen - 1;
						var eMax = (1 << eLen) - 1;
						var eBias = eMax >> 1;
						var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
						var i = isLE ? 0 : nBytes - 1;
						var d = isLE ? 1 : -1;
						var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

						value = Math.abs(value);

						if (isNaN(value) || value === Infinity) {
							m = isNaN(value) ? 1 : 0;
							e = eMax;
						} else {
							e = Math.floor(Math.log(value) / Math.LN2);
							if (value * (c = Math.pow(2, -e)) < 1) {
								e--;
								c *= 2;
							}
							if (e + eBias >= 1) {
								value += rt / c;
							} else {
								value += rt * Math.pow(2, 1 - eBias);
							}
							if (value * c >= 2) {
								e++;
								c /= 2;
							}

							if (e + eBias >= eMax) {
								m = 0;
								e = eMax;
							} else if (e + eBias >= 1) {
								m = (value * c - 1) * Math.pow(2, mLen);
								e = e + eBias;
							} else {
								m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
								e = 0;
							}
						}

						for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

						e = (e << mLen) | m;
						eLen += mLen;
						for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

						buffer[offset + i - d] |= s * 128;
					};
				},
				{},
			],
			7: [
				function(require, module, exports) {
					if (typeof Object.create === 'function') {
						// implementation from standard node.js 'util' module
						module.exports = function inherits(ctor, superCtor) {
							ctor.super_ = superCtor;
							ctor.prototype = Object.create(superCtor.prototype, {
								constructor: {
									value: ctor,
									enumerable: false,
									writable: true,
									configurable: true,
								},
							});
						};
					} else {
						// old school shim for old browsers
						module.exports = function inherits(ctor, superCtor) {
							ctor.super_ = superCtor;
							var TempCtor = function() {};
							TempCtor.prototype = superCtor.prototype;
							ctor.prototype = new TempCtor();
							ctor.prototype.constructor = ctor;
						};
					}
				},
				{},
			],
			8: [
				function(require, module, exports) {
					/*!
					 * Determine if an object is a Buffer
					 *
					 * @author   Feross Aboukhadijeh <https://feross.org>
					 * @license  MIT
					 */

					// The _isBuffer check is for Safari 5-7 support, because it's missing
					// Object.prototype.constructor. Remove this eventually
					module.exports = function(obj) {
						return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
					};

					function isBuffer(obj) {
						return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
					}

					// For Node v0.10 support. Remove this eventually.
					function isSlowBuffer(obj) {
						return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0));
					}
				},
				{},
			],
			9: [
				function(require, module, exports) {
					var toString = {}.toString;

					module.exports =
						Array.isArray ||
						function(arr) {
							return toString.call(arr) == '[object Array]';
						};
				},
				{},
			],
			10: [
				function(require, module, exports) {
					(function(process) {
						'use strict';

						if (!process.version || process.version.indexOf('v0.') === 0 || (process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0)) {
							module.exports = {nextTick: nextTick};
						} else {
							module.exports = process;
						}

						function nextTick(fn, arg1, arg2, arg3) {
							if (typeof fn !== 'function') {
								throw new TypeError('"callback" argument must be a function');
							}
							var len = arguments.length;
							var args, i;
							switch (len) {
								case 0:
								case 1:
									return process.nextTick(fn);
								case 2:
									return process.nextTick(function afterTickOne() {
										fn.call(null, arg1);
									});
								case 3:
									return process.nextTick(function afterTickTwo() {
										fn.call(null, arg1, arg2);
									});
								case 4:
									return process.nextTick(function afterTickThree() {
										fn.call(null, arg1, arg2, arg3);
									});
								default:
									args = new Array(len - 1);
									i = 0;
									while (i < args.length) {
										args[i++] = arguments[i];
									}
									return process.nextTick(function afterTick() {
										fn.apply(null, args);
									});
							}
						}
					}.call(this, require('_process')));
				},
				{_process: 11},
			],
			11: [
				function(require, module, exports) {
					// shim for using process in browser
					var process = (module.exports = {});

					// cached from whatever global is present so that test runners that stub it
					// don't break things.  But we need to wrap it in a try catch in case it is
					// wrapped in strict mode code which doesn't define any globals.  It's inside a
					// function because try/catches deoptimize in certain engines.

					var cachedSetTimeout;
					var cachedClearTimeout;

					function defaultSetTimout() {
						throw new Error('setTimeout has not been defined');
					}
					function defaultClearTimeout() {
						throw new Error('clearTimeout has not been defined');
					}
					(function() {
						try {
							if (typeof setTimeout === 'function') {
								cachedSetTimeout = setTimeout;
							} else {
								cachedSetTimeout = defaultSetTimout;
							}
						} catch (e) {
							cachedSetTimeout = defaultSetTimout;
						}
						try {
							if (typeof clearTimeout === 'function') {
								cachedClearTimeout = clearTimeout;
							} else {
								cachedClearTimeout = defaultClearTimeout;
							}
						} catch (e) {
							cachedClearTimeout = defaultClearTimeout;
						}
					})();
					function runTimeout(fun) {
						if (cachedSetTimeout === setTimeout) {
							//normal enviroments in sane situations
							return setTimeout(fun, 0);
						}
						// if setTimeout wasn't available but was latter defined
						if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
							cachedSetTimeout = setTimeout;
							return setTimeout(fun, 0);
						}
						try {
							// when when somebody has screwed with setTimeout but no I.E. maddness
							return cachedSetTimeout(fun, 0);
						} catch (e) {
							try {
								// When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
								return cachedSetTimeout.call(null, fun, 0);
							} catch (e) {
								// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
								return cachedSetTimeout.call(this, fun, 0);
							}
						}
					}
					function runClearTimeout(marker) {
						if (cachedClearTimeout === clearTimeout) {
							//normal enviroments in sane situations
							return clearTimeout(marker);
						}
						// if clearTimeout wasn't available but was latter defined
						if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
							cachedClearTimeout = clearTimeout;
							return clearTimeout(marker);
						}
						try {
							// when when somebody has screwed with setTimeout but no I.E. maddness
							return cachedClearTimeout(marker);
						} catch (e) {
							try {
								// When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
								return cachedClearTimeout.call(null, marker);
							} catch (e) {
								// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
								// Some versions of I.E. have different rules for clearTimeout vs setTimeout
								return cachedClearTimeout.call(this, marker);
							}
						}
					}
					var queue = [];
					var draining = false;
					var currentQueue;
					var queueIndex = -1;

					function cleanUpNextTick() {
						if (!draining || !currentQueue) {
							return;
						}
						draining = false;
						if (currentQueue.length) {
							queue = currentQueue.concat(queue);
						} else {
							queueIndex = -1;
						}
						if (queue.length) {
							drainQueue();
						}
					}

					function drainQueue() {
						if (draining) {
							return;
						}
						var timeout = runTimeout(cleanUpNextTick);
						draining = true;

						var len = queue.length;
						while (len) {
							currentQueue = queue;
							queue = [];
							while (++queueIndex < len) {
								if (currentQueue) {
									currentQueue[queueIndex].run();
								}
							}
							queueIndex = -1;
							len = queue.length;
						}
						currentQueue = null;
						draining = false;
						runClearTimeout(timeout);
					}

					process.nextTick = function(fun) {
						var args = new Array(arguments.length - 1);
						if (arguments.length > 1) {
							for (var i = 1; i < arguments.length; i++) {
								args[i - 1] = arguments[i];
							}
						}
						queue.push(new Item(fun, args));
						if (queue.length === 1 && !draining) {
							runTimeout(drainQueue);
						}
					};

					// v8 likes predictible objects
					function Item(fun, array) {
						this.fun = fun;
						this.array = array;
					}
					Item.prototype.run = function() {
						this.fun.apply(null, this.array);
					};
					process.title = 'browser';
					process.browser = true;
					process.env = {};
					process.argv = [];
					process.version = ''; // empty string to avoid regexp issues
					process.versions = {};

					function noop() {}

					process.on = noop;
					process.addListener = noop;
					process.once = noop;
					process.off = noop;
					process.removeListener = noop;
					process.removeAllListeners = noop;
					process.emit = noop;
					process.prependListener = noop;
					process.prependOnceListener = noop;

					process.listeners = function(name) {
						return [];
					};

					process.binding = function(name) {
						throw new Error('process.binding is not supported');
					};

					process.cwd = function() {
						return '/';
					};
					process.chdir = function(dir) {
						throw new Error('process.chdir is not supported');
					};
					process.umask = function() {
						return 0;
					};
				},
				{},
			],
			12: [
				function(require, module, exports) {
					module.exports = require('./lib/_stream_duplex.js');
				},
				{'./lib/_stream_duplex.js': 13},
			],
			13: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					// a duplex stream is just a stream that is both readable and writable.
					// Since JS doesn't have multiple prototypal inheritance, this class
					// prototypally inherits from Readable, and then parasitically from
					// Writable.

					'use strict';

					/*<replacement>*/

					var pna = require('process-nextick-args');
					/*</replacement>*/

					/*<replacement>*/
					var objectKeys =
						Object.keys ||
						function(obj) {
							var keys = [];
							for (var key in obj) {
								keys.push(key);
							}
							return keys;
						};
					/*</replacement>*/

					module.exports = Duplex;

					/*<replacement>*/
					var util = require('core-util-is');
					util.inherits = require('inherits');
					/*</replacement>*/

					var Readable = require('./_stream_readable');
					var Writable = require('./_stream_writable');

					util.inherits(Duplex, Readable);

					{
						// avoid scope creep, the keys array can then be collected
						var keys = objectKeys(Writable.prototype);
						for (var v = 0; v < keys.length; v++) {
							var method = keys[v];
							if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
						}
					}

					function Duplex(options) {
						if (!(this instanceof Duplex)) return new Duplex(options);

						Readable.call(this, options);
						Writable.call(this, options);

						if (options && options.readable === false) this.readable = false;

						if (options && options.writable === false) this.writable = false;

						this.allowHalfOpen = true;
						if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

						this.once('end', onend);
					}

					Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
						// making it explicit this property is not enumerable
						// because otherwise some prototype manipulation in
						// userland will fail
						enumerable: false,
						get: function() {
							return this._writableState.highWaterMark;
						},
					});

					// the no-half-open enforcer
					function onend() {
						// if we allow half-open state, or if the writable side ended,
						// then we're ok.
						if (this.allowHalfOpen || this._writableState.ended) return;

						// no more data can be written.
						// But allow more writes to happen in this tick.
						pna.nextTick(onEndNT, this);
					}

					function onEndNT(self) {
						self.end();
					}

					Object.defineProperty(Duplex.prototype, 'destroyed', {
						get: function() {
							if (this._readableState === undefined || this._writableState === undefined) {
								return false;
							}
							return this._readableState.destroyed && this._writableState.destroyed;
						},
						set: function(value) {
							// we ignore the value if the stream
							// has not been initialized yet
							if (this._readableState === undefined || this._writableState === undefined) {
								return;
							}

							// backward compatibility, the user is explicitly
							// managing destroyed
							this._readableState.destroyed = value;
							this._writableState.destroyed = value;
						},
					});

					Duplex.prototype._destroy = function(err, cb) {
						this.push(null);
						this.end();

						pna.nextTick(cb, err);
					};
				},
				{'./_stream_readable': 15, './_stream_writable': 17, 'core-util-is': 4, inherits: 7, 'process-nextick-args': 10},
			],
			14: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					// a passthrough stream.
					// basically just the most minimal sort of Transform stream.
					// Every written chunk gets output as-is.

					'use strict';

					module.exports = PassThrough;

					var Transform = require('./_stream_transform');

					/*<replacement>*/
					var util = require('core-util-is');
					util.inherits = require('inherits');
					/*</replacement>*/

					util.inherits(PassThrough, Transform);

					function PassThrough(options) {
						if (!(this instanceof PassThrough)) return new PassThrough(options);

						Transform.call(this, options);
					}

					PassThrough.prototype._transform = function(chunk, encoding, cb) {
						cb(null, chunk);
					};
				},
				{'./_stream_transform': 16, 'core-util-is': 4, inherits: 7},
			],
			15: [
				function(require, module, exports) {
					(function(process, global) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						'use strict';

						/*<replacement>*/

						var pna = require('process-nextick-args');
						/*</replacement>*/

						module.exports = Readable;

						/*<replacement>*/
						var isArray = require('isarray');
						/*</replacement>*/

						/*<replacement>*/
						var Duplex;
						/*</replacement>*/

						Readable.ReadableState = ReadableState;

						/*<replacement>*/
						var EE = require('events').EventEmitter;

						var EElistenerCount = function(emitter, type) {
							return emitter.listeners(type).length;
						};
						/*</replacement>*/

						/*<replacement>*/
						var Stream = require('./internal/streams/stream');
						/*</replacement>*/

						/*<replacement>*/

						var Buffer = require('safe-buffer').Buffer;
						var OurUint8Array = global.Uint8Array || function() {};
						function _uint8ArrayToBuffer(chunk) {
							return Buffer.from(chunk);
						}
						function _isUint8Array(obj) {
							return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
						}

						/*</replacement>*/

						/*<replacement>*/
						var util = require('core-util-is');
						util.inherits = require('inherits');
						/*</replacement>*/

						/*<replacement>*/
						var debugUtil = require('util');
						var debug = void 0;
						if (debugUtil && debugUtil.debuglog) {
							debug = debugUtil.debuglog('stream');
						} else {
							debug = function() {};
						}
						/*</replacement>*/

						var BufferList = require('./internal/streams/BufferList');
						var destroyImpl = require('./internal/streams/destroy');
						var StringDecoder;

						util.inherits(Readable, Stream);

						var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

						function prependListener(emitter, event, fn) {
							// Sadly this is not cacheable as some libraries bundle their own
							// event emitter implementation with them.
							if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

							// This is a hack to make sure that our error handler is attached before any
							// userland ones.  NEVER DO THIS. This is here only because this code needs
							// to continue to work with older versions of Node.js that do not include
							// the prependListener() method. The goal is to eventually remove this hack.
							if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
							else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);
							else emitter._events[event] = [fn, emitter._events[event]];
						}

						function ReadableState(options, stream) {
							Duplex = Duplex || require('./_stream_duplex');

							options = options || {};

							// Duplex streams are both readable and writable, but share
							// the same options object.
							// However, some cases require setting options to different
							// values for the readable and the writable sides of the duplex stream.
							// These options can be provided separately as readableXXX and writableXXX.
							var isDuplex = stream instanceof Duplex;

							// object stream flag. Used to make read(n) ignore n and to
							// make all the buffer merging and length checks go away
							this.objectMode = !!options.objectMode;

							if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

							// the point at which it stops calling _read() to fill the buffer
							// Note: 0 is a valid value, means "don't call _read preemptively ever"
							var hwm = options.highWaterMark;
							var readableHwm = options.readableHighWaterMark;
							var defaultHwm = this.objectMode ? 16 : 16 * 1024;

							if (hwm || hwm === 0) this.highWaterMark = hwm;
							else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
							else this.highWaterMark = defaultHwm;

							// cast to ints.
							this.highWaterMark = Math.floor(this.highWaterMark);

							// A linked list is used to store data chunks instead of an array because the
							// linked list can remove elements from the beginning faster than
							// array.shift()
							this.buffer = new BufferList();
							this.length = 0;
							this.pipes = null;
							this.pipesCount = 0;
							this.flowing = null;
							this.ended = false;
							this.endEmitted = false;
							this.reading = false;

							// a flag to be able to tell if the event 'readable'/'data' is emitted
							// immediately, or on a later tick.  We set this to true at first, because
							// any actions that shouldn't happen until "later" should generally also
							// not happen before the first read call.
							this.sync = true;

							// whenever we return null, then we set a flag to say
							// that we're awaiting a 'readable' event emission.
							this.needReadable = false;
							this.emittedReadable = false;
							this.readableListening = false;
							this.resumeScheduled = false;

							// has it been destroyed
							this.destroyed = false;

							// Crypto is kind of old and crusty.  Historically, its default string
							// encoding is 'binary' so we have to make this configurable.
							// Everything else in the universe uses 'utf8', though.
							this.defaultEncoding = options.defaultEncoding || 'utf8';

							// the number of writers that are awaiting a drain event in .pipe()s
							this.awaitDrain = 0;

							// if true, a maybeReadMore has been scheduled
							this.readingMore = false;

							this.decoder = null;
							this.encoding = null;
							if (options.encoding) {
								if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
								this.decoder = new StringDecoder(options.encoding);
								this.encoding = options.encoding;
							}
						}

						function Readable(options) {
							Duplex = Duplex || require('./_stream_duplex');

							if (!(this instanceof Readable)) return new Readable(options);

							this._readableState = new ReadableState(options, this);

							// legacy
							this.readable = true;

							if (options) {
								if (typeof options.read === 'function') this._read = options.read;

								if (typeof options.destroy === 'function') this._destroy = options.destroy;
							}

							Stream.call(this);
						}

						Object.defineProperty(Readable.prototype, 'destroyed', {
							get: function() {
								if (this._readableState === undefined) {
									return false;
								}
								return this._readableState.destroyed;
							},
							set: function(value) {
								// we ignore the value if the stream
								// has not been initialized yet
								if (!this._readableState) {
									return;
								}

								// backward compatibility, the user is explicitly
								// managing destroyed
								this._readableState.destroyed = value;
							},
						});

						Readable.prototype.destroy = destroyImpl.destroy;
						Readable.prototype._undestroy = destroyImpl.undestroy;
						Readable.prototype._destroy = function(err, cb) {
							this.push(null);
							cb(err);
						};

						// Manually shove something into the read() buffer.
						// This returns true if the highWaterMark has not been hit yet,
						// similar to how Writable.write() returns true if you should
						// write() some more.
						Readable.prototype.push = function(chunk, encoding) {
							var state = this._readableState;
							var skipChunkCheck;

							if (!state.objectMode) {
								if (typeof chunk === 'string') {
									encoding = encoding || state.defaultEncoding;
									if (encoding !== state.encoding) {
										chunk = Buffer.from(chunk, encoding);
										encoding = '';
									}
									skipChunkCheck = true;
								}
							} else {
								skipChunkCheck = true;
							}

							return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
						};

						// Unshift should *always* be something directly out of read()
						Readable.prototype.unshift = function(chunk) {
							return readableAddChunk(this, chunk, null, true, false);
						};

						function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
							var state = stream._readableState;
							if (chunk === null) {
								state.reading = false;
								onEofChunk(stream, state);
							} else {
								var er;
								if (!skipChunkCheck) er = chunkInvalid(state, chunk);
								if (er) {
									stream.emit('error', er);
								} else if (state.objectMode || (chunk && chunk.length > 0)) {
									if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
										chunk = _uint8ArrayToBuffer(chunk);
									}

									if (addToFront) {
										if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));
										else addChunk(stream, state, chunk, true);
									} else if (state.ended) {
										stream.emit('error', new Error('stream.push() after EOF'));
									} else {
										state.reading = false;
										if (state.decoder && !encoding) {
											chunk = state.decoder.write(chunk);
											if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
											else maybeReadMore(stream, state);
										} else {
											addChunk(stream, state, chunk, false);
										}
									}
								} else if (!addToFront) {
									state.reading = false;
								}
							}

							return needMoreData(state);
						}

						function addChunk(stream, state, chunk, addToFront) {
							if (state.flowing && state.length === 0 && !state.sync) {
								stream.emit('data', chunk);
								stream.read(0);
							} else {
								// update the buffer info.
								state.length += state.objectMode ? 1 : chunk.length;
								if (addToFront) state.buffer.unshift(chunk);
								else state.buffer.push(chunk);

								if (state.needReadable) emitReadable(stream);
							}
							maybeReadMore(stream, state);
						}

						function chunkInvalid(state, chunk) {
							var er;
							if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
								er = new TypeError('Invalid non-string/buffer chunk');
							}
							return er;
						}

						// if it's past the high water mark, we can push in some more.
						// Also, if we have no data yet, we can stand some
						// more bytes.  This is to work around cases where hwm=0,
						// such as the repl.  Also, if the push() triggered a
						// readable event, and the user called read(largeNumber) such that
						// needReadable was set, then we ought to push more, so that another
						// 'readable' event will be triggered.
						function needMoreData(state) {
							return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
						}

						Readable.prototype.isPaused = function() {
							return this._readableState.flowing === false;
						};

						// backwards compatibility.
						Readable.prototype.setEncoding = function(enc) {
							if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
							this._readableState.decoder = new StringDecoder(enc);
							this._readableState.encoding = enc;
							return this;
						};

						// Don't raise the hwm > 8MB
						var MAX_HWM = 0x800000;
						function computeNewHighWaterMark(n) {
							if (n >= MAX_HWM) {
								n = MAX_HWM;
							} else {
								// Get the next highest power of 2 to prevent increasing hwm excessively in
								// tiny amounts
								n--;
								n |= n >>> 1;
								n |= n >>> 2;
								n |= n >>> 4;
								n |= n >>> 8;
								n |= n >>> 16;
								n++;
							}
							return n;
						}

						// This function is designed to be inlinable, so please take care when making
						// changes to the function body.
						function howMuchToRead(n, state) {
							if (n <= 0 || (state.length === 0 && state.ended)) return 0;
							if (state.objectMode) return 1;
							if (n !== n) {
								// Only flow one buffer at a time
								if (state.flowing && state.length) return state.buffer.head.data.length;
								else return state.length;
							}
							// If we're asking for more than the current hwm, then raise the hwm.
							if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
							if (n <= state.length) return n;
							// Don't have enough
							if (!state.ended) {
								state.needReadable = true;
								return 0;
							}
							return state.length;
						}

						// you can override either this method, or the async _read(n) below.
						Readable.prototype.read = function(n) {
							debug('read', n);
							n = parseInt(n, 10);
							var state = this._readableState;
							var nOrig = n;

							if (n !== 0) state.emittedReadable = false;

							// if we're doing read(0) to trigger a readable event, but we
							// already have a bunch of data in the buffer, then just trigger
							// the 'readable' event and move on.
							if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
								debug('read: emitReadable', state.length, state.ended);
								if (state.length === 0 && state.ended) endReadable(this);
								else emitReadable(this);
								return null;
							}

							n = howMuchToRead(n, state);

							// if we've ended, and we're now clear, then finish it up.
							if (n === 0 && state.ended) {
								if (state.length === 0) endReadable(this);
								return null;
							}

							// All the actual chunk generation logic needs to be
							// *below* the call to _read.  The reason is that in certain
							// synthetic stream cases, such as passthrough streams, _read
							// may be a completely synchronous operation which may change
							// the state of the read buffer, providing enough data when
							// before there was *not* enough.
							//
							// So, the steps are:
							// 1. Figure out what the state of things will be after we do
							// a read from the buffer.
							//
							// 2. If that resulting state will trigger a _read, then call _read.
							// Note that this may be asynchronous, or synchronous.  Yes, it is
							// deeply ugly to write APIs this way, but that still doesn't mean
							// that the Readable class should behave improperly, as streams are
							// designed to be sync/async agnostic.
							// Take note if the _read call is sync or async (ie, if the read call
							// has returned yet), so that we know whether or not it's safe to emit
							// 'readable' etc.
							//
							// 3. Actually pull the requested chunks out of the buffer and return.

							// if we need a readable event, then we need to do some reading.
							var doRead = state.needReadable;
							debug('need readable', doRead);

							// if we currently have less than the highWaterMark, then also read some
							if (state.length === 0 || state.length - n < state.highWaterMark) {
								doRead = true;
								debug('length less than watermark', doRead);
							}

							// however, if we've ended, then there's no point, and if we're already
							// reading, then it's unnecessary.
							if (state.ended || state.reading) {
								doRead = false;
								debug('reading or ended', doRead);
							} else if (doRead) {
								debug('do read');
								state.reading = true;
								state.sync = true;
								// if the length is currently zero, then we *need* a readable event.
								if (state.length === 0) state.needReadable = true;
								// call internal read method
								this._read(state.highWaterMark);
								state.sync = false;
								// If _read pushed data synchronously, then `reading` will be false,
								// and we need to re-evaluate how much data we can return to the user.
								if (!state.reading) n = howMuchToRead(nOrig, state);
							}

							var ret;
							if (n > 0) ret = fromList(n, state);
							else ret = null;

							if (ret === null) {
								state.needReadable = true;
								n = 0;
							} else {
								state.length -= n;
							}

							if (state.length === 0) {
								// If we have nothing in the buffer, then we want to know
								// as soon as we *do* get something into the buffer.
								if (!state.ended) state.needReadable = true;

								// If we tried to read() past the EOF, then emit end on the next tick.
								if (nOrig !== n && state.ended) endReadable(this);
							}

							if (ret !== null) this.emit('data', ret);

							return ret;
						};

						function onEofChunk(stream, state) {
							if (state.ended) return;
							if (state.decoder) {
								var chunk = state.decoder.end();
								if (chunk && chunk.length) {
									state.buffer.push(chunk);
									state.length += state.objectMode ? 1 : chunk.length;
								}
							}
							state.ended = true;

							// emit 'readable' now to make sure it gets picked up.
							emitReadable(stream);
						}

						// Don't emit readable right away in sync mode, because this can trigger
						// another read() call => stack overflow.  This way, it might trigger
						// a nextTick recursion warning, but that's not so bad.
						function emitReadable(stream) {
							var state = stream._readableState;
							state.needReadable = false;
							if (!state.emittedReadable) {
								debug('emitReadable', state.flowing);
								state.emittedReadable = true;
								if (state.sync) pna.nextTick(emitReadable_, stream);
								else emitReadable_(stream);
							}
						}

						function emitReadable_(stream) {
							debug('emit readable');
							stream.emit('readable');
							flow(stream);
						}

						// at this point, the user has presumably seen the 'readable' event,
						// and called read() to consume some data.  that may have triggered
						// in turn another _read(n) call, in which case reading = true if
						// it's in progress.
						// However, if we're not ended, or reading, and the length < hwm,
						// then go ahead and try to read some more preemptively.
						function maybeReadMore(stream, state) {
							if (!state.readingMore) {
								state.readingMore = true;
								pna.nextTick(maybeReadMore_, stream, state);
							}
						}

						function maybeReadMore_(stream, state) {
							var len = state.length;
							while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
								debug('maybeReadMore read 0');
								stream.read(0);
								if (len === state.length)
									// didn't get any data, stop spinning.
									break;
								else len = state.length;
							}
							state.readingMore = false;
						}

						// abstract method.  to be overridden in specific implementation classes.
						// call cb(er, data) where data is <= n in length.
						// for virtual (non-string, non-buffer) streams, "length" is somewhat
						// arbitrary, and perhaps not very meaningful.
						Readable.prototype._read = function(n) {
							this.emit('error', new Error('_read() is not implemented'));
						};

						Readable.prototype.pipe = function(dest, pipeOpts) {
							var src = this;
							var state = this._readableState;

							switch (state.pipesCount) {
								case 0:
									state.pipes = dest;
									break;
								case 1:
									state.pipes = [state.pipes, dest];
									break;
								default:
									state.pipes.push(dest);
									break;
							}
							state.pipesCount += 1;
							debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

							var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

							var endFn = doEnd ? onend : unpipe;
							if (state.endEmitted) pna.nextTick(endFn);
							else src.once('end', endFn);

							dest.on('unpipe', onunpipe);
							function onunpipe(readable, unpipeInfo) {
								debug('onunpipe');
								if (readable === src) {
									if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
										unpipeInfo.hasUnpiped = true;
										cleanup();
									}
								}
							}

							function onend() {
								debug('onend');
								dest.end();
							}

							// when the dest drains, it reduces the awaitDrain counter
							// on the source.  This would be more elegant with a .once()
							// handler in flow(), but adding and removing repeatedly is
							// too slow.
							var ondrain = pipeOnDrain(src);
							dest.on('drain', ondrain);

							var cleanedUp = false;
							function cleanup() {
								debug('cleanup');
								// cleanup event handlers once the pipe is broken
								dest.removeListener('close', onclose);
								dest.removeListener('finish', onfinish);
								dest.removeListener('drain', ondrain);
								dest.removeListener('error', onerror);
								dest.removeListener('unpipe', onunpipe);
								src.removeListener('end', onend);
								src.removeListener('end', unpipe);
								src.removeListener('data', ondata);

								cleanedUp = true;

								// if the reader is waiting for a drain event from this
								// specific writer, then it would cause it to never start
								// flowing again.
								// So, if this is awaiting a drain, then we just call it now.
								// If we don't know, then assume that we are waiting for one.
								if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
							}

							// If the user pushes more data while we're writing to dest then we'll end up
							// in ondata again. However, we only want to increase awaitDrain once because
							// dest will only emit one 'drain' event for the multiple writes.
							// => Introduce a guard on increasing awaitDrain.
							var increasedAwaitDrain = false;
							src.on('data', ondata);
							function ondata(chunk) {
								debug('ondata');
								increasedAwaitDrain = false;
								var ret = dest.write(chunk);
								if (false === ret && !increasedAwaitDrain) {
									// If the user unpiped during `dest.write()`, it is possible
									// to get stuck in a permanently paused state if that write
									// also returned false.
									// => Check whether `dest` is still a piping destination.
									if (((state.pipesCount === 1 && state.pipes === dest) || (state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1)) && !cleanedUp) {
										debug('false write response, pause', src._readableState.awaitDrain);
										src._readableState.awaitDrain++;
										increasedAwaitDrain = true;
									}
									src.pause();
								}
							}

							// if the dest has an error, then stop piping into it.
							// however, don't suppress the throwing behavior for this.
							function onerror(er) {
								debug('onerror', er);
								unpipe();
								dest.removeListener('error', onerror);
								if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
							}

							// Make sure our error handler is attached before userland ones.
							prependListener(dest, 'error', onerror);

							// Both close and finish should trigger unpipe, but only once.
							function onclose() {
								dest.removeListener('finish', onfinish);
								unpipe();
							}
							dest.once('close', onclose);
							function onfinish() {
								debug('onfinish');
								dest.removeListener('close', onclose);
								unpipe();
							}
							dest.once('finish', onfinish);

							function unpipe() {
								debug('unpipe');
								src.unpipe(dest);
							}

							// tell the dest that it's being piped to
							dest.emit('pipe', src);

							// start the flow if it hasn't been started already.
							if (!state.flowing) {
								debug('pipe resume');
								src.resume();
							}

							return dest;
						};

						function pipeOnDrain(src) {
							return function() {
								var state = src._readableState;
								debug('pipeOnDrain', state.awaitDrain);
								if (state.awaitDrain) state.awaitDrain--;
								if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
									state.flowing = true;
									flow(src);
								}
							};
						}

						Readable.prototype.unpipe = function(dest) {
							var state = this._readableState;
							var unpipeInfo = {hasUnpiped: false};

							// if we're not piping anywhere, then do nothing.
							if (state.pipesCount === 0) return this;

							// just one destination.  most common case.
							if (state.pipesCount === 1) {
								// passed in one, but it's not the right one.
								if (dest && dest !== state.pipes) return this;

								if (!dest) dest = state.pipes;

								// got a match.
								state.pipes = null;
								state.pipesCount = 0;
								state.flowing = false;
								if (dest) dest.emit('unpipe', this, unpipeInfo);
								return this;
							}

							// slow case. multiple pipe destinations.

							if (!dest) {
								// remove all.
								var dests = state.pipes;
								var len = state.pipesCount;
								state.pipes = null;
								state.pipesCount = 0;
								state.flowing = false;

								for (var i = 0; i < len; i++) {
									dests[i].emit('unpipe', this, unpipeInfo);
								}
								return this;
							}

							// try to find the right one.
							var index = indexOf(state.pipes, dest);
							if (index === -1) return this;

							state.pipes.splice(index, 1);
							state.pipesCount -= 1;
							if (state.pipesCount === 1) state.pipes = state.pipes[0];

							dest.emit('unpipe', this, unpipeInfo);

							return this;
						};

						// set up data events if they are asked for
						// Ensure readable listeners eventually get something
						Readable.prototype.on = function(ev, fn) {
							var res = Stream.prototype.on.call(this, ev, fn);

							if (ev === 'data') {
								// Start flowing on next tick if stream isn't explicitly paused
								if (this._readableState.flowing !== false) this.resume();
							} else if (ev === 'readable') {
								var state = this._readableState;
								if (!state.endEmitted && !state.readableListening) {
									state.readableListening = state.needReadable = true;
									state.emittedReadable = false;
									if (!state.reading) {
										pna.nextTick(nReadingNextTick, this);
									} else if (state.length) {
										emitReadable(this);
									}
								}
							}

							return res;
						};
						Readable.prototype.addListener = Readable.prototype.on;

						function nReadingNextTick(self) {
							debug('readable nexttick read 0');
							self.read(0);
						}

						// pause() and resume() are remnants of the legacy readable stream API
						// If the user uses them, then switch into old mode.
						Readable.prototype.resume = function() {
							var state = this._readableState;
							if (!state.flowing) {
								debug('resume');
								state.flowing = true;
								resume(this, state);
							}
							return this;
						};

						function resume(stream, state) {
							if (!state.resumeScheduled) {
								state.resumeScheduled = true;
								pna.nextTick(resume_, stream, state);
							}
						}

						function resume_(stream, state) {
							if (!state.reading) {
								debug('resume read 0');
								stream.read(0);
							}

							state.resumeScheduled = false;
							state.awaitDrain = 0;
							stream.emit('resume');
							flow(stream);
							if (state.flowing && !state.reading) stream.read(0);
						}

						Readable.prototype.pause = function() {
							debug('call pause flowing=%j', this._readableState.flowing);
							if (false !== this._readableState.flowing) {
								debug('pause');
								this._readableState.flowing = false;
								this.emit('pause');
							}
							return this;
						};

						function flow(stream) {
							var state = stream._readableState;
							debug('flow', state.flowing);
							while (state.flowing && stream.read() !== null) {}
						}

						// wrap an old-style stream as the async data source.
						// This is *not* part of the readable stream interface.
						// It is an ugly unfortunate mess of history.
						Readable.prototype.wrap = function(stream) {
							var _this = this;

							var state = this._readableState;
							var paused = false;

							stream.on('end', function() {
								debug('wrapped end');
								if (state.decoder && !state.ended) {
									var chunk = state.decoder.end();
									if (chunk && chunk.length) _this.push(chunk);
								}

								_this.push(null);
							});

							stream.on('data', function(chunk) {
								debug('wrapped data');
								if (state.decoder) chunk = state.decoder.write(chunk);

								// don't skip over falsy values in objectMode
								if (state.objectMode && (chunk === null || chunk === undefined)) return;
								else if (!state.objectMode && (!chunk || !chunk.length)) return;

								var ret = _this.push(chunk);
								if (!ret) {
									paused = true;
									stream.pause();
								}
							});

							// proxy all the other methods.
							// important when wrapping filters and duplexes.
							for (var i in stream) {
								if (this[i] === undefined && typeof stream[i] === 'function') {
									this[i] = (function(method) {
										return function() {
											return stream[method].apply(stream, arguments);
										};
									})(i);
								}
							}

							// proxy certain important events.
							for (var n = 0; n < kProxyEvents.length; n++) {
								stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
							}

							// when we try to consume some more bytes, simply unpause the
							// underlying stream.
							this._read = function(n) {
								debug('wrapped _read', n);
								if (paused) {
									paused = false;
									stream.resume();
								}
							};

							return this;
						};

						Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
							// making it explicit this property is not enumerable
							// because otherwise some prototype manipulation in
							// userland will fail
							enumerable: false,
							get: function() {
								return this._readableState.highWaterMark;
							},
						});

						// exposed for testing purposes only.
						Readable._fromList = fromList;

						// Pluck off n bytes from an array of buffers.
						// Length is the combined lengths of all the buffers in the list.
						// This function is designed to be inlinable, so please take care when making
						// changes to the function body.
						function fromList(n, state) {
							// nothing buffered
							if (state.length === 0) return null;

							var ret;
							if (state.objectMode) ret = state.buffer.shift();
							else if (!n || n >= state.length) {
								// read it all, truncate the list
								if (state.decoder) ret = state.buffer.join('');
								else if (state.buffer.length === 1) ret = state.buffer.head.data;
								else ret = state.buffer.concat(state.length);
								state.buffer.clear();
							} else {
								// read part of list
								ret = fromListPartial(n, state.buffer, state.decoder);
							}

							return ret;
						}

						// Extracts only enough buffered data to satisfy the amount requested.
						// This function is designed to be inlinable, so please take care when making
						// changes to the function body.
						function fromListPartial(n, list, hasStrings) {
							var ret;
							if (n < list.head.data.length) {
								// slice is the same for buffers and strings
								ret = list.head.data.slice(0, n);
								list.head.data = list.head.data.slice(n);
							} else if (n === list.head.data.length) {
								// first chunk is a perfect match
								ret = list.shift();
							} else {
								// result spans more than one buffer
								ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
							}
							return ret;
						}

						// Copies a specified amount of characters from the list of buffered data
						// chunks.
						// This function is designed to be inlinable, so please take care when making
						// changes to the function body.
						function copyFromBufferString(n, list) {
							var p = list.head;
							var c = 1;
							var ret = p.data;
							n -= ret.length;
							while ((p = p.next)) {
								var str = p.data;
								var nb = n > str.length ? str.length : n;
								if (nb === str.length) ret += str;
								else ret += str.slice(0, n);
								n -= nb;
								if (n === 0) {
									if (nb === str.length) {
										++c;
										if (p.next) list.head = p.next;
										else list.head = list.tail = null;
									} else {
										list.head = p;
										p.data = str.slice(nb);
									}
									break;
								}
								++c;
							}
							list.length -= c;
							return ret;
						}

						// Copies a specified amount of bytes from the list of buffered data chunks.
						// This function is designed to be inlinable, so please take care when making
						// changes to the function body.
						function copyFromBuffer(n, list) {
							var ret = Buffer.allocUnsafe(n);
							var p = list.head;
							var c = 1;
							p.data.copy(ret);
							n -= p.data.length;
							while ((p = p.next)) {
								var buf = p.data;
								var nb = n > buf.length ? buf.length : n;
								buf.copy(ret, ret.length - n, 0, nb);
								n -= nb;
								if (n === 0) {
									if (nb === buf.length) {
										++c;
										if (p.next) list.head = p.next;
										else list.head = list.tail = null;
									} else {
										list.head = p;
										p.data = buf.slice(nb);
									}
									break;
								}
								++c;
							}
							list.length -= c;
							return ret;
						}

						function endReadable(stream) {
							var state = stream._readableState;

							// If we get here before consuming all the bytes, then that is a
							// bug in node.  Should never happen.
							if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

							if (!state.endEmitted) {
								state.ended = true;
								pna.nextTick(endReadableNT, state, stream);
							}
						}

						function endReadableNT(state, stream) {
							// Check that we didn't get one last unshift.
							if (!state.endEmitted && state.length === 0) {
								state.endEmitted = true;
								stream.readable = false;
								stream.emit('end');
							}
						}

						function indexOf(xs, x) {
							for (var i = 0, l = xs.length; i < l; i++) {
								if (xs[i] === x) return i;
							}
							return -1;
						}
					}.call(this, require('_process'), typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}));
				},
				{'./_stream_duplex': 13, './internal/streams/BufferList': 18, './internal/streams/destroy': 19, './internal/streams/stream': 20, _process: 11, 'core-util-is': 4, events: 5, inherits: 7, isarray: 9, 'process-nextick-args': 10, 'safe-buffer': 25, 'string_decoder/': 27, util: 2},
			],
			16: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					// a transform stream is a readable/writable stream where you do
					// something with the data.  Sometimes it's called a "filter",
					// but that's not a great name for it, since that implies a thing where
					// some bits pass through, and others are simply ignored.  (That would
					// be a valid example of a transform, of course.)
					//
					// While the output is causally related to the input, it's not a
					// necessarily symmetric or synchronous transformation.  For example,
					// a zlib stream might take multiple plain-text writes(), and then
					// emit a single compressed chunk some time in the future.
					//
					// Here's how this works:
					//
					// The Transform stream has all the aspects of the readable and writable
					// stream classes.  When you write(chunk), that calls _write(chunk,cb)
					// internally, and returns false if there's a lot of pending writes
					// buffered up.  When you call read(), that calls _read(n) until
					// there's enough pending readable data buffered up.
					//
					// In a transform stream, the written data is placed in a buffer.  When
					// _read(n) is called, it transforms the queued up data, calling the
					// buffered _write cb's as it consumes chunks.  If consuming a single
					// written chunk would result in multiple output chunks, then the first
					// outputted bit calls the readcb, and subsequent chunks just go into
					// the read buffer, and will cause it to emit 'readable' if necessary.
					//
					// This way, back-pressure is actually determined by the reading side,
					// since _read has to be called to start processing a new chunk.  However,
					// a pathological inflate type of transform can cause excessive buffering
					// here.  For example, imagine a stream where every byte of input is
					// interpreted as an integer from 0-255, and then results in that many
					// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
					// 1kb of data being output.  In this case, you could write a very small
					// amount of input, and end up with a very large amount of output.  In
					// such a pathological inflating mechanism, there'd be no way to tell
					// the system to stop doing the transform.  A single 4MB write could
					// cause the system to run out of memory.
					//
					// However, even in such a pathological case, only a single written chunk
					// would be consumed, and then the rest would wait (un-transformed) until
					// the results of the previous transformed chunk were consumed.

					'use strict';

					module.exports = Transform;

					var Duplex = require('./_stream_duplex');

					/*<replacement>*/
					var util = require('core-util-is');
					util.inherits = require('inherits');
					/*</replacement>*/

					util.inherits(Transform, Duplex);

					function afterTransform(er, data) {
						var ts = this._transformState;
						ts.transforming = false;

						var cb = ts.writecb;

						if (!cb) {
							return this.emit('error', new Error('write callback called multiple times'));
						}

						ts.writechunk = null;
						ts.writecb = null;

						if (data != null)
							// single equals check for both `null` and `undefined`
							this.push(data);

						cb(er);

						var rs = this._readableState;
						rs.reading = false;
						if (rs.needReadable || rs.length < rs.highWaterMark) {
							this._read(rs.highWaterMark);
						}
					}

					function Transform(options) {
						if (!(this instanceof Transform)) return new Transform(options);

						Duplex.call(this, options);

						this._transformState = {
							afterTransform: afterTransform.bind(this),
							needTransform: false,
							transforming: false,
							writecb: null,
							writechunk: null,
							writeencoding: null,
						};

						// start out asking for a readable event once data is transformed.
						this._readableState.needReadable = true;

						// we have implemented the _read method, and done the other things
						// that Readable wants before the first _read call, so unset the
						// sync guard flag.
						this._readableState.sync = false;

						if (options) {
							if (typeof options.transform === 'function') this._transform = options.transform;

							if (typeof options.flush === 'function') this._flush = options.flush;
						}

						// When the writable side finishes, then flush out anything remaining.
						this.on('prefinish', prefinish);
					}

					function prefinish() {
						var _this = this;

						if (typeof this._flush === 'function') {
							this._flush(function(er, data) {
								done(_this, er, data);
							});
						} else {
							done(this, null, null);
						}
					}

					Transform.prototype.push = function(chunk, encoding) {
						this._transformState.needTransform = false;
						return Duplex.prototype.push.call(this, chunk, encoding);
					};

					// This is the part where you do stuff!
					// override this function in implementation classes.
					// 'chunk' is an input chunk.
					//
					// Call `push(newChunk)` to pass along transformed output
					// to the readable side.  You may call 'push' zero or more times.
					//
					// Call `cb(err)` when you are done with this chunk.  If you pass
					// an error, then that'll put the hurt on the whole operation.  If you
					// never call cb(), then you'll never get another chunk.
					Transform.prototype._transform = function(chunk, encoding, cb) {
						throw new Error('_transform() is not implemented');
					};

					Transform.prototype._write = function(chunk, encoding, cb) {
						var ts = this._transformState;
						ts.writecb = cb;
						ts.writechunk = chunk;
						ts.writeencoding = encoding;
						if (!ts.transforming) {
							var rs = this._readableState;
							if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
						}
					};

					// Doesn't matter what the args are here.
					// _transform does all the work.
					// That we got here means that the readable side wants more data.
					Transform.prototype._read = function(n) {
						var ts = this._transformState;

						if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
							ts.transforming = true;
							this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
						} else {
							// mark that we need a transform, so that any data that comes in
							// will get processed, now that we've asked for it.
							ts.needTransform = true;
						}
					};

					Transform.prototype._destroy = function(err, cb) {
						var _this2 = this;

						Duplex.prototype._destroy.call(this, err, function(err2) {
							cb(err2);
							_this2.emit('close');
						});
					};

					function done(stream, er, data) {
						if (er) return stream.emit('error', er);

						if (data != null)
							// single equals check for both `null` and `undefined`
							stream.push(data);

						// if there's nothing in the write buffer, then that means
						// that nothing more will ever be provided
						if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

						if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

						return stream.push(null);
					}
				},
				{'./_stream_duplex': 13, 'core-util-is': 4, inherits: 7},
			],
			17: [
				function(require, module, exports) {
					(function(process, global) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						// A bit simpler than readable streams.
						// Implement an async ._write(chunk, encoding, cb), and it'll handle all
						// the drain event emission and buffering.

						'use strict';

						/*<replacement>*/

						var pna = require('process-nextick-args');
						/*</replacement>*/

						module.exports = Writable;

						/* <replacement> */
						function WriteReq(chunk, encoding, cb) {
							this.chunk = chunk;
							this.encoding = encoding;
							this.callback = cb;
							this.next = null;
						}

						// It seems a linked list but it is not
						// there will be only 2 of these for each stream
						function CorkedRequest(state) {
							var _this = this;

							this.next = null;
							this.entry = null;
							this.finish = function() {
								onCorkedFinish(_this, state);
							};
						}
						/* </replacement> */

						/*<replacement>*/
						var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
						/*</replacement>*/

						/*<replacement>*/
						var Duplex;
						/*</replacement>*/

						Writable.WritableState = WritableState;

						/*<replacement>*/
						var util = require('core-util-is');
						util.inherits = require('inherits');
						/*</replacement>*/

						/*<replacement>*/
						var internalUtil = {
							deprecate: require('util-deprecate'),
						};
						/*</replacement>*/

						/*<replacement>*/
						var Stream = require('./internal/streams/stream');
						/*</replacement>*/

						/*<replacement>*/

						var Buffer = require('safe-buffer').Buffer;
						var OurUint8Array = global.Uint8Array || function() {};
						function _uint8ArrayToBuffer(chunk) {
							return Buffer.from(chunk);
						}
						function _isUint8Array(obj) {
							return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
						}

						/*</replacement>*/

						var destroyImpl = require('./internal/streams/destroy');

						util.inherits(Writable, Stream);

						function nop() {}

						function WritableState(options, stream) {
							Duplex = Duplex || require('./_stream_duplex');

							options = options || {};

							// Duplex streams are both readable and writable, but share
							// the same options object.
							// However, some cases require setting options to different
							// values for the readable and the writable sides of the duplex stream.
							// These options can be provided separately as readableXXX and writableXXX.
							var isDuplex = stream instanceof Duplex;

							// object stream flag to indicate whether or not this stream
							// contains buffers or objects.
							this.objectMode = !!options.objectMode;

							if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

							// the point at which write() starts returning false
							// Note: 0 is a valid value, means that we always return false if
							// the entire buffer is not flushed immediately on write()
							var hwm = options.highWaterMark;
							var writableHwm = options.writableHighWaterMark;
							var defaultHwm = this.objectMode ? 16 : 16 * 1024;

							if (hwm || hwm === 0) this.highWaterMark = hwm;
							else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
							else this.highWaterMark = defaultHwm;

							// cast to ints.
							this.highWaterMark = Math.floor(this.highWaterMark);

							// if _final has been called
							this.finalCalled = false;

							// drain event flag.
							this.needDrain = false;
							// at the start of calling end()
							this.ending = false;
							// when end() has been called, and returned
							this.ended = false;
							// when 'finish' is emitted
							this.finished = false;

							// has it been destroyed
							this.destroyed = false;

							// should we decode strings into buffers before passing to _write?
							// this is here so that some node-core streams can optimize string
							// handling at a lower level.
							var noDecode = options.decodeStrings === false;
							this.decodeStrings = !noDecode;

							// Crypto is kind of old and crusty.  Historically, its default string
							// encoding is 'binary' so we have to make this configurable.
							// Everything else in the universe uses 'utf8', though.
							this.defaultEncoding = options.defaultEncoding || 'utf8';

							// not an actual buffer we keep track of, but a measurement
							// of how much we're waiting to get pushed to some underlying
							// socket or file.
							this.length = 0;

							// a flag to see when we're in the middle of a write.
							this.writing = false;

							// when true all writes will be buffered until .uncork() call
							this.corked = 0;

							// a flag to be able to tell if the onwrite cb is called immediately,
							// or on a later tick.  We set this to true at first, because any
							// actions that shouldn't happen until "later" should generally also
							// not happen before the first write call.
							this.sync = true;

							// a flag to know if we're processing previously buffered items, which
							// may call the _write() callback in the same tick, so that we don't
							// end up in an overlapped onwrite situation.
							this.bufferProcessing = false;

							// the callback that's passed to _write(chunk,cb)
							this.onwrite = function(er) {
								onwrite(stream, er);
							};

							// the callback that the user supplies to write(chunk,encoding,cb)
							this.writecb = null;

							// the amount that is being written when _write is called.
							this.writelen = 0;

							this.bufferedRequest = null;
							this.lastBufferedRequest = null;

							// number of pending user-supplied write callbacks
							// this must be 0 before 'finish' can be emitted
							this.pendingcb = 0;

							// emit prefinish if the only thing we're waiting for is _write cbs
							// This is relevant for synchronous Transform streams
							this.prefinished = false;

							// True if the error was already emitted and should not be thrown again
							this.errorEmitted = false;

							// count buffered requests
							this.bufferedRequestCount = 0;

							// allocate the first CorkedRequest, there is always
							// one allocated and free to use, and we maintain at most two
							this.corkedRequestsFree = new CorkedRequest(this);
						}

						WritableState.prototype.getBuffer = function getBuffer() {
							var current = this.bufferedRequest;
							var out = [];
							while (current) {
								out.push(current);
								current = current.next;
							}
							return out;
						};

						(function() {
							try {
								Object.defineProperty(WritableState.prototype, 'buffer', {
									get: internalUtil.deprecate(
										function() {
											return this.getBuffer();
										},
										'_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.',
										'DEP0003'
									),
								});
							} catch (_) {}
						})();

						// Test _writableState for inheritance to account for Duplex streams,
						// whose prototype chain only points to Readable.
						var realHasInstance;
						if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
							realHasInstance = Function.prototype[Symbol.hasInstance];
							Object.defineProperty(Writable, Symbol.hasInstance, {
								value: function(object) {
									if (realHasInstance.call(this, object)) return true;
									if (this !== Writable) return false;

									return object && object._writableState instanceof WritableState;
								},
							});
						} else {
							realHasInstance = function(object) {
								return object instanceof this;
							};
						}

						function Writable(options) {
							Duplex = Duplex || require('./_stream_duplex');

							// Writable ctor is applied to Duplexes, too.
							// `realHasInstance` is necessary because using plain `instanceof`
							// would return false, as no `_writableState` property is attached.

							// Trying to use the custom `instanceof` for Writable here will also break the
							// Node.js LazyTransform implementation, which has a non-trivial getter for
							// `_writableState` that would lead to infinite recursion.
							if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
								return new Writable(options);
							}

							this._writableState = new WritableState(options, this);

							// legacy.
							this.writable = true;

							if (options) {
								if (typeof options.write === 'function') this._write = options.write;

								if (typeof options.writev === 'function') this._writev = options.writev;

								if (typeof options.destroy === 'function') this._destroy = options.destroy;

								if (typeof options.final === 'function') this._final = options.final;
							}

							Stream.call(this);
						}

						// Otherwise people can pipe Writable streams, which is just wrong.
						Writable.prototype.pipe = function() {
							this.emit('error', new Error('Cannot pipe, not readable'));
						};

						function writeAfterEnd(stream, cb) {
							var er = new Error('write after end');
							// TODO: defer error events consistently everywhere, not just the cb
							stream.emit('error', er);
							pna.nextTick(cb, er);
						}

						// Checks that a user-supplied chunk is valid, especially for the particular
						// mode the stream is in. Currently this means that `null` is never accepted
						// and undefined/non-string values are only allowed in object mode.
						function validChunk(stream, state, chunk, cb) {
							var valid = true;
							var er = false;

							if (chunk === null) {
								er = new TypeError('May not write null values to stream');
							} else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
								er = new TypeError('Invalid non-string/buffer chunk');
							}
							if (er) {
								stream.emit('error', er);
								pna.nextTick(cb, er);
								valid = false;
							}
							return valid;
						}

						Writable.prototype.write = function(chunk, encoding, cb) {
							var state = this._writableState;
							var ret = false;
							var isBuf = !state.objectMode && _isUint8Array(chunk);

							if (isBuf && !Buffer.isBuffer(chunk)) {
								chunk = _uint8ArrayToBuffer(chunk);
							}

							if (typeof encoding === 'function') {
								cb = encoding;
								encoding = null;
							}

							if (isBuf) encoding = 'buffer';
							else if (!encoding) encoding = state.defaultEncoding;

							if (typeof cb !== 'function') cb = nop;

							if (state.ended) writeAfterEnd(this, cb);
							else if (isBuf || validChunk(this, state, chunk, cb)) {
								state.pendingcb++;
								ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
							}

							return ret;
						};

						Writable.prototype.cork = function() {
							var state = this._writableState;

							state.corked++;
						};

						Writable.prototype.uncork = function() {
							var state = this._writableState;

							if (state.corked) {
								state.corked--;

								if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
							}
						};

						Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
							// node::ParseEncoding() requires lower case.
							if (typeof encoding === 'string') encoding = encoding.toLowerCase();
							if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
							this._writableState.defaultEncoding = encoding;
							return this;
						};

						function decodeChunk(state, chunk, encoding) {
							if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
								chunk = Buffer.from(chunk, encoding);
							}
							return chunk;
						}

						Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
							// making it explicit this property is not enumerable
							// because otherwise some prototype manipulation in
							// userland will fail
							enumerable: false,
							get: function() {
								return this._writableState.highWaterMark;
							},
						});

						// if we're already writing something, then just put this
						// in the queue, and wait our turn.  Otherwise, call _write
						// If we return false, then we need a drain event, so set that flag.
						function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
							if (!isBuf) {
								var newChunk = decodeChunk(state, chunk, encoding);
								if (chunk !== newChunk) {
									isBuf = true;
									encoding = 'buffer';
									chunk = newChunk;
								}
							}
							var len = state.objectMode ? 1 : chunk.length;

							state.length += len;

							var ret = state.length < state.highWaterMark;
							// we must ensure that previous needDrain will not be reset to false.
							if (!ret) state.needDrain = true;

							if (state.writing || state.corked) {
								var last = state.lastBufferedRequest;
								state.lastBufferedRequest = {
									chunk: chunk,
									encoding: encoding,
									isBuf: isBuf,
									callback: cb,
									next: null,
								};
								if (last) {
									last.next = state.lastBufferedRequest;
								} else {
									state.bufferedRequest = state.lastBufferedRequest;
								}
								state.bufferedRequestCount += 1;
							} else {
								doWrite(stream, state, false, len, chunk, encoding, cb);
							}

							return ret;
						}

						function doWrite(stream, state, writev, len, chunk, encoding, cb) {
							state.writelen = len;
							state.writecb = cb;
							state.writing = true;
							state.sync = true;
							if (writev) stream._writev(chunk, state.onwrite);
							else stream._write(chunk, encoding, state.onwrite);
							state.sync = false;
						}

						function onwriteError(stream, state, sync, er, cb) {
							--state.pendingcb;

							if (sync) {
								// defer the callback if we are being called synchronously
								// to avoid piling up things on the stack
								pna.nextTick(cb, er);
								// this can emit finish, and it will always happen
								// after error
								pna.nextTick(finishMaybe, stream, state);
								stream._writableState.errorEmitted = true;
								stream.emit('error', er);
							} else {
								// the caller expect this to happen before if
								// it is async
								cb(er);
								stream._writableState.errorEmitted = true;
								stream.emit('error', er);
								// this can emit finish, but finish must
								// always follow error
								finishMaybe(stream, state);
							}
						}

						function onwriteStateUpdate(state) {
							state.writing = false;
							state.writecb = null;
							state.length -= state.writelen;
							state.writelen = 0;
						}

						function onwrite(stream, er) {
							var state = stream._writableState;
							var sync = state.sync;
							var cb = state.writecb;

							onwriteStateUpdate(state);

							if (er) onwriteError(stream, state, sync, er, cb);
							else {
								// Check if we're actually ready to finish, but don't emit yet
								var finished = needFinish(state);

								if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
									clearBuffer(stream, state);
								}

								if (sync) {
									/*<replacement>*/
									asyncWrite(afterWrite, stream, state, finished, cb);
									/*</replacement>*/
								} else {
									afterWrite(stream, state, finished, cb);
								}
							}
						}

						function afterWrite(stream, state, finished, cb) {
							if (!finished) onwriteDrain(stream, state);
							state.pendingcb--;
							cb();
							finishMaybe(stream, state);
						}

						// Must force callback to be called on nextTick, so that we don't
						// emit 'drain' before the write() consumer gets the 'false' return
						// value, and has a chance to attach a 'drain' listener.
						function onwriteDrain(stream, state) {
							if (state.length === 0 && state.needDrain) {
								state.needDrain = false;
								stream.emit('drain');
							}
						}

						// if there's something in the buffer waiting, then process it
						function clearBuffer(stream, state) {
							state.bufferProcessing = true;
							var entry = state.bufferedRequest;

							if (stream._writev && entry && entry.next) {
								// Fast case, write everything using _writev()
								var l = state.bufferedRequestCount;
								var buffer = new Array(l);
								var holder = state.corkedRequestsFree;
								holder.entry = entry;

								var count = 0;
								var allBuffers = true;
								while (entry) {
									buffer[count] = entry;
									if (!entry.isBuf) allBuffers = false;
									entry = entry.next;
									count += 1;
								}
								buffer.allBuffers = allBuffers;

								doWrite(stream, state, true, state.length, buffer, '', holder.finish);

								// doWrite is almost always async, defer these to save a bit of time
								// as the hot path ends with doWrite
								state.pendingcb++;
								state.lastBufferedRequest = null;
								if (holder.next) {
									state.corkedRequestsFree = holder.next;
									holder.next = null;
								} else {
									state.corkedRequestsFree = new CorkedRequest(state);
								}
								state.bufferedRequestCount = 0;
							} else {
								// Slow case, write chunks one-by-one
								while (entry) {
									var chunk = entry.chunk;
									var encoding = entry.encoding;
									var cb = entry.callback;
									var len = state.objectMode ? 1 : chunk.length;

									doWrite(stream, state, false, len, chunk, encoding, cb);
									entry = entry.next;
									state.bufferedRequestCount--;
									// if we didn't call the onwrite immediately, then
									// it means that we need to wait until it does.
									// also, that means that the chunk and cb are currently
									// being processed, so move the buffer counter past them.
									if (state.writing) {
										break;
									}
								}

								if (entry === null) state.lastBufferedRequest = null;
							}

							state.bufferedRequest = entry;
							state.bufferProcessing = false;
						}

						Writable.prototype._write = function(chunk, encoding, cb) {
							cb(new Error('_write() is not implemented'));
						};

						Writable.prototype._writev = null;

						Writable.prototype.end = function(chunk, encoding, cb) {
							var state = this._writableState;

							if (typeof chunk === 'function') {
								cb = chunk;
								chunk = null;
								encoding = null;
							} else if (typeof encoding === 'function') {
								cb = encoding;
								encoding = null;
							}

							if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

							// .end() fully uncorks
							if (state.corked) {
								state.corked = 1;
								this.uncork();
							}

							// ignore unnecessary end() calls.
							if (!state.ending && !state.finished) endWritable(this, state, cb);
						};

						function needFinish(state) {
							return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
						}
						function callFinal(stream, state) {
							stream._final(function(err) {
								state.pendingcb--;
								if (err) {
									stream.emit('error', err);
								}
								state.prefinished = true;
								stream.emit('prefinish');
								finishMaybe(stream, state);
							});
						}
						function prefinish(stream, state) {
							if (!state.prefinished && !state.finalCalled) {
								if (typeof stream._final === 'function') {
									state.pendingcb++;
									state.finalCalled = true;
									pna.nextTick(callFinal, stream, state);
								} else {
									state.prefinished = true;
									stream.emit('prefinish');
								}
							}
						}

						function finishMaybe(stream, state) {
							var need = needFinish(state);
							if (need) {
								prefinish(stream, state);
								if (state.pendingcb === 0) {
									state.finished = true;
									stream.emit('finish');
								}
							}
							return need;
						}

						function endWritable(stream, state, cb) {
							state.ending = true;
							finishMaybe(stream, state);
							if (cb) {
								if (state.finished) pna.nextTick(cb);
								else stream.once('finish', cb);
							}
							state.ended = true;
							stream.writable = false;
						}

						function onCorkedFinish(corkReq, state, err) {
							var entry = corkReq.entry;
							corkReq.entry = null;
							while (entry) {
								var cb = entry.callback;
								state.pendingcb--;
								cb(err);
								entry = entry.next;
							}
							if (state.corkedRequestsFree) {
								state.corkedRequestsFree.next = corkReq;
							} else {
								state.corkedRequestsFree = corkReq;
							}
						}

						Object.defineProperty(Writable.prototype, 'destroyed', {
							get: function() {
								if (this._writableState === undefined) {
									return false;
								}
								return this._writableState.destroyed;
							},
							set: function(value) {
								// we ignore the value if the stream
								// has not been initialized yet
								if (!this._writableState) {
									return;
								}

								// backward compatibility, the user is explicitly
								// managing destroyed
								this._writableState.destroyed = value;
							},
						});

						Writable.prototype.destroy = destroyImpl.destroy;
						Writable.prototype._undestroy = destroyImpl.undestroy;
						Writable.prototype._destroy = function(err, cb) {
							this.end();
							cb(err);
						};
					}.call(this, require('_process'), typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}));
				},
				{'./_stream_duplex': 13, './internal/streams/destroy': 19, './internal/streams/stream': 20, _process: 11, 'core-util-is': 4, inherits: 7, 'process-nextick-args': 10, 'safe-buffer': 25, 'util-deprecate': 28},
			],
			18: [
				function(require, module, exports) {
					'use strict';

					function _classCallCheck(instance, Constructor) {
						if (!(instance instanceof Constructor)) {
							throw new TypeError('Cannot call a class as a function');
						}
					}

					var Buffer = require('safe-buffer').Buffer;
					var util = require('util');

					function copyBuffer(src, target, offset) {
						src.copy(target, offset);
					}

					module.exports = (function() {
						function BufferList() {
							_classCallCheck(this, BufferList);

							this.head = null;
							this.tail = null;
							this.length = 0;
						}

						BufferList.prototype.push = function push(v) {
							var entry = {data: v, next: null};
							if (this.length > 0) this.tail.next = entry;
							else this.head = entry;
							this.tail = entry;
							++this.length;
						};

						BufferList.prototype.unshift = function unshift(v) {
							var entry = {data: v, next: this.head};
							if (this.length === 0) this.tail = entry;
							this.head = entry;
							++this.length;
						};

						BufferList.prototype.shift = function shift() {
							if (this.length === 0) return;
							var ret = this.head.data;
							if (this.length === 1) this.head = this.tail = null;
							else this.head = this.head.next;
							--this.length;
							return ret;
						};

						BufferList.prototype.clear = function clear() {
							this.head = this.tail = null;
							this.length = 0;
						};

						BufferList.prototype.join = function join(s) {
							if (this.length === 0) return '';
							var p = this.head;
							var ret = '' + p.data;
							while ((p = p.next)) {
								ret += s + p.data;
							}
							return ret;
						};

						BufferList.prototype.concat = function concat(n) {
							if (this.length === 0) return Buffer.alloc(0);
							if (this.length === 1) return this.head.data;
							var ret = Buffer.allocUnsafe(n >>> 0);
							var p = this.head;
							var i = 0;
							while (p) {
								copyBuffer(p.data, ret, i);
								i += p.data.length;
								p = p.next;
							}
							return ret;
						};

						return BufferList;
					})();

					if (util && util.inspect && util.inspect.custom) {
						module.exports.prototype[util.inspect.custom] = function() {
							var obj = util.inspect({length: this.length});
							return this.constructor.name + ' ' + obj;
						};
					}
				},
				{'safe-buffer': 25, util: 2},
			],
			19: [
				function(require, module, exports) {
					'use strict';

					/*<replacement>*/

					var pna = require('process-nextick-args');
					/*</replacement>*/

					// undocumented cb() API, needed for core, not for public API
					function destroy(err, cb) {
						var _this = this;

						var readableDestroyed = this._readableState && this._readableState.destroyed;
						var writableDestroyed = this._writableState && this._writableState.destroyed;

						if (readableDestroyed || writableDestroyed) {
							if (cb) {
								cb(err);
							} else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
								pna.nextTick(emitErrorNT, this, err);
							}
							return this;
						}

						// we set destroyed to true before firing error callbacks in order
						// to make it re-entrance safe in case destroy() is called within callbacks

						if (this._readableState) {
							this._readableState.destroyed = true;
						}

						// if this is a duplex stream mark the writable part as destroyed as well
						if (this._writableState) {
							this._writableState.destroyed = true;
						}

						this._destroy(err || null, function(err) {
							if (!cb && err) {
								pna.nextTick(emitErrorNT, _this, err);
								if (_this._writableState) {
									_this._writableState.errorEmitted = true;
								}
							} else if (cb) {
								cb(err);
							}
						});

						return this;
					}

					function undestroy() {
						if (this._readableState) {
							this._readableState.destroyed = false;
							this._readableState.reading = false;
							this._readableState.ended = false;
							this._readableState.endEmitted = false;
						}

						if (this._writableState) {
							this._writableState.destroyed = false;
							this._writableState.ended = false;
							this._writableState.ending = false;
							this._writableState.finished = false;
							this._writableState.errorEmitted = false;
						}
					}

					function emitErrorNT(self, err) {
						self.emit('error', err);
					}

					module.exports = {
						destroy: destroy,
						undestroy: undestroy,
					};
				},
				{'process-nextick-args': 10},
			],
			20: [
				function(require, module, exports) {
					module.exports = require('events').EventEmitter;
				},
				{events: 5},
			],
			21: [
				function(require, module, exports) {
					module.exports = require('./readable').PassThrough;
				},
				{'./readable': 22},
			],
			22: [
				function(require, module, exports) {
					exports = module.exports = require('./lib/_stream_readable.js');
					exports.Stream = exports;
					exports.Readable = exports;
					exports.Writable = require('./lib/_stream_writable.js');
					exports.Duplex = require('./lib/_stream_duplex.js');
					exports.Transform = require('./lib/_stream_transform.js');
					exports.PassThrough = require('./lib/_stream_passthrough.js');
				},
				{'./lib/_stream_duplex.js': 13, './lib/_stream_passthrough.js': 14, './lib/_stream_readable.js': 15, './lib/_stream_transform.js': 16, './lib/_stream_writable.js': 17},
			],
			23: [
				function(require, module, exports) {
					module.exports = require('./readable').Transform;
				},
				{'./readable': 22},
			],
			24: [
				function(require, module, exports) {
					module.exports = require('./lib/_stream_writable.js');
				},
				{'./lib/_stream_writable.js': 17},
			],
			25: [
				function(require, module, exports) {
					/* eslint-disable node/no-deprecated-api */
					var buffer = require('buffer');
					var Buffer = buffer.Buffer;

					// alternative to using Object.keys for old browsers
					function copyProps(src, dst) {
						for (var key in src) {
							dst[key] = src[key];
						}
					}
					if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
						module.exports = buffer;
					} else {
						// Copy properties from require('buffer')
						copyProps(buffer, exports);
						exports.Buffer = SafeBuffer;
					}

					function SafeBuffer(arg, encodingOrOffset, length) {
						return Buffer(arg, encodingOrOffset, length);
					}

					// Copy static methods from Buffer
					copyProps(Buffer, SafeBuffer);

					SafeBuffer.from = function(arg, encodingOrOffset, length) {
						if (typeof arg === 'number') {
							throw new TypeError('Argument must not be a number');
						}
						return Buffer(arg, encodingOrOffset, length);
					};

					SafeBuffer.alloc = function(size, fill, encoding) {
						if (typeof size !== 'number') {
							throw new TypeError('Argument must be a number');
						}
						var buf = Buffer(size);
						if (fill !== undefined) {
							if (typeof encoding === 'string') {
								buf.fill(fill, encoding);
							} else {
								buf.fill(fill);
							}
						} else {
							buf.fill(0);
						}
						return buf;
					};

					SafeBuffer.allocUnsafe = function(size) {
						if (typeof size !== 'number') {
							throw new TypeError('Argument must be a number');
						}
						return Buffer(size);
					};

					SafeBuffer.allocUnsafeSlow = function(size) {
						if (typeof size !== 'number') {
							throw new TypeError('Argument must be a number');
						}
						return buffer.SlowBuffer(size);
					};
				},
				{buffer: 3},
			],
			26: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					module.exports = Stream;

					var EE = require('events').EventEmitter;
					var inherits = require('inherits');

					inherits(Stream, EE);
					Stream.Readable = require('readable-stream/readable.js');
					Stream.Writable = require('readable-stream/writable.js');
					Stream.Duplex = require('readable-stream/duplex.js');
					Stream.Transform = require('readable-stream/transform.js');
					Stream.PassThrough = require('readable-stream/passthrough.js');

					// Backwards-compat with node 0.4.x
					Stream.Stream = Stream;

					// old-style streams.  Note that the pipe method (the only relevant
					// part of this class) is overridden in the Readable class.

					function Stream() {
						EE.call(this);
					}

					Stream.prototype.pipe = function(dest, options) {
						var source = this;

						function ondata(chunk) {
							if (dest.writable) {
								if (false === dest.write(chunk) && source.pause) {
									source.pause();
								}
							}
						}

						source.on('data', ondata);

						function ondrain() {
							if (source.readable && source.resume) {
								source.resume();
							}
						}

						dest.on('drain', ondrain);

						// If the 'end' option is not supplied, dest.end() will be called when
						// source gets the 'end' or 'close' events.  Only dest.end() once.
						if (!dest._isStdio && (!options || options.end !== false)) {
							source.on('end', onend);
							source.on('close', onclose);
						}

						var didOnEnd = false;
						function onend() {
							if (didOnEnd) return;
							didOnEnd = true;

							dest.end();
						}

						function onclose() {
							if (didOnEnd) return;
							didOnEnd = true;

							if (typeof dest.destroy === 'function') dest.destroy();
						}

						// don't leave dangling pipes when there are errors.
						function onerror(er) {
							cleanup();
							if (EE.listenerCount(this, 'error') === 0) {
								throw er; // Unhandled stream error in pipe.
							}
						}

						source.on('error', onerror);
						dest.on('error', onerror);

						// remove all the event listeners that were added.
						function cleanup() {
							source.removeListener('data', ondata);
							dest.removeListener('drain', ondrain);

							source.removeListener('end', onend);
							source.removeListener('close', onclose);

							source.removeListener('error', onerror);
							dest.removeListener('error', onerror);

							source.removeListener('end', cleanup);
							source.removeListener('close', cleanup);

							dest.removeListener('close', cleanup);
						}

						source.on('end', cleanup);
						source.on('close', cleanup);

						dest.on('close', cleanup);

						dest.emit('pipe', source);

						// Allow for unix-like usage: A.pipe(B).pipe(C)
						return dest;
					};
				},
				{events: 5, inherits: 7, 'readable-stream/duplex.js': 12, 'readable-stream/passthrough.js': 21, 'readable-stream/readable.js': 22, 'readable-stream/transform.js': 23, 'readable-stream/writable.js': 24},
			],
			27: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					'use strict';

					/*<replacement>*/

					var Buffer = require('safe-buffer').Buffer;
					/*</replacement>*/

					var isEncoding =
						Buffer.isEncoding ||
						function(encoding) {
							encoding = '' + encoding;
							switch (encoding && encoding.toLowerCase()) {
								case 'hex':
								case 'utf8':
								case 'utf-8':
								case 'ascii':
								case 'binary':
								case 'base64':
								case 'ucs2':
								case 'ucs-2':
								case 'utf16le':
								case 'utf-16le':
								case 'raw':
									return true;
								default:
									return false;
							}
						};

					function _normalizeEncoding(enc) {
						if (!enc) return 'utf8';
						var retried;
						while (true) {
							switch (enc) {
								case 'utf8':
								case 'utf-8':
									return 'utf8';
								case 'ucs2':
								case 'ucs-2':
								case 'utf16le':
								case 'utf-16le':
									return 'utf16le';
								case 'latin1':
								case 'binary':
									return 'latin1';
								case 'base64':
								case 'ascii':
								case 'hex':
									return enc;
								default:
									if (retried) return; // undefined
									enc = ('' + enc).toLowerCase();
									retried = true;
							}
						}
					}

					// Do not cache `Buffer.isEncoding` when checking encoding names as some
					// modules monkey-patch it to support additional encodings
					function normalizeEncoding(enc) {
						var nenc = _normalizeEncoding(enc);
						if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
						return nenc || enc;
					}

					// StringDecoder provides an interface for efficiently splitting a series of
					// buffers into a series of JS strings without breaking apart multi-byte
					// characters.
					exports.StringDecoder = StringDecoder;
					function StringDecoder(encoding) {
						this.encoding = normalizeEncoding(encoding);
						var nb;
						switch (this.encoding) {
							case 'utf16le':
								this.text = utf16Text;
								this.end = utf16End;
								nb = 4;
								break;
							case 'utf8':
								this.fillLast = utf8FillLast;
								nb = 4;
								break;
							case 'base64':
								this.text = base64Text;
								this.end = base64End;
								nb = 3;
								break;
							default:
								this.write = simpleWrite;
								this.end = simpleEnd;
								return;
						}
						this.lastNeed = 0;
						this.lastTotal = 0;
						this.lastChar = Buffer.allocUnsafe(nb);
					}

					StringDecoder.prototype.write = function(buf) {
						if (buf.length === 0) return '';
						var r;
						var i;
						if (this.lastNeed) {
							r = this.fillLast(buf);
							if (r === undefined) return '';
							i = this.lastNeed;
							this.lastNeed = 0;
						} else {
							i = 0;
						}
						if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
						return r || '';
					};

					StringDecoder.prototype.end = utf8End;

					// Returns only complete characters in a Buffer
					StringDecoder.prototype.text = utf8Text;

					// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
					StringDecoder.prototype.fillLast = function(buf) {
						if (this.lastNeed <= buf.length) {
							buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
							return this.lastChar.toString(this.encoding, 0, this.lastTotal);
						}
						buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
						this.lastNeed -= buf.length;
					};

					// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
					// continuation byte. If an invalid byte is detected, -2 is returned.
					function utf8CheckByte(byte) {
						if (byte <= 0x7f) return 0;
						else if (byte >> 5 === 0x06) return 2;
						else if (byte >> 4 === 0x0e) return 3;
						else if (byte >> 3 === 0x1e) return 4;
						return byte >> 6 === 0x02 ? -1 : -2;
					}

					// Checks at most 3 bytes at the end of a Buffer in order to detect an
					// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
					// needed to complete the UTF-8 character (if applicable) are returned.
					function utf8CheckIncomplete(self, buf, i) {
						var j = buf.length - 1;
						if (j < i) return 0;
						var nb = utf8CheckByte(buf[j]);
						if (nb >= 0) {
							if (nb > 0) self.lastNeed = nb - 1;
							return nb;
						}
						if (--j < i || nb === -2) return 0;
						nb = utf8CheckByte(buf[j]);
						if (nb >= 0) {
							if (nb > 0) self.lastNeed = nb - 2;
							return nb;
						}
						if (--j < i || nb === -2) return 0;
						nb = utf8CheckByte(buf[j]);
						if (nb >= 0) {
							if (nb > 0) {
								if (nb === 2) nb = 0;
								else self.lastNeed = nb - 3;
							}
							return nb;
						}
						return 0;
					}

					// Validates as many continuation bytes for a multi-byte UTF-8 character as
					// needed or are available. If we see a non-continuation byte where we expect
					// one, we "replace" the validated continuation bytes we've seen so far with
					// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
					// behavior. The continuation byte check is included three times in the case
					// where all of the continuation bytes for a character exist in the same buffer.
					// It is also done this way as a slight performance increase instead of using a
					// loop.
					function utf8CheckExtraBytes(self, buf, p) {
						if ((buf[0] & 0xc0) !== 0x80) {
							self.lastNeed = 0;
							return '\ufffd';
						}
						if (self.lastNeed > 1 && buf.length > 1) {
							if ((buf[1] & 0xc0) !== 0x80) {
								self.lastNeed = 1;
								return '\ufffd';
							}
							if (self.lastNeed > 2 && buf.length > 2) {
								if ((buf[2] & 0xc0) !== 0x80) {
									self.lastNeed = 2;
									return '\ufffd';
								}
							}
						}
					}

					// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
					function utf8FillLast(buf) {
						var p = this.lastTotal - this.lastNeed;
						var r = utf8CheckExtraBytes(this, buf, p);
						if (r !== undefined) return r;
						if (this.lastNeed <= buf.length) {
							buf.copy(this.lastChar, p, 0, this.lastNeed);
							return this.lastChar.toString(this.encoding, 0, this.lastTotal);
						}
						buf.copy(this.lastChar, p, 0, buf.length);
						this.lastNeed -= buf.length;
					}

					// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
					// partial character, the character's bytes are buffered until the required
					// number of bytes are available.
					function utf8Text(buf, i) {
						var total = utf8CheckIncomplete(this, buf, i);
						if (!this.lastNeed) return buf.toString('utf8', i);
						this.lastTotal = total;
						var end = buf.length - (total - this.lastNeed);
						buf.copy(this.lastChar, 0, end);
						return buf.toString('utf8', i, end);
					}

					// For UTF-8, a replacement character is added when ending on a partial
					// character.
					function utf8End(buf) {
						var r = buf && buf.length ? this.write(buf) : '';
						if (this.lastNeed) return r + '\ufffd';
						return r;
					}

					// UTF-16LE typically needs two bytes per character, but even if we have an even
					// number of bytes available, we need to check if we end on a leading/high
					// surrogate. In that case, we need to wait for the next two bytes in order to
					// decode the last character properly.
					function utf16Text(buf, i) {
						if ((buf.length - i) % 2 === 0) {
							var r = buf.toString('utf16le', i);
							if (r) {
								var c = r.charCodeAt(r.length - 1);
								if (c >= 0xd800 && c <= 0xdbff) {
									this.lastNeed = 2;
									this.lastTotal = 4;
									this.lastChar[0] = buf[buf.length - 2];
									this.lastChar[1] = buf[buf.length - 1];
									return r.slice(0, -1);
								}
							}
							return r;
						}
						this.lastNeed = 1;
						this.lastTotal = 2;
						this.lastChar[0] = buf[buf.length - 1];
						return buf.toString('utf16le', i, buf.length - 1);
					}

					// For UTF-16LE we do not explicitly append special replacement characters if we
					// end on a partial character, we simply let v8 handle that.
					function utf16End(buf) {
						var r = buf && buf.length ? this.write(buf) : '';
						if (this.lastNeed) {
							var end = this.lastTotal - this.lastNeed;
							return r + this.lastChar.toString('utf16le', 0, end);
						}
						return r;
					}

					function base64Text(buf, i) {
						var n = (buf.length - i) % 3;
						if (n === 0) return buf.toString('base64', i);
						this.lastNeed = 3 - n;
						this.lastTotal = 3;
						if (n === 1) {
							this.lastChar[0] = buf[buf.length - 1];
						} else {
							this.lastChar[0] = buf[buf.length - 2];
							this.lastChar[1] = buf[buf.length - 1];
						}
						return buf.toString('base64', i, buf.length - n);
					}

					function base64End(buf) {
						var r = buf && buf.length ? this.write(buf) : '';
						if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
						return r;
					}

					// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
					function simpleWrite(buf) {
						return buf.toString(this.encoding);
					}

					function simpleEnd(buf) {
						return buf && buf.length ? this.write(buf) : '';
					}
				},
				{'safe-buffer': 25},
			],
			28: [
				function(require, module, exports) {
					(function(global) {
						/**
						 * Module exports.
						 */

						module.exports = deprecate;

						/**
						 * Mark that a method should not be used.
						 * Returns a modified function which warns once by default.
						 *
						 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
						 *
						 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
						 * will throw an Error when invoked.
						 *
						 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
						 * will invoke `console.trace()` instead of `console.error()`.
						 *
						 * @param {Function} fn - the function to deprecate
						 * @param {String} msg - the string to print to the console when `fn` is invoked
						 * @returns {Function} a new "deprecated" version of `fn`
						 * @api public
						 */

						function deprecate(fn, msg) {
							if (config('noDeprecation')) {
								return fn;
							}

							var warned = false;
							function deprecated() {
								if (!warned) {
									if (config('throwDeprecation')) {
										throw new Error(msg);
									} else if (config('traceDeprecation')) {
										console.trace(msg);
									} else {
										console.warn(msg);
									}
									warned = true;
								}
								return fn.apply(this, arguments);
							}

							return deprecated;
						}

						/**
						 * Checks `localStorage` for boolean values for the given `name`.
						 *
						 * @param {String} name
						 * @returns {Boolean}
						 * @api private
						 */

						function config(name) {
							// accessing global.localStorage can trigger a DOMException in sandboxed iframes
							try {
								if (!global.localStorage) return false;
							} catch (_) {
								return false;
							}
							var val = global.localStorage[name];
							if (null == val) return false;
							return String(val).toLowerCase() === 'true';
						}
					}.call(this, typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}));
				},
				{},
			],
			29: [
				function(require, module, exports) {
					arguments[4][7][0].apply(exports, arguments);
				},
				{dup: 7},
			],
			30: [
				function(require, module, exports) {
					module.exports = function isBuffer(arg) {
						return arg && typeof arg === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
					};
				},
				{},
			],
			31: [
				function(require, module, exports) {
					(function(process, global) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						var formatRegExp = /%[sdj%]/g;
						exports.format = function(f) {
							if (!isString(f)) {
								var objects = [];
								for (var i = 0; i < arguments.length; i++) {
									objects.push(inspect(arguments[i]));
								}
								return objects.join(' ');
							}

							var i = 1;
							var args = arguments;
							var len = args.length;
							var str = String(f).replace(formatRegExp, function(x) {
								if (x === '%%') return '%';
								if (i >= len) return x;
								switch (x) {
									case '%s':
										return String(args[i++]);
									case '%d':
										return Number(args[i++]);
									case '%j':
										try {
											return JSON.stringify(args[i++]);
										} catch (_) {
											return '[Circular]';
										}
									default:
										return x;
								}
							});
							for (var x = args[i]; i < len; x = args[++i]) {
								if (isNull(x) || !isObject(x)) {
									str += ' ' + x;
								} else {
									str += ' ' + inspect(x);
								}
							}
							return str;
						};

						// Mark that a method should not be used.
						// Returns a modified function which warns once by default.
						// If --no-deprecation is set, then it is a no-op.
						exports.deprecate = function(fn, msg) {
							// Allow for deprecating things in the process of starting up.
							if (isUndefined(global.process)) {
								return function() {
									return exports.deprecate(fn, msg).apply(this, arguments);
								};
							}

							if (process.noDeprecation === true) {
								return fn;
							}

							var warned = false;
							function deprecated() {
								if (!warned) {
									if (process.throwDeprecation) {
										throw new Error(msg);
									} else if (process.traceDeprecation) {
										console.trace(msg);
									} else {
										console.error(msg);
									}
									warned = true;
								}
								return fn.apply(this, arguments);
							}

							return deprecated;
						};

						var debugs = {};
						var debugEnviron;
						exports.debuglog = function(set) {
							if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
							set = set.toUpperCase();
							if (!debugs[set]) {
								if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
									var pid = process.pid;
									debugs[set] = function() {
										var msg = exports.format.apply(exports, arguments);
										console.error('%s %d: %s', set, pid, msg);
									};
								} else {
									debugs[set] = function() {};
								}
							}
							return debugs[set];
						};

						/**
						 * Echos the value of a value. Trys to print the value out
						 * in the best way possible given the different types.
						 *
						 * @param {Object} obj The object to print out.
						 * @param {Object} opts Optional options object that alters the output.
						 */
						/* legacy: obj, showHidden, depth, colors*/
						function inspect(obj, opts) {
							// default options
							var ctx = {
								seen: [],
								stylize: stylizeNoColor,
							};
							// legacy...
							if (arguments.length >= 3) ctx.depth = arguments[2];
							if (arguments.length >= 4) ctx.colors = arguments[3];
							if (isBoolean(opts)) {
								// legacy...
								ctx.showHidden = opts;
							} else if (opts) {
								// got an "options" object
								exports._extend(ctx, opts);
							}
							// set default options
							if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
							if (isUndefined(ctx.depth)) ctx.depth = 2;
							if (isUndefined(ctx.colors)) ctx.colors = false;
							if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
							if (ctx.colors) ctx.stylize = stylizeWithColor;
							return formatValue(ctx, obj, ctx.depth);
						}
						exports.inspect = inspect;

						// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
						inspect.colors = {
							bold: [1, 22],
							italic: [3, 23],
							underline: [4, 24],
							inverse: [7, 27],
							white: [37, 39],
							grey: [90, 39],
							black: [30, 39],
							blue: [34, 39],
							cyan: [36, 39],
							green: [32, 39],
							magenta: [35, 39],
							red: [31, 39],
							yellow: [33, 39],
						};

						// Don't use 'blue' not visible on cmd.exe
						inspect.styles = {
							special: 'cyan',
							number: 'yellow',
							boolean: 'yellow',
							undefined: 'grey',
							null: 'bold',
							string: 'green',
							date: 'magenta',
							// "name": intentionally not styling
							regexp: 'red',
						};

						function stylizeWithColor(str, styleType) {
							var style = inspect.styles[styleType];

							if (style) {
								return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
							} else {
								return str;
							}
						}

						function stylizeNoColor(str, styleType) {
							return str;
						}

						function arrayToHash(array) {
							var hash = {};

							array.forEach(function(val, idx) {
								hash[val] = true;
							});

							return hash;
						}

						function formatValue(ctx, value, recurseTimes) {
							// Provide a hook for user-specified inspect functions.
							// Check that value is an object with an inspect function on it
							if (
								ctx.customInspect &&
								value &&
								isFunction(value.inspect) &&
								// Filter out the util module, it's inspect function is special
								value.inspect !== exports.inspect &&
								// Also filter out any prototype objects using the circular check.
								!(value.constructor && value.constructor.prototype === value)
							) {
								var ret = value.inspect(recurseTimes, ctx);
								if (!isString(ret)) {
									ret = formatValue(ctx, ret, recurseTimes);
								}
								return ret;
							}

							// Primitive types cannot have properties
							var primitive = formatPrimitive(ctx, value);
							if (primitive) {
								return primitive;
							}

							// Look up the keys of the object.
							var keys = Object.keys(value);
							var visibleKeys = arrayToHash(keys);

							if (ctx.showHidden) {
								keys = Object.getOwnPropertyNames(value);
							}

							// IE doesn't make error fields non-enumerable
							// http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
							if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
								return formatError(value);
							}

							// Some type of object without properties can be shortcutted.
							if (keys.length === 0) {
								if (isFunction(value)) {
									var name = value.name ? ': ' + value.name : '';
									return ctx.stylize('[Function' + name + ']', 'special');
								}
								if (isRegExp(value)) {
									return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
								}
								if (isDate(value)) {
									return ctx.stylize(Date.prototype.toString.call(value), 'date');
								}
								if (isError(value)) {
									return formatError(value);
								}
							}

							var base = '',
								array = false,
								braces = ['{', '}'];

							// Make Array say that they are Array
							if (isArray(value)) {
								array = true;
								braces = ['[', ']'];
							}

							// Make functions say that they are functions
							if (isFunction(value)) {
								var n = value.name ? ': ' + value.name : '';
								base = ' [Function' + n + ']';
							}

							// Make RegExps say that they are RegExps
							if (isRegExp(value)) {
								base = ' ' + RegExp.prototype.toString.call(value);
							}

							// Make dates with properties first say the date
							if (isDate(value)) {
								base = ' ' + Date.prototype.toUTCString.call(value);
							}

							// Make error with message first say the error
							if (isError(value)) {
								base = ' ' + formatError(value);
							}

							if (keys.length === 0 && (!array || value.length == 0)) {
								return braces[0] + base + braces[1];
							}

							if (recurseTimes < 0) {
								if (isRegExp(value)) {
									return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
								} else {
									return ctx.stylize('[Object]', 'special');
								}
							}

							ctx.seen.push(value);

							var output;
							if (array) {
								output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
							} else {
								output = keys.map(function(key) {
									return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
								});
							}

							ctx.seen.pop();

							return reduceToSingleString(output, base, braces);
						}

						function formatPrimitive(ctx, value) {
							if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
							if (isString(value)) {
								var simple =
									"'" +
									JSON.stringify(value)
										.replace(/^"|"$/g, '')
										.replace(/'/g, "\\'")
										.replace(/\\"/g, '"') +
									"'";
								return ctx.stylize(simple, 'string');
							}
							if (isNumber(value)) return ctx.stylize('' + value, 'number');
							if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
							// For some reason typeof null is "object", so special case here.
							if (isNull(value)) return ctx.stylize('null', 'null');
						}

						function formatError(value) {
							return '[' + Error.prototype.toString.call(value) + ']';
						}

						function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
							var output = [];
							for (var i = 0, l = value.length; i < l; ++i) {
								if (hasOwnProperty(value, String(i))) {
									output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
								} else {
									output.push('');
								}
							}
							keys.forEach(function(key) {
								if (!key.match(/^\d+$/)) {
									output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
								}
							});
							return output;
						}

						function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
							var name, str, desc;
							desc = Object.getOwnPropertyDescriptor(value, key) || {value: value[key]};
							if (desc.get) {
								if (desc.set) {
									str = ctx.stylize('[Getter/Setter]', 'special');
								} else {
									str = ctx.stylize('[Getter]', 'special');
								}
							} else {
								if (desc.set) {
									str = ctx.stylize('[Setter]', 'special');
								}
							}
							if (!hasOwnProperty(visibleKeys, key)) {
								name = '[' + key + ']';
							}
							if (!str) {
								if (ctx.seen.indexOf(desc.value) < 0) {
									if (isNull(recurseTimes)) {
										str = formatValue(ctx, desc.value, null);
									} else {
										str = formatValue(ctx, desc.value, recurseTimes - 1);
									}
									if (str.indexOf('\n') > -1) {
										if (array) {
											str = str
												.split('\n')
												.map(function(line) {
													return '  ' + line;
												})
												.join('\n')
												.substr(2);
										} else {
											str =
												'\n' +
												str
													.split('\n')
													.map(function(line) {
														return '   ' + line;
													})
													.join('\n');
										}
									}
								} else {
									str = ctx.stylize('[Circular]', 'special');
								}
							}
							if (isUndefined(name)) {
								if (array && key.match(/^\d+$/)) {
									return str;
								}
								name = JSON.stringify('' + key);
								if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
									name = name.substr(1, name.length - 2);
									name = ctx.stylize(name, 'name');
								} else {
									name = name
										.replace(/'/g, "\\'")
										.replace(/\\"/g, '"')
										.replace(/(^"|"$)/g, "'");
									name = ctx.stylize(name, 'string');
								}
							}

							return name + ': ' + str;
						}

						function reduceToSingleString(output, base, braces) {
							var numLinesEst = 0;
							var length = output.reduce(function(prev, cur) {
								numLinesEst++;
								if (cur.indexOf('\n') >= 0) numLinesEst++;
								return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
							}, 0);

							if (length > 60) {
								return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
							}

							return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
						}

						// NOTE: These type checking functions intentionally don't use `instanceof`
						// because it is fragile and can be easily faked with `Object.create()`.
						function isArray(ar) {
							return Array.isArray(ar);
						}
						exports.isArray = isArray;

						function isBoolean(arg) {
							return typeof arg === 'boolean';
						}
						exports.isBoolean = isBoolean;

						function isNull(arg) {
							return arg === null;
						}
						exports.isNull = isNull;

						function isNullOrUndefined(arg) {
							return arg == null;
						}
						exports.isNullOrUndefined = isNullOrUndefined;

						function isNumber(arg) {
							return typeof arg === 'number';
						}
						exports.isNumber = isNumber;

						function isString(arg) {
							return typeof arg === 'string';
						}
						exports.isString = isString;

						function isSymbol(arg) {
							return typeof arg === 'symbol';
						}
						exports.isSymbol = isSymbol;

						function isUndefined(arg) {
							return arg === void 0;
						}
						exports.isUndefined = isUndefined;

						function isRegExp(re) {
							return isObject(re) && objectToString(re) === '[object RegExp]';
						}
						exports.isRegExp = isRegExp;

						function isObject(arg) {
							return typeof arg === 'object' && arg !== null;
						}
						exports.isObject = isObject;

						function isDate(d) {
							return isObject(d) && objectToString(d) === '[object Date]';
						}
						exports.isDate = isDate;

						function isError(e) {
							return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
						}
						exports.isError = isError;

						function isFunction(arg) {
							return typeof arg === 'function';
						}
						exports.isFunction = isFunction;

						function isPrimitive(arg) {
							return (
								arg === null ||
								typeof arg === 'boolean' ||
								typeof arg === 'number' ||
								typeof arg === 'string' ||
								typeof arg === 'symbol' || // ES6 symbol
								typeof arg === 'undefined'
							);
						}
						exports.isPrimitive = isPrimitive;

						exports.isBuffer = require('./support/isBuffer');

						function objectToString(o) {
							return Object.prototype.toString.call(o);
						}

						function pad(n) {
							return n < 10 ? '0' + n.toString(10) : n.toString(10);
						}

						var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

						// 26 Feb 16:19:34
						function timestamp() {
							var d = new Date();
							var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
							return [d.getDate(), months[d.getMonth()], time].join(' ');
						}

						// log is just a thin wrapper to console.log that prepends a timestamp
						exports.log = function() {
							console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
						};

						/**
						 * Inherit the prototype methods from one constructor into another.
						 *
						 * The Function.prototype.inherits from lang.js rewritten as a standalone
						 * function (not on Function.prototype). NOTE: If this file is to be loaded
						 * during bootstrapping this function needs to be rewritten using some native
						 * functions as prototype setup using normal JavaScript does not work as
						 * expected during bootstrapping (see mirror.js in r114903).
						 *
						 * @param {function} ctor Constructor function which needs to inherit the
						 *     prototype.
						 * @param {function} superCtor Constructor function to inherit prototype from.
						 */
						exports.inherits = require('inherits');

						exports._extend = function(origin, add) {
							// Don't do anything if add isn't an object
							if (!add || !isObject(add)) return origin;

							var keys = Object.keys(add);
							var i = keys.length;
							while (i--) {
								origin[keys[i]] = add[keys[i]];
							}
							return origin;
						};

						function hasOwnProperty(obj, prop) {
							return Object.prototype.hasOwnProperty.call(obj, prop);
						}
					}.call(this, require('_process'), typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : {}));
				},
				{'./support/isBuffer': 30, _process: 11, inherits: 29},
			],
			32: [
				function(require, module, exports) {
					module.exports = require('level-packager')(require('level-js'));
				},
				{'level-js': 57, 'level-packager': 59},
			],
			33: [
				function(require, module, exports) {
					(function(process) {
						/* Copyright (c) 2013 Rod Vagg, MIT License */

						function AbstractChainedBatch(db) {
							this._db = db;
							this._operations = [];
							this._written = false;
						}

						AbstractChainedBatch.prototype._checkWritten = function() {
							if (this._written) throw new Error('write() already called on this batch');
						};

						AbstractChainedBatch.prototype.put = function(key, value) {
							this._checkWritten();

							var err = this._db._checkKeyValue(key, 'key', this._db._isBuffer);
							if (err) throw err;
							err = this._db._checkKeyValue(value, 'value', this._db._isBuffer);
							if (err) throw err;

							if (!this._db._isBuffer(key)) key = String(key);
							if (!this._db._isBuffer(value)) value = String(value);

							if (typeof this._put == 'function') this._put(key, value);
							else this._operations.push({type: 'put', key: key, value: value});

							return this;
						};

						AbstractChainedBatch.prototype.del = function(key) {
							this._checkWritten();

							var err = this._db._checkKeyValue(key, 'key', this._db._isBuffer);
							if (err) throw err;

							if (!this._db._isBuffer(key)) key = String(key);

							if (typeof this._del == 'function') this._del(key);
							else this._operations.push({type: 'del', key: key});

							return this;
						};

						AbstractChainedBatch.prototype.clear = function() {
							this._checkWritten();

							this._operations = [];

							if (typeof this._clear == 'function') this._clear();

							return this;
						};

						AbstractChainedBatch.prototype.write = function(options, callback) {
							this._checkWritten();

							if (typeof options == 'function') callback = options;
							if (typeof callback != 'function') throw new Error('write() requires a callback argument');
							if (typeof options != 'object') options = {};

							this._written = true;

							if (typeof this._write == 'function') return this._write(callback);

							if (typeof this._db._batch == 'function') return this._db._batch(this._operations, options, callback);

							process.nextTick(callback);
						};

						module.exports = AbstractChainedBatch;
					}.call(this, require('_process')));
				},
				{_process: 11},
			],
			34: [
				function(require, module, exports) {
					(function(process) {
						/* Copyright (c) 2013 Rod Vagg, MIT License */

						function AbstractIterator(db) {
							this.db = db;
							this._ended = false;
							this._nexting = false;
						}

						AbstractIterator.prototype.next = function(callback) {
							var self = this;

							if (typeof callback != 'function') throw new Error('next() requires a callback argument');

							if (self._ended) return callback(new Error('cannot call next() after end()'));
							if (self._nexting) return callback(new Error('cannot call next() before previous next() has completed'));

							self._nexting = true;
							if (typeof self._next == 'function') {
								return self._next(function() {
									self._nexting = false;
									callback.apply(null, arguments);
								});
							}

							process.nextTick(function() {
								self._nexting = false;
								callback();
							});
						};

						AbstractIterator.prototype.end = function(callback) {
							if (typeof callback != 'function') throw new Error('end() requires a callback argument');

							if (this._ended) return callback(new Error('end() already called on iterator'));

							this._ended = true;

							if (typeof this._end == 'function') return this._end(callback);

							process.nextTick(callback);
						};

						module.exports = AbstractIterator;
					}.call(this, require('_process')));
				},
				{_process: 11},
			],
			35: [
				function(require, module, exports) {
					(function(Buffer, process) {
						/* Copyright (c) 2013 Rod Vagg, MIT License */

						var xtend = require('xtend'),
							AbstractIterator = require('./abstract-iterator'),
							AbstractChainedBatch = require('./abstract-chained-batch');

						function AbstractLevelDOWN(location) {
							if (!arguments.length || location === undefined) throw new Error('constructor requires at least a location argument');

							if (typeof location != 'string') throw new Error('constructor requires a location string argument');

							this.location = location;
						}

						AbstractLevelDOWN.prototype.open = function(options, callback) {
							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('open() requires a callback argument');

							if (typeof options != 'object') options = {};

							if (typeof this._open == 'function') return this._open(options, callback);

							process.nextTick(callback);
						};

						AbstractLevelDOWN.prototype.close = function(callback) {
							if (typeof callback != 'function') throw new Error('close() requires a callback argument');

							if (typeof this._close == 'function') return this._close(callback);

							process.nextTick(callback);
						};

						AbstractLevelDOWN.prototype.get = function(key, options, callback) {
							var err;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('get() requires a callback argument');

							if ((err = this._checkKeyValue(key, 'key', this._isBuffer))) return callback(err);

							if (!this._isBuffer(key)) key = String(key);

							if (typeof options != 'object') options = {};

							if (typeof this._get == 'function') return this._get(key, options, callback);

							process.nextTick(function() {
								callback(new Error('NotFound'));
							});
						};

						AbstractLevelDOWN.prototype.put = function(key, value, options, callback) {
							var err;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('put() requires a callback argument');

							if ((err = this._checkKeyValue(key, 'key', this._isBuffer))) return callback(err);

							if ((err = this._checkKeyValue(value, 'value', this._isBuffer))) return callback(err);

							if (!this._isBuffer(key)) key = String(key);

							// coerce value to string in node, don't touch it in browser
							// (indexeddb can store any JS type)
							if (!this._isBuffer(value) && !process.browser) value = String(value);

							if (typeof options != 'object') options = {};

							if (typeof this._put == 'function') return this._put(key, value, options, callback);

							process.nextTick(callback);
						};

						AbstractLevelDOWN.prototype.del = function(key, options, callback) {
							var err;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('del() requires a callback argument');

							if ((err = this._checkKeyValue(key, 'key', this._isBuffer))) return callback(err);

							if (!this._isBuffer(key)) key = String(key);

							if (typeof options != 'object') options = {};

							if (typeof this._del == 'function') return this._del(key, options, callback);

							process.nextTick(callback);
						};

						AbstractLevelDOWN.prototype.batch = function(array, options, callback) {
							if (!arguments.length) return this._chainedBatch();

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('batch(array) requires a callback argument');

							if (!Array.isArray(array)) return callback(new Error('batch(array) requires an array argument'));

							if (typeof options != 'object') options = {};

							var i = 0,
								l = array.length,
								e,
								err;

							for (; i < l; i++) {
								e = array[i];
								if (typeof e != 'object') continue;

								if ((err = this._checkKeyValue(e.type, 'type', this._isBuffer))) return callback(err);

								if ((err = this._checkKeyValue(e.key, 'key', this._isBuffer))) return callback(err);

								if (e.type == 'put') {
									if ((err = this._checkKeyValue(e.value, 'value', this._isBuffer))) return callback(err);
								}
							}

							if (typeof this._batch == 'function') return this._batch(array, options, callback);

							process.nextTick(callback);
						};

						//TODO: remove from here, not a necessary primitive
						AbstractLevelDOWN.prototype.approximateSize = function(start, end, callback) {
							if (start == null || end == null || typeof start == 'function' || typeof end == 'function') {
								throw new Error('approximateSize() requires valid `start`, `end` and `callback` arguments');
							}

							if (typeof callback != 'function') throw new Error('approximateSize() requires a callback argument');

							if (!this._isBuffer(start)) start = String(start);

							if (!this._isBuffer(end)) end = String(end);

							if (typeof this._approximateSize == 'function') return this._approximateSize(start, end, callback);

							process.nextTick(function() {
								callback(null, 0);
							});
						};

						AbstractLevelDOWN.prototype._setupIteratorOptions = function(options) {
							var self = this;

							options = xtend(options);
							['start', 'end', 'gt', 'gte', 'lt', 'lte'].forEach(function(o) {
								if (options[o] && self._isBuffer(options[o]) && options[o].length === 0) delete options[o];
							});

							options.reverse = !!options.reverse;

							// fix `start` so it takes into account gt, gte, lt, lte as appropriate
							if (options.reverse && options.lt) options.start = options.lt;
							if (options.reverse && options.lte) options.start = options.lte;
							if (!options.reverse && options.gt) options.start = options.gt;
							if (!options.reverse && options.gte) options.start = options.gte;

							if ((options.reverse && options.lt && !options.lte) || (!options.reverse && options.gt && !options.gte)) options.exclusiveStart = true; // start should *not* include matching key

							return options;
						};

						AbstractLevelDOWN.prototype.iterator = function(options) {
							if (typeof options != 'object') options = {};

							options = this._setupIteratorOptions(options);

							if (typeof this._iterator == 'function') return this._iterator(options);

							return new AbstractIterator(this);
						};

						AbstractLevelDOWN.prototype._chainedBatch = function() {
							return new AbstractChainedBatch(this);
						};

						AbstractLevelDOWN.prototype._isBuffer = function(obj) {
							return Buffer.isBuffer(obj);
						};

						AbstractLevelDOWN.prototype._checkKeyValue = function(obj, type) {
							if (obj === null || obj === undefined) return new Error(type + ' cannot be `null` or `undefined`');

							if (this._isBuffer(obj)) {
								if (obj.length === 0) return new Error(type + ' cannot be an empty Buffer');
							} else if (String(obj) === '') return new Error(type + ' cannot be an empty String');
						};

						module.exports.AbstractLevelDOWN = AbstractLevelDOWN;
						module.exports.AbstractIterator = AbstractIterator;
						module.exports.AbstractChainedBatch = AbstractChainedBatch;
					}.call(this, {isBuffer: require('../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js')}, require('_process')));
				},
				{'../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js': 8, './abstract-chained-batch': 33, './abstract-iterator': 34, _process: 11, xtend: 36},
			],
			36: [
				function(require, module, exports) {
					module.exports = extend;

					function extend() {
						var target = {};

						for (var i = 0; i < arguments.length; i++) {
							var source = arguments[i];

							for (var key in source) {
								if (source.hasOwnProperty(key)) {
									target[key] = source[key];
								}
							}
						}

						return target;
					}
				},
				{},
			],
			37: [
				function(require, module, exports) {
					(function(Buffer) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						// NOTE: These type checking functions intentionally don't use `instanceof`
						// because it is fragile and can be easily faked with `Object.create()`.

						function isArray(arg) {
							if (Array.isArray) {
								return Array.isArray(arg);
							}
							return objectToString(arg) === '[object Array]';
						}
						exports.isArray = isArray;

						function isBoolean(arg) {
							return typeof arg === 'boolean';
						}
						exports.isBoolean = isBoolean;

						function isNull(arg) {
							return arg === null;
						}
						exports.isNull = isNull;

						function isNullOrUndefined(arg) {
							return arg == null;
						}
						exports.isNullOrUndefined = isNullOrUndefined;

						function isNumber(arg) {
							return typeof arg === 'number';
						}
						exports.isNumber = isNumber;

						function isString(arg) {
							return typeof arg === 'string';
						}
						exports.isString = isString;

						function isSymbol(arg) {
							return typeof arg === 'symbol';
						}
						exports.isSymbol = isSymbol;

						function isUndefined(arg) {
							return arg === void 0;
						}
						exports.isUndefined = isUndefined;

						function isRegExp(re) {
							return objectToString(re) === '[object RegExp]';
						}
						exports.isRegExp = isRegExp;

						function isObject(arg) {
							return typeof arg === 'object' && arg !== null;
						}
						exports.isObject = isObject;

						function isDate(d) {
							return objectToString(d) === '[object Date]';
						}
						exports.isDate = isDate;

						function isError(e) {
							return objectToString(e) === '[object Error]' || e instanceof Error;
						}
						exports.isError = isError;

						function isFunction(arg) {
							return typeof arg === 'function';
						}
						exports.isFunction = isFunction;

						function isPrimitive(arg) {
							return (
								arg === null ||
								typeof arg === 'boolean' ||
								typeof arg === 'number' ||
								typeof arg === 'string' ||
								typeof arg === 'symbol' || // ES6 symbol
								typeof arg === 'undefined'
							);
						}
						exports.isPrimitive = isPrimitive;

						exports.isBuffer = Buffer.isBuffer;

						function objectToString(o) {
							return Object.prototype.toString.call(o);
						}
					}.call(this, {isBuffer: require('../../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js')}));
				},
				{'../../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js': 8},
			],
			38: [
				function(require, module, exports) {
					var util = require('util'),
						AbstractIterator = require('abstract-leveldown').AbstractIterator;

					function DeferredIterator(options) {
						AbstractIterator.call(this, options);

						this._options = options;
						this._iterator = null;
						this._operations = [];
					}

					util.inherits(DeferredIterator, AbstractIterator);

					DeferredIterator.prototype.setDb = function(db) {
						var it = (this._iterator = db.iterator(this._options));
						this._operations.forEach(function(op) {
							it[op.method].apply(it, op.args);
						});
					};

					DeferredIterator.prototype._operation = function(method, args) {
						if (this._iterator) return this._iterator[method].apply(this._iterator, args);
						this._operations.push({method: method, args: args});
					};

					'next end'.split(' ').forEach(function(m) {
						DeferredIterator.prototype['_' + m] = function() {
							this._operation(m, arguments);
						};
					});

					module.exports = DeferredIterator;
				},
				{'abstract-leveldown': 43, util: 31},
			],
			39: [
				function(require, module, exports) {
					(function(Buffer, process) {
						var util = require('util'),
							AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN,
							DeferredIterator = require('./deferred-iterator');

						function DeferredLevelDOWN(location) {
							AbstractLevelDOWN.call(this, typeof location == 'string' ? location : ''); // optional location, who cares?
							this._db = undefined;
							this._operations = [];
							this._iterators = [];
						}

						util.inherits(DeferredLevelDOWN, AbstractLevelDOWN);

						// called by LevelUP when we have a real DB to take its place
						DeferredLevelDOWN.prototype.setDb = function(db) {
							this._db = db;
							this._operations.forEach(function(op) {
								db[op.method].apply(db, op.args);
							});
							this._iterators.forEach(function(it) {
								it.setDb(db);
							});
						};

						DeferredLevelDOWN.prototype._open = function(options, callback) {
							return process.nextTick(callback);
						};

						// queue a new deferred operation
						DeferredLevelDOWN.prototype._operation = function(method, args) {
							if (this._db) return this._db[method].apply(this._db, args);
							this._operations.push({method: method, args: args});
						};

						// deferrables
						'put get del batch approximateSize'.split(' ').forEach(function(m) {
							DeferredLevelDOWN.prototype['_' + m] = function() {
								this._operation(m, arguments);
							};
						});

						DeferredLevelDOWN.prototype._isBuffer = function(obj) {
							return Buffer.isBuffer(obj);
						};

						DeferredLevelDOWN.prototype._iterator = function(options) {
							if (this._db) return this._db.iterator.apply(this._db, arguments);
							var it = new DeferredIterator(options);
							this._iterators.push(it);
							return it;
						};

						module.exports = DeferredLevelDOWN;
						module.exports.DeferredIterator = DeferredIterator;
					}.call(this, {isBuffer: require('../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js')}, require('_process')));
				},
				{'../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js': 8, './deferred-iterator': 38, _process: 11, 'abstract-leveldown': 43, util: 31},
			],
			40: [
				function(require, module, exports) {
					(function(process) {
						/* Copyright (c) 2017 Rod Vagg, MIT License */

						function AbstractChainedBatch(db) {
							this._db = db;
							this._operations = [];
							this._written = false;
						}

						AbstractChainedBatch.prototype._serializeKey = function(key) {
							return this._db._serializeKey(key);
						};

						AbstractChainedBatch.prototype._serializeValue = function(value) {
							return this._db._serializeValue(value);
						};

						AbstractChainedBatch.prototype._checkWritten = function() {
							if (this._written) throw new Error('write() already called on this batch');
						};

						AbstractChainedBatch.prototype.put = function(key, value) {
							this._checkWritten();

							var err = this._db._checkKey(key, 'key', this._db._isBuffer);
							if (err) throw err;

							key = this._serializeKey(key);
							value = this._serializeValue(value);

							if (typeof this._put == 'function') this._put(key, value);
							else this._operations.push({type: 'put', key: key, value: value});

							return this;
						};

						AbstractChainedBatch.prototype.del = function(key) {
							this._checkWritten();

							var err = this._db._checkKey(key, 'key', this._db._isBuffer);
							if (err) throw err;

							key = this._serializeKey(key);

							if (typeof this._del == 'function') this._del(key);
							else this._operations.push({type: 'del', key: key});

							return this;
						};

						AbstractChainedBatch.prototype.clear = function() {
							this._checkWritten();

							this._operations = [];

							if (typeof this._clear == 'function') this._clear();

							return this;
						};

						AbstractChainedBatch.prototype.write = function(options, callback) {
							this._checkWritten();

							if (typeof options == 'function') callback = options;
							if (typeof callback != 'function') throw new Error('write() requires a callback argument');
							if (typeof options != 'object') options = {};

							this._written = true;

							if (typeof this._write == 'function') return this._write(callback);

							if (typeof this._db._batch == 'function') return this._db._batch(this._operations, options, callback);

							process.nextTick(callback);
						};

						module.exports = AbstractChainedBatch;
					}.call(this, require('_process')));
				},
				{_process: 11},
			],
			41: [
				function(require, module, exports) {
					(function(process) {
						/* Copyright (c) 2017 Rod Vagg, MIT License */

						function AbstractIterator(db) {
							this.db = db;
							this._ended = false;
							this._nexting = false;
						}

						AbstractIterator.prototype.next = function(callback) {
							var self = this;

							if (typeof callback != 'function') throw new Error('next() requires a callback argument');

							if (self._ended) return callback(new Error('cannot call next() after end()'));
							if (self._nexting) return callback(new Error('cannot call next() before previous next() has completed'));

							self._nexting = true;
							if (typeof self._next == 'function') {
								return self._next(function() {
									self._nexting = false;
									callback.apply(null, arguments);
								});
							}

							process.nextTick(function() {
								self._nexting = false;
								callback();
							});
						};

						AbstractIterator.prototype.end = function(callback) {
							if (typeof callback != 'function') throw new Error('end() requires a callback argument');

							if (this._ended) return callback(new Error('end() already called on iterator'));

							this._ended = true;

							if (typeof this._end == 'function') return this._end(callback);

							process.nextTick(callback);
						};

						module.exports = AbstractIterator;
					}.call(this, require('_process')));
				},
				{_process: 11},
			],
			42: [
				function(require, module, exports) {
					(function(Buffer, process) {
						/* Copyright (c) 2017 Rod Vagg, MIT License */

						var xtend = require('xtend'),
							AbstractIterator = require('./abstract-iterator'),
							AbstractChainedBatch = require('./abstract-chained-batch');

						function AbstractLevelDOWN(location) {
							if (!arguments.length || location === undefined) throw new Error('constructor requires at least a location argument');

							if (typeof location != 'string') throw new Error('constructor requires a location string argument');

							this.location = location;
							this.status = 'new';
						}

						AbstractLevelDOWN.prototype.open = function(options, callback) {
							var self = this,
								oldStatus = this.status;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('open() requires a callback argument');

							if (typeof options != 'object') options = {};

							options.createIfMissing = options.createIfMissing != false;
							options.errorIfExists = !!options.errorIfExists;

							if (typeof this._open == 'function') {
								this.status = 'opening';
								this._open(options, function(err) {
									if (err) {
										self.status = oldStatus;
										return callback(err);
									}
									self.status = 'open';
									callback();
								});
							} else {
								this.status = 'open';
								process.nextTick(callback);
							}
						};

						AbstractLevelDOWN.prototype.close = function(callback) {
							var self = this,
								oldStatus = this.status;

							if (typeof callback != 'function') throw new Error('close() requires a callback argument');

							if (typeof this._close == 'function') {
								this.status = 'closing';
								this._close(function(err) {
									if (err) {
										self.status = oldStatus;
										return callback(err);
									}
									self.status = 'closed';
									callback();
								});
							} else {
								this.status = 'closed';
								process.nextTick(callback);
							}
						};

						AbstractLevelDOWN.prototype.get = function(key, options, callback) {
							var err;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('get() requires a callback argument');

							if ((err = this._checkKey(key, 'key'))) return callback(err);

							key = this._serializeKey(key);

							if (typeof options != 'object') options = {};

							options.asBuffer = options.asBuffer != false;

							if (typeof this._get == 'function') return this._get(key, options, callback);

							process.nextTick(function() {
								callback(new Error('NotFound'));
							});
						};

						AbstractLevelDOWN.prototype.put = function(key, value, options, callback) {
							var err;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('put() requires a callback argument');

							if ((err = this._checkKey(key, 'key'))) return callback(err);

							key = this._serializeKey(key);
							value = this._serializeValue(value);

							if (typeof options != 'object') options = {};

							if (typeof this._put == 'function') return this._put(key, value, options, callback);

							process.nextTick(callback);
						};

						AbstractLevelDOWN.prototype.del = function(key, options, callback) {
							var err;

							if (typeof options == 'function') callback = options;

							if (typeof callback != 'function') throw new Error('del() requires a callback argument');

							if ((err = this._checkKey(key, 'key'))) return callback(err);

							key = this._serializeKey(key);

							if (typeof options != 'object') options = {};

							if (typeof this._del == 'function') return this._del(key, options, callback);

							process.nextTick(callback);
						};

						AbstractLevelDOWN.prototype.batch = function(array, options, callback) {
							if (!arguments.length) return this._chainedBatch();

							if (typeof options == 'function') callback = options;

							if (typeof array == 'function') callback = array;

							if (typeof callback != 'function') throw new Error('batch(array) requires a callback argument');

							if (!Array.isArray(array)) return callback(new Error('batch(array) requires an array argument'));

							if (!options || typeof options != 'object') options = {};

							var i = 0,
								l = array.length,
								e,
								err;

							for (; i < l; i++) {
								e = array[i];
								if (typeof e != 'object') continue;

								if ((err = this._checkKey(e.type, 'type'))) return callback(err);

								if ((err = this._checkKey(e.key, 'key'))) return callback(err);
							}

							if (typeof this._batch == 'function') return this._batch(array, options, callback);

							process.nextTick(callback);
						};

						//TODO: remove from here, not a necessary primitive
						AbstractLevelDOWN.prototype.approximateSize = function(start, end, callback) {
							if (start == null || end == null || typeof start == 'function' || typeof end == 'function') {
								throw new Error('approximateSize() requires valid `start`, `end` and `callback` arguments');
							}

							if (typeof callback != 'function') throw new Error('approximateSize() requires a callback argument');

							start = this._serializeKey(start);
							end = this._serializeKey(end);

							if (typeof this._approximateSize == 'function') return this._approximateSize(start, end, callback);

							process.nextTick(function() {
								callback(null, 0);
							});
						};

						AbstractLevelDOWN.prototype._setupIteratorOptions = function(options) {
							var self = this;

							options = xtend(options);
							['start', 'end', 'gt', 'gte', 'lt', 'lte'].forEach(function(o) {
								if (options[o] && self._isBuffer(options[o]) && options[o].length === 0) delete options[o];
							});

							options.reverse = !!options.reverse;
							options.keys = options.keys != false;
							options.values = options.values != false;
							options.limit = 'limit' in options ? options.limit : -1;
							options.keyAsBuffer = options.keyAsBuffer != false;
							options.valueAsBuffer = options.valueAsBuffer != false;

							return options;
						};

						AbstractLevelDOWN.prototype.iterator = function(options) {
							if (typeof options != 'object') options = {};

							options = this._setupIteratorOptions(options);

							if (typeof this._iterator == 'function') return this._iterator(options);

							return new AbstractIterator(this);
						};

						AbstractLevelDOWN.prototype._chainedBatch = function() {
							return new AbstractChainedBatch(this);
						};

						AbstractLevelDOWN.prototype._isBuffer = function(obj) {
							return Buffer.isBuffer(obj);
						};

						AbstractLevelDOWN.prototype._serializeKey = function(key) {
							return this._isBuffer(key) ? key : String(key);
						};

						AbstractLevelDOWN.prototype._serializeValue = function(value) {
							if (value == null) return '';
							return this._isBuffer(value) || process.browser ? value : String(value);
						};

						AbstractLevelDOWN.prototype._checkKey = function(obj, type) {
							if (obj === null || obj === undefined) return new Error(type + ' cannot be `null` or `undefined`');

							if (this._isBuffer(obj) && obj.length === 0) return new Error(type + ' cannot be an empty Buffer');
							else if (String(obj) === '') return new Error(type + ' cannot be an empty String');
						};

						module.exports = AbstractLevelDOWN;
					}.call(this, {isBuffer: require('../../../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js')}, require('_process')));
				},
				{'../../../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js': 8, './abstract-chained-batch': 40, './abstract-iterator': 41, _process: 11, xtend: 45},
			],
			43: [
				function(require, module, exports) {
					exports.AbstractLevelDOWN = require('./abstract-leveldown');
					exports.AbstractIterator = require('./abstract-iterator');
					exports.AbstractChainedBatch = require('./abstract-chained-batch');
					exports.isLevelDOWN = require('./is-leveldown');
				},
				{'./abstract-chained-batch': 40, './abstract-iterator': 41, './abstract-leveldown': 42, './is-leveldown': 44},
			],
			44: [
				function(require, module, exports) {
					var AbstractLevelDOWN = require('./abstract-leveldown');

					function isLevelDOWN(db) {
						if (!db || typeof db !== 'object') return false;
						return Object.keys(AbstractLevelDOWN.prototype)
							.filter(function(name) {
								// TODO remove approximateSize check when method is gone
								return name[0] != '_' && name != 'approximateSize';
							})
							.every(function(name) {
								return typeof db[name] == 'function';
							});
					}

					module.exports = isLevelDOWN;
				},
				{'./abstract-leveldown': 42},
			],
			45: [
				function(require, module, exports) {
					module.exports = extend;

					var hasOwnProperty = Object.prototype.hasOwnProperty;

					function extend() {
						var target = {};

						for (var i = 0; i < arguments.length; i++) {
							var source = arguments[i];

							for (var key in source) {
								if (hasOwnProperty.call(source, key)) {
									target[key] = source[key];
								}
							}
						}

						return target;
					}
				},
				{},
			],
			46: [
				function(require, module, exports) {
					var prr = require('prr');

					function init(type, message, cause) {
						if (!!message && typeof message != 'string') {
							message = message.message || message.name;
						}
						prr(
							this,
							{
								type: type,
								name: type,
								// can be passed just a 'cause'
								cause: typeof message != 'string' ? message : cause,
								message: message,
							},
							'ewr'
						);
					}

					// generic prototype, not intended to be actually used - helpful for `instanceof`
					function CustomError(message, cause) {
						Error.call(this);
						if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
						init.call(this, 'CustomError', message, cause);
					}

					CustomError.prototype = new Error();

					function createError(errno, type, proto) {
						var err = function(message, cause) {
							init.call(this, type, message, cause);
							//TODO: the specificity here is stupid, errno should be available everywhere
							if (type == 'FilesystemError') {
								this.code = this.cause.code;
								this.path = this.cause.path;
								this.errno = this.cause.errno;
								this.message = (errno.errno[this.cause.errno] ? errno.errno[this.cause.errno].description : this.cause.message) + (this.cause.path ? ' [' + this.cause.path + ']' : '');
							}
							Error.call(this);
							if (Error.captureStackTrace) Error.captureStackTrace(this, err);
						};
						err.prototype = !!proto ? new proto() : new CustomError();
						return err;
					}

					module.exports = function(errno) {
						var ce = function(type, proto) {
							return createError(errno, type, proto);
						};
						return {
							CustomError: CustomError,
							FilesystemError: ce('FilesystemError'),
							createError: ce,
						};
					};
				},
				{prr: 69},
			],
			47: [
				function(require, module, exports) {
					var all = (module.exports.all = [
						{
							errno: -2,
							code: 'ENOENT',
							description: 'no such file or directory',
						},
						{
							errno: -1,
							code: 'UNKNOWN',
							description: 'unknown error',
						},
						{
							errno: 0,
							code: 'OK',
							description: 'success',
						},
						{
							errno: 1,
							code: 'EOF',
							description: 'end of file',
						},
						{
							errno: 2,
							code: 'EADDRINFO',
							description: 'getaddrinfo error',
						},
						{
							errno: 3,
							code: 'EACCES',
							description: 'permission denied',
						},
						{
							errno: 4,
							code: 'EAGAIN',
							description: 'resource temporarily unavailable',
						},
						{
							errno: 5,
							code: 'EADDRINUSE',
							description: 'address already in use',
						},
						{
							errno: 6,
							code: 'EADDRNOTAVAIL',
							description: 'address not available',
						},
						{
							errno: 7,
							code: 'EAFNOSUPPORT',
							description: 'address family not supported',
						},
						{
							errno: 8,
							code: 'EALREADY',
							description: 'connection already in progress',
						},
						{
							errno: 9,
							code: 'EBADF',
							description: 'bad file descriptor',
						},
						{
							errno: 10,
							code: 'EBUSY',
							description: 'resource busy or locked',
						},
						{
							errno: 11,
							code: 'ECONNABORTED',
							description: 'software caused connection abort',
						},
						{
							errno: 12,
							code: 'ECONNREFUSED',
							description: 'connection refused',
						},
						{
							errno: 13,
							code: 'ECONNRESET',
							description: 'connection reset by peer',
						},
						{
							errno: 14,
							code: 'EDESTADDRREQ',
							description: 'destination address required',
						},
						{
							errno: 15,
							code: 'EFAULT',
							description: 'bad address in system call argument',
						},
						{
							errno: 16,
							code: 'EHOSTUNREACH',
							description: 'host is unreachable',
						},
						{
							errno: 17,
							code: 'EINTR',
							description: 'interrupted system call',
						},
						{
							errno: 18,
							code: 'EINVAL',
							description: 'invalid argument',
						},
						{
							errno: 19,
							code: 'EISCONN',
							description: 'socket is already connected',
						},
						{
							errno: 20,
							code: 'EMFILE',
							description: 'too many open files',
						},
						{
							errno: 21,
							code: 'EMSGSIZE',
							description: 'message too long',
						},
						{
							errno: 22,
							code: 'ENETDOWN',
							description: 'network is down',
						},
						{
							errno: 23,
							code: 'ENETUNREACH',
							description: 'network is unreachable',
						},
						{
							errno: 24,
							code: 'ENFILE',
							description: 'file table overflow',
						},
						{
							errno: 25,
							code: 'ENOBUFS',
							description: 'no buffer space available',
						},
						{
							errno: 26,
							code: 'ENOMEM',
							description: 'not enough memory',
						},
						{
							errno: 27,
							code: 'ENOTDIR',
							description: 'not a directory',
						},
						{
							errno: 28,
							code: 'EISDIR',
							description: 'illegal operation on a directory',
						},
						{
							errno: 29,
							code: 'ENONET',
							description: 'machine is not on the network',
						},
						{
							errno: 31,
							code: 'ENOTCONN',
							description: 'socket is not connected',
						},
						{
							errno: 32,
							code: 'ENOTSOCK',
							description: 'socket operation on non-socket',
						},
						{
							errno: 33,
							code: 'ENOTSUP',
							description: 'operation not supported on socket',
						},
						{
							errno: 34,
							code: 'ENOENT',
							description: 'no such file or directory',
						},
						{
							errno: 35,
							code: 'ENOSYS',
							description: 'function not implemented',
						},
						{
							errno: 36,
							code: 'EPIPE',
							description: 'broken pipe',
						},
						{
							errno: 37,
							code: 'EPROTO',
							description: 'protocol error',
						},
						{
							errno: 38,
							code: 'EPROTONOSUPPORT',
							description: 'protocol not supported',
						},
						{
							errno: 39,
							code: 'EPROTOTYPE',
							description: 'protocol wrong type for socket',
						},
						{
							errno: 40,
							code: 'ETIMEDOUT',
							description: 'connection timed out',
						},
						{
							errno: 41,
							code: 'ECHARSET',
							description: 'invalid Unicode character',
						},
						{
							errno: 42,
							code: 'EAIFAMNOSUPPORT',
							description: 'address family for hostname not supported',
						},
						{
							errno: 44,
							code: 'EAISERVICE',
							description: 'servname not supported for ai_socktype',
						},
						{
							errno: 45,
							code: 'EAISOCKTYPE',
							description: 'ai_socktype not supported',
						},
						{
							errno: 46,
							code: 'ESHUTDOWN',
							description: 'cannot send after transport endpoint shutdown',
						},
						{
							errno: 47,
							code: 'EEXIST',
							description: 'file already exists',
						},
						{
							errno: 48,
							code: 'ESRCH',
							description: 'no such process',
						},
						{
							errno: 49,
							code: 'ENAMETOOLONG',
							description: 'name too long',
						},
						{
							errno: 50,
							code: 'EPERM',
							description: 'operation not permitted',
						},
						{
							errno: 51,
							code: 'ELOOP',
							description: 'too many symbolic links encountered',
						},
						{
							errno: 52,
							code: 'EXDEV',
							description: 'cross-device link not permitted',
						},
						{
							errno: 53,
							code: 'ENOTEMPTY',
							description: 'directory not empty',
						},
						{
							errno: 54,
							code: 'ENOSPC',
							description: 'no space left on device',
						},
						{
							errno: 55,
							code: 'EIO',
							description: 'i/o error',
						},
						{
							errno: 56,
							code: 'EROFS',
							description: 'read-only file system',
						},
						{
							errno: 57,
							code: 'ENODEV',
							description: 'no such device',
						},
						{
							errno: 58,
							code: 'ESPIPE',
							description: 'invalid seek',
						},
						{
							errno: 59,
							code: 'ECANCELED',
							description: 'operation canceled',
						},
					]);

					module.exports.errno = {};
					module.exports.code = {};

					all.forEach(function(error) {
						module.exports.errno[error.errno] = error;
						module.exports.code[error.code] = error;
					});

					module.exports.custom = require('./custom')(module.exports);
					module.exports.create = module.exports.custom.createError;
				},
				{'./custom': 46},
			],
			48: [
				function(require, module, exports) {
					/*global window:false, self:false, define:false, module:false */

					/**
					 * @license IDBWrapper - A cross-browser wrapper for IndexedDB
					 * Version 1.7.2
					 * Copyright (c) 2011 - 2017 Jens Arps
					 * http://jensarps.de/
					 *
					 * Licensed under the MIT license
					 */

					(function(name, definition, global) {
						'use strict';

						if (typeof define === 'function') {
							define(definition);
						} else if (typeof module !== 'undefined' && module.exports) {
							module.exports = definition();
						} else {
							global[name] = definition();
						}
					})(
						'IDBStore',
						function() {
							'use strict';

							var defaultErrorHandler = function(error) {
								throw error;
							};
							var defaultSuccessHandler = function() {};

							var defaults = {
								storeName: 'Store',
								storePrefix: 'IDBWrapper-',
								dbVersion: 1,
								keyPath: 'id',
								autoIncrement: true,
								onStoreReady: function() {},
								onError: defaultErrorHandler,
								indexes: [],
								implementationPreference: ['indexedDB', 'webkitIndexedDB', 'mozIndexedDB', 'shimIndexedDB'],
							};

							/**
     *
     * The IDBStore constructor
     *
     * @constructor
     * @name IDBStore
     * @version 1.7.2
     *
     * @param {Object} [kwArgs] An options object used to configure the store and
     *  set callbacks
     * @param {String} [kwArgs.storeName='Store'] The name of the store
     * @param {String} [kwArgs.storePrefix='IDBWrapper-'] A prefix that is
     *  internally used to construct the name of the database, which will be
     *  kwArgs.storePrefix + kwArgs.storeName
     * @param {Number} [kwArgs.dbVersion=1] The version of the store
     * @param {String} [kwArgs.keyPath='id'] The key path to use. If you want to
     *  setup IDBWrapper to work with out-of-line keys, you need to set this to
     *  `null`
     * @param {Boolean} [kwArgs.autoIncrement=true] If set to true, IDBStore will
     *  automatically make sure a unique keyPath value is present on each object
     *  that is stored.
     * @param {Function} [kwArgs.onStoreReady] A callback to be called when the
     *  store is ready to be used.
     * @param {Function} [kwArgs.onError=throw] A callback to be called when an
     *  error occurred during instantiation of the store.
     * @param {Array} [kwArgs.indexes=[]] An array of indexData objects
     *  defining the indexes to use with the store. For every index to be used
     *  one indexData object needs to be passed in the array.
     *  An indexData object is defined as follows:
     * @param {Object} [kwArgs.indexes.indexData] An object defining the index to
     *  use
     * @param {String} kwArgs.indexes.indexData.name The name of the index
     * @param {String} [kwArgs.indexes.indexData.keyPath] The key path of the index
     * @param {Boolean} [kwArgs.indexes.indexData.unique] Whether the index is unique
     * @param {Boolean} [kwArgs.indexes.indexData.multiEntry] Whether the index is multi entry
     * @param {Array} [kwArgs.implementationPreference=['indexedDB','webkitIndexedDB','mozIndexedDB','shimIndexedDB']] An array of strings naming implementations to be used, in order or preference
     * @param {Function} [onStoreReady] A callback to be called when the store
     * is ready to be used.
     * @example
     // create a store for customers with an additional index over the
     // `lastname` property.
     var myCustomerStore = new IDBStore({
         dbVersion: 1,
         storeName: 'customer-index',
         keyPath: 'customerid',
         autoIncrement: true,
         onStoreReady: populateTable,
         indexes: [
             { name: 'lastname', keyPath: 'lastname', unique: false, multiEntry: false }
         ]
     });
     * @example
     // create a generic store
     var myCustomerStore = new IDBStore({
         storeName: 'my-data-store',
         onStoreReady: function(){
             // start working with the store.
         }
     });
     */
							var IDBStore = function(kwArgs, onStoreReady) {
								if (typeof onStoreReady == 'undefined' && typeof kwArgs == 'function') {
									onStoreReady = kwArgs;
								}
								if (Object.prototype.toString.call(kwArgs) != '[object Object]') {
									kwArgs = {};
								}

								for (var key in defaults) {
									this[key] = typeof kwArgs[key] != 'undefined' ? kwArgs[key] : defaults[key];
								}

								this.dbName = this.storePrefix + this.storeName;
								this.dbVersion = parseInt(this.dbVersion, 10) || 1;

								onStoreReady && (this.onStoreReady = onStoreReady);

								var env = typeof window == 'object' ? window : self;
								var availableImplementations = this.implementationPreference.filter(function(implName) {
									return implName in env;
								});
								this.implementation = availableImplementations[0];
								this.idb = env[this.implementation];
								this.keyRange = env.IDBKeyRange || env.webkitIDBKeyRange || env.mozIDBKeyRange;

								this.consts = {
									READ_ONLY: 'readonly',
									READ_WRITE: 'readwrite',
									VERSION_CHANGE: 'versionchange',
									NEXT: 'next',
									NEXT_NO_DUPLICATE: 'nextunique',
									PREV: 'prev',
									PREV_NO_DUPLICATE: 'prevunique',
								};

								this.openDB();
							};

							/** @lends IDBStore.prototype */
							var proto = {
								/**
								 * A pointer to the IDBStore ctor
								 *
								 * @private
								 * @type {Function}
								 * @constructs
								 */
								constructor: IDBStore,

								/**
								 * The version of IDBStore
								 *
								 * @type {String}
								 */
								version: '1.7.2',

								/**
								 * A reference to the IndexedDB object
								 *
								 * @type {IDBDatabase}
								 */
								db: null,

								/**
								 * The full name of the IndexedDB used by IDBStore, composed of
								 * this.storePrefix + this.storeName
								 *
								 * @type {String}
								 */
								dbName: null,

								/**
								 * The version of the IndexedDB used by IDBStore
								 *
								 * @type {Number}
								 */
								dbVersion: null,

								/**
								 * A reference to the objectStore used by IDBStore
								 *
								 * @type {IDBObjectStore}
								 */
								store: null,

								/**
								 * The store name
								 *
								 * @type {String}
								 */
								storeName: null,

								/**
								 * The prefix to prepend to the store name
								 *
								 * @type {String}
								 */
								storePrefix: null,

								/**
								 * The key path
								 *
								 * @type {String}
								 */
								keyPath: null,

								/**
								 * Whether IDBStore uses autoIncrement
								 *
								 * @type {Boolean}
								 */
								autoIncrement: null,

								/**
								 * The indexes used by IDBStore
								 *
								 * @type {Array}
								 */
								indexes: null,

								/**
								 * The implemantations to try to use, in order of preference
								 *
								 * @type {Array}
								 */
								implementationPreference: null,

								/**
								 * The actual implementation being used
								 *
								 * @type {String}
								 */
								implementation: '',

								/**
								 * The callback to be called when the store is ready to be used
								 *
								 * @type {Function}
								 */
								onStoreReady: null,

								/**
								 * The callback to be called if an error occurred during instantiation
								 * of the store
								 *
								 * @type {Function}
								 */
								onError: null,

								/**
								 * The internal insertID counter
								 *
								 * @type {Number}
								 * @private
								 */
								_insertIdCount: 0,

								/**
								 * Opens an IndexedDB; called by the constructor.
								 *
								 * Will check if versions match and compare provided index configuration
								 * with existing ones, and update indexes if necessary.
								 *
								 * Will call this.onStoreReady() if everything went well and the store
								 * is ready to use, and this.onError() is something went wrong.
								 *
								 * @private
								 *
								 */
								openDB: function() {
									var openRequest = this.idb.open(this.dbName, this.dbVersion);
									var preventSuccessCallback = false;

									openRequest.onerror = function(errorEvent) {
										if (hasVersionError(errorEvent)) {
											this.onError(new Error('The version number provided is lower than the existing one.'));
										} else {
											var error;

											if (errorEvent.target.error) {
												error = errorEvent.target.error;
											} else {
												var errorMessage = 'IndexedDB unknown error occurred when opening DB ' + this.dbName + ' version ' + this.dbVersion;
												if ('errorCode' in errorEvent.target) {
													errorMessage += ' with error code ' + errorEvent.target.errorCode;
												}
												error = new Error(errorMessage);
											}

											this.onError(error);
										}
									}.bind(this);

									openRequest.onsuccess = function(event) {
										if (preventSuccessCallback) {
											return;
										}

										if (this.db) {
											this.onStoreReady();
											return;
										}

										this.db = event.target.result;

										if (typeof this.db.version == 'string') {
											this.onError(new Error('The IndexedDB implementation in this browser is outdated. Please upgrade your browser.'));
											return;
										}

										if (!this.db.objectStoreNames.contains(this.storeName)) {
											// We should never ever get here.
											// Lets notify the user anyway.
											this.onError(new Error("Object store couldn't be created."));
											return;
										}

										var emptyTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
										this.store = emptyTransaction.objectStore(this.storeName);

										// check indexes
										var existingIndexes = Array.prototype.slice.call(this.getIndexList());
										this.indexes.forEach(function(indexData) {
											var indexName = indexData.name;

											if (!indexName) {
												preventSuccessCallback = true;
												this.onError(new Error('Cannot create index: No index name given.'));
												return;
											}

											this.normalizeIndexData(indexData);

											if (this.hasIndex(indexName)) {
												// check if it complies
												var actualIndex = this.store.index(indexName);
												var complies = this.indexComplies(actualIndex, indexData);
												if (!complies) {
													preventSuccessCallback = true;
													this.onError(new Error('Cannot modify index "' + indexName + '" for current version. Please bump version number to ' + (this.dbVersion + 1) + '.'));
												}

												existingIndexes.splice(existingIndexes.indexOf(indexName), 1);
											} else {
												preventSuccessCallback = true;
												this.onError(new Error('Cannot create new index "' + indexName + '" for current version. Please bump version number to ' + (this.dbVersion + 1) + '.'));
											}
										}, this);

										if (existingIndexes.length) {
											preventSuccessCallback = true;
											this.onError(new Error('Cannot delete index(es) "' + existingIndexes.toString() + '" for current version. Please bump version number to ' + (this.dbVersion + 1) + '.'));
										}

										preventSuccessCallback || this.onStoreReady();
									}.bind(this);

									openRequest.onupgradeneeded = function(/* IDBVersionChangeEvent */ event) {
										this.db = event.target.result;

										if (this.db.objectStoreNames.contains(this.storeName)) {
											this.store = event.target.transaction.objectStore(this.storeName);
										} else {
											var optionalParameters = {autoIncrement: this.autoIncrement};
											if (this.keyPath !== null) {
												optionalParameters.keyPath = this.keyPath;
											}
											this.store = this.db.createObjectStore(this.storeName, optionalParameters);
										}

										var existingIndexes = Array.prototype.slice.call(this.getIndexList());
										this.indexes.forEach(function(indexData) {
											var indexName = indexData.name;

											if (!indexName) {
												preventSuccessCallback = true;
												this.onError(new Error('Cannot create index: No index name given.'));
											}

											this.normalizeIndexData(indexData);

											if (this.hasIndex(indexName)) {
												// check if it complies
												var actualIndex = this.store.index(indexName);
												var complies = this.indexComplies(actualIndex, indexData);
												if (!complies) {
													// index differs, need to delete and re-create
													this.store.deleteIndex(indexName);
													this.store.createIndex(indexName, indexData.keyPath, {
														unique: indexData.unique,
														multiEntry: indexData.multiEntry,
													});
												}

												existingIndexes.splice(existingIndexes.indexOf(indexName), 1);
											} else {
												this.store.createIndex(indexName, indexData.keyPath, {
													unique: indexData.unique,
													multiEntry: indexData.multiEntry,
												});
											}
										}, this);

										if (existingIndexes.length) {
											existingIndexes.forEach(function(_indexName) {
												this.store.deleteIndex(_indexName);
											}, this);
										}
									}.bind(this);
								},

								/**
								 * Deletes the database used for this store if the IDB implementations
								 * provides that functionality.
								 *
								 * @param {Function} [onSuccess] A callback that is called if deletion
								 *  was successful.
								 * @param {Function} [onError] A callback that is called if deletion
								 *  failed.
								 */
								deleteDatabase: function(onSuccess, onError) {
									if (this.idb.deleteDatabase) {
										this.db.close();
										var deleteRequest = this.idb.deleteDatabase(this.dbName);
										deleteRequest.onsuccess = onSuccess;
										deleteRequest.onerror = onError;
									} else {
										onError(new Error('Browser does not support IndexedDB deleteDatabase!'));
									}
								},

								/*********************
								 * data manipulation *
								 *********************/

								/**
         * Puts an object into the store. If an entry with the given id exists,
         * it will be overwritten. This method has a different signature for inline
         * keys and out-of-line keys; please see the examples below.
         *
         * @param {*} [key] The key to store. This is only needed if IDBWrapper
         *  is set to use out-of-line keys. For inline keys - the default scenario -
         *  this can be omitted.
         * @param {Object} value The data object to store.
         * @param {Function} [onSuccess] A callback that is called if insertion
         *  was successful.
         * @param {Function} [onError] A callback that is called if insertion
         *  failed.
         * @returns {IDBTransaction} The transaction used for this operation.
         * @example
         // Storing an object, using inline keys (the default scenario):
         var myCustomer = {
             customerid: 2346223,
             lastname: 'Doe',
             firstname: 'John'
         };
         myCustomerStore.put(myCustomer, mySuccessHandler, myErrorHandler);
         // Note that passing success- and error-handlers is optional.
         * @example
         // Storing an object, using out-of-line keys:
         var myCustomer = {
             lastname: 'Doe',
             firstname: 'John'
         };
         myCustomerStore.put(2346223, myCustomer, mySuccessHandler, myErrorHandler);
         // Note that passing success- and error-handlers is optional.
         */
								put: function(key, value, onSuccess, onError) {
									if (this.keyPath !== null) {
										onError = onSuccess;
										onSuccess = value;
										value = key;
									}
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);

									var hasSuccess = false,
										result = null,
										putRequest;

									var putTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
									putTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									putTransaction.onabort = onError;
									putTransaction.onerror = onError;

									if (this.keyPath !== null) {
										// in-line keys
										this._addIdPropertyIfNeeded(value);
										putRequest = putTransaction.objectStore(this.storeName).put(value);
									} else {
										// out-of-line keys
										putRequest = putTransaction.objectStore(this.storeName).put(value, key);
									}
									putRequest.onsuccess = function(event) {
										hasSuccess = true;
										result = event.target.result;
									};
									putRequest.onerror = onError;

									return putTransaction;
								},

								/**
								 * Retrieves an object from the store. If no entry exists with the given id,
								 * the success handler will be called with null as first and only argument.
								 *
								 * @param {*} key The id of the object to fetch.
								 * @param {Function} [onSuccess] A callback that is called if fetching
								 *  was successful. Will receive the object as only argument.
								 * @param {Function} [onError] A callback that will be called if an error
								 *  occurred during the operation.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								get: function(key, onSuccess, onError) {
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);

									var hasSuccess = false,
										result = null;

									var getTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
									getTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									getTransaction.onabort = onError;
									getTransaction.onerror = onError;
									var getRequest = getTransaction.objectStore(this.storeName).get(key);
									getRequest.onsuccess = function(event) {
										hasSuccess = true;
										result = event.target.result;
									};
									getRequest.onerror = onError;

									return getTransaction;
								},

								/**
								 * Removes an object from the store.
								 *
								 * @param {*} key The id of the object to remove.
								 * @param {Function} [onSuccess] A callback that is called if the removal
								 *  was successful.
								 * @param {Function} [onError] A callback that will be called if an error
								 *  occurred during the operation.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								remove: function(key, onSuccess, onError) {
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);

									var hasSuccess = false,
										result = null;

									var removeTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
									removeTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									removeTransaction.onabort = onError;
									removeTransaction.onerror = onError;

									var deleteRequest = removeTransaction.objectStore(this.storeName)['delete'](key);
									deleteRequest.onsuccess = function(event) {
										hasSuccess = true;
										result = event.target.result;
									};
									deleteRequest.onerror = onError;

									return removeTransaction;
								},

								/**
								 * Runs a batch of put and/or remove operations on the store.
								 *
								 * @param {Array} dataArray An array of objects containing the operation to run
								 *  and the data object (for put operations).
								 * @param {Function} [onSuccess] A callback that is called if all operations
								 *  were successful.
								 * @param {Function} [onError] A callback that is called if an error
								 *  occurred during one of the operations.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								batch: function(dataArray, onSuccess, onError) {
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);

									if (Object.prototype.toString.call(dataArray) != '[object Array]') {
										onError(new Error('dataArray argument must be of type Array.'));
									} else if (dataArray.length === 0) {
										return onSuccess(true);
									}

									var count = dataArray.length;
									var called = false;
									var hasSuccess = false;

									var batchTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
									batchTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(hasSuccess);
									};
									batchTransaction.onabort = onError;
									batchTransaction.onerror = onError;

									var onItemSuccess = function() {
										count--;
										if (count === 0 && !called) {
											called = true;
											hasSuccess = true;
										}
									};

									dataArray.forEach(function(operation) {
										var type = operation.type;
										var key = operation.key;
										var value = operation.value;

										var onItemError = function(err) {
											batchTransaction.abort();
											if (!called) {
												called = true;
												onError(err, type, key);
											}
										};

										if (type == 'remove') {
											var deleteRequest = batchTransaction.objectStore(this.storeName)['delete'](key);
											deleteRequest.onsuccess = onItemSuccess;
											deleteRequest.onerror = onItemError;
										} else if (type == 'put') {
											var putRequest;
											if (this.keyPath !== null) {
												// in-line keys
												this._addIdPropertyIfNeeded(value);
												putRequest = batchTransaction.objectStore(this.storeName).put(value);
											} else {
												// out-of-line keys
												putRequest = batchTransaction.objectStore(this.storeName).put(value, key);
											}
											putRequest.onsuccess = onItemSuccess;
											putRequest.onerror = onItemError;
										}
									}, this);

									return batchTransaction;
								},

								/**
								 * Takes an array of objects and stores them in a single transaction.
								 *
								 * @param {Array} dataArray An array of objects to store
								 * @param {Function} [onSuccess] A callback that is called if all operations
								 *  were successful.
								 * @param {Function} [onError] A callback that is called if an error
								 *  occurred during one of the operations.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								putBatch: function(dataArray, onSuccess, onError) {
									var batchData = dataArray.map(function(item) {
										return {type: 'put', value: item};
									});

									return this.batch(batchData, onSuccess, onError);
								},

								/**
								 * Like putBatch, takes an array of objects and stores them in a single
								 * transaction, but allows processing of the result values.  Returns the
								 * processed records containing the key for newly created records to the
								 * onSuccess calllback instead of only returning true or false for success.
								 * In addition, added the option for the caller to specify a key field that
								 * should be set to the newly created key.
								 *
								 * @param {Array} dataArray An array of objects to store
								 * @param {Object} [options] An object containing optional options
								 * @param {String} [options.keyField=this.keyPath] Specifies a field in the record to update
								 *  with the auto-incrementing key. Defaults to the store's keyPath.
								 * @param {Function} [onSuccess] A callback that is called if all operations
								 *  were successful.
								 * @param {Function} [onError] A callback that is called if an error
								 *  occurred during one of the operations.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 *
								 */
								upsertBatch: function(dataArray, options, onSuccess, onError) {
									// handle `dataArray, onSuccess, onError` signature
									if (typeof options == 'function') {
										onSuccess = options;
										onError = onSuccess;
										options = {};
									}

									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);
									options || (options = {});

									if (Object.prototype.toString.call(dataArray) != '[object Array]') {
										onError(new Error('dataArray argument must be of type Array.'));
									}

									var keyField = options.keyField || this.keyPath;
									var count = dataArray.length;
									var called = false;
									var hasSuccess = false;
									var index = 0; // assume success callbacks are executed in order

									var batchTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
									batchTransaction.oncomplete = function() {
										if (hasSuccess) {
											onSuccess(dataArray);
										} else {
											onError(false);
										}
									};
									batchTransaction.onabort = onError;
									batchTransaction.onerror = onError;

									var onItemSuccess = function(event) {
										var record = dataArray[index++];
										record[keyField] = event.target.result;

										count--;
										if (count === 0 && !called) {
											called = true;
											hasSuccess = true;
										}
									};

									dataArray.forEach(function(record) {
										var key = record.key;

										var onItemError = function(err) {
											batchTransaction.abort();
											if (!called) {
												called = true;
												onError(err);
											}
										};

										var putRequest;
										if (this.keyPath !== null) {
											// in-line keys
											this._addIdPropertyIfNeeded(record);
											putRequest = batchTransaction.objectStore(this.storeName).put(record);
										} else {
											// out-of-line keys
											putRequest = batchTransaction.objectStore(this.storeName).put(record, key);
										}
										putRequest.onsuccess = onItemSuccess;
										putRequest.onerror = onItemError;
									}, this);

									return batchTransaction;
								},

								/**
								 * Takes an array of keys and removes matching objects in a single
								 * transaction.
								 *
								 * @param {Array} keyArray An array of keys to remove
								 * @param {Function} [onSuccess] A callback that is called if all operations
								 *  were successful.
								 * @param {Function} [onError] A callback that is called if an error
								 *  occurred during one of the operations.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								removeBatch: function(keyArray, onSuccess, onError) {
									var batchData = keyArray.map(function(key) {
										return {type: 'remove', key: key};
									});

									return this.batch(batchData, onSuccess, onError);
								},

								/**
         * Takes an array of keys and fetches matching objects
         *
         * @param {Array} keyArray An array of keys identifying the objects to fetch
         * @param {Function} [onSuccess] A callback that is called if all operations
         *  were successful.
         * @param {Function} [onError] A callback that is called if an error
         *  occurred during one of the operations.
         * @param {String} [arrayType='sparse'] The type of array to pass to the
         *  success handler. May be one of 'sparse', 'dense' or 'skip'. Defaults to
         *  'sparse'. This parameter specifies how to handle the situation if a get
         *  operation did not throw an error, but there was no matching object in
         *  the database. In most cases, 'sparse' provides the most desired
         *  behavior. See the examples for details.
         * @returns {IDBTransaction} The transaction used for this operation.
         * @example
         // given that there are two objects in the database with the keypath
         // values 1 and 2, and the call looks like this:
         myStore.getBatch([1, 5, 2], onError, function (data) { … }, arrayType);

         // this is what the `data` array will be like:

         // arrayType == 'sparse':
         // data is a sparse array containing two entries and having a length of 3:
         [Object, 2: Object]
         0: Object
         2: Object
         length: 3
         // calling forEach on data will result in the callback being called two
         // times, with the index parameter matching the index of the key in the
         // keyArray.

         // arrayType == 'dense':
         // data is a dense array containing three entries and having a length of 3,
         // where data[1] is of type undefined:
         [Object, undefined, Object]
         0: Object
         1: undefined
         2: Object
         length: 3
         // calling forEach on data will result in the callback being called three
         // times, with the index parameter matching the index of the key in the
         // keyArray, but the second call will have undefined as first argument.

         // arrayType == 'skip':
         // data is a dense array containing two entries and having a length of 2:
         [Object, Object]
         0: Object
         1: Object
         length: 2
         // calling forEach on data will result in the callback being called two
         // times, with the index parameter not matching the index of the key in the
         // keyArray.
         */
								getBatch: function(keyArray, onSuccess, onError, arrayType) {
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);
									arrayType || (arrayType = 'sparse');

									if (Object.prototype.toString.call(keyArray) != '[object Array]') {
										onError(new Error('keyArray argument must be of type Array.'));
									} else if (keyArray.length === 0) {
										return onSuccess([]);
									}

									var data = [];
									var count = keyArray.length;
									var called = false;
									var hasSuccess = false;
									var result = null;

									var batchTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
									batchTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									batchTransaction.onabort = onError;
									batchTransaction.onerror = onError;

									var onItemSuccess = function(event) {
										if (event.target.result || arrayType == 'dense') {
											data.push(event.target.result);
										} else if (arrayType == 'sparse') {
											data.length++;
										}
										count--;
										if (count === 0) {
											called = true;
											hasSuccess = true;
											result = data;
										}
									};

									keyArray.forEach(function(key) {
										var onItemError = function(err) {
											called = true;
											result = err;
											onError(err);
											batchTransaction.abort();
										};

										var getRequest = batchTransaction.objectStore(this.storeName).get(key);
										getRequest.onsuccess = onItemSuccess;
										getRequest.onerror = onItemError;
									}, this);

									return batchTransaction;
								},

								/**
								 * Fetches all entries in the store.
								 *
								 * @param {Function} [onSuccess] A callback that is called if the operation
								 *  was successful. Will receive an array of objects.
								 * @param {Function} [onError] A callback that will be called if an error
								 *  occurred during the operation.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								getAll: function(onSuccess, onError) {
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);
									var getAllTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
									var store = getAllTransaction.objectStore(this.storeName);
									if (store.getAll) {
										this._getAllNative(getAllTransaction, store, onSuccess, onError);
									} else {
										this._getAllCursor(getAllTransaction, store, onSuccess, onError);
									}

									return getAllTransaction;
								},

								/**
								 * Implements getAll for IDB implementations that have a non-standard
								 * getAll() method.
								 *
								 * @param {IDBTransaction} getAllTransaction An open READ transaction.
								 * @param {IDBObjectStore} store A reference to the store.
								 * @param {Function} onSuccess A callback that will be called if the
								 *  operation was successful.
								 * @param {Function} onError A callback that will be called if an
								 *  error occurred during the operation.
								 * @private
								 */
								_getAllNative: function(getAllTransaction, store, onSuccess, onError) {
									var hasSuccess = false,
										result = null;

									getAllTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									getAllTransaction.onabort = onError;
									getAllTransaction.onerror = onError;

									var getAllRequest = store.getAll();
									getAllRequest.onsuccess = function(event) {
										hasSuccess = true;
										result = event.target.result;
									};
									getAllRequest.onerror = onError;
								},

								/**
								 * Implements getAll for IDB implementations that do not have a getAll()
								 * method.
								 *
								 * @param {IDBTransaction} getAllTransaction An open READ transaction.
								 * @param {IDBObjectStore} store A reference to the store.
								 * @param {Function} onSuccess A callback that will be called if the
								 *  operation was successful.
								 * @param {Function} onError A callback that will be called if an
								 *  error occurred during the operation.
								 * @private
								 */
								_getAllCursor: function(getAllTransaction, store, onSuccess, onError) {
									var all = [],
										hasSuccess = false,
										result = null;

									getAllTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									getAllTransaction.onabort = onError;
									getAllTransaction.onerror = onError;

									var cursorRequest = store.openCursor();
									cursorRequest.onsuccess = function(event) {
										var cursor = event.target.result;
										if (cursor) {
											all.push(cursor.value);
											cursor['continue']();
										} else {
											hasSuccess = true;
											result = all;
										}
									};
									cursorRequest.onError = onError;
								},

								/**
								 * Clears the store, i.e. deletes all entries in the store.
								 *
								 * @param {Function} [onSuccess] A callback that will be called if the
								 *  operation was successful.
								 * @param {Function} [onError] A callback that will be called if an
								 *  error occurred during the operation.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								clear: function(onSuccess, onError) {
									onError || (onError = defaultErrorHandler);
									onSuccess || (onSuccess = defaultSuccessHandler);

									var hasSuccess = false,
										result = null;

									var clearTransaction = this.db.transaction([this.storeName], this.consts.READ_WRITE);
									clearTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									clearTransaction.onabort = onError;
									clearTransaction.onerror = onError;

									var clearRequest = clearTransaction.objectStore(this.storeName).clear();
									clearRequest.onsuccess = function(event) {
										hasSuccess = true;
										result = event.target.result;
									};
									clearRequest.onerror = onError;

									return clearTransaction;
								},

								/**
								 * Checks if an id property needs to present on a object and adds one if
								 * necessary.
								 *
								 * @param {Object} dataObj The data object that is about to be stored
								 * @private
								 */
								_addIdPropertyIfNeeded: function(dataObj) {
									if (typeof dataObj[this.keyPath] == 'undefined') {
										dataObj[this.keyPath] = this._insertIdCount++ + Date.now();
									}
								},

								/************
								 * indexing *
								 ************/

								/**
								 * Returns a DOMStringList of index names of the store.
								 *
								 * @return {DOMStringList} The list of index names
								 */
								getIndexList: function() {
									return this.store.indexNames;
								},

								/**
								 * Checks if an index with the given name exists in the store.
								 *
								 * @param {String} indexName The name of the index to look for
								 * @return {Boolean} Whether the store contains an index with the given name
								 */
								hasIndex: function(indexName) {
									return this.store.indexNames.contains(indexName);
								},

								/**
								 * Normalizes an object containing index data and assures that all
								 * properties are set.
								 *
								 * @param {Object} indexData The index data object to normalize
								 * @param {String} indexData.name The name of the index
								 * @param {String} [indexData.keyPath] The key path of the index
								 * @param {Boolean} [indexData.unique] Whether the index is unique
								 * @param {Boolean} [indexData.multiEntry] Whether the index is multi entry
								 */
								normalizeIndexData: function(indexData) {
									indexData.keyPath = indexData.keyPath || indexData.name;
									indexData.unique = !!indexData.unique;
									indexData.multiEntry = !!indexData.multiEntry;
								},

								/**
								 * Checks if an actual index complies with an expected index.
								 *
								 * @param {IDBIndex} actual The actual index found in the store
								 * @param {Object} expected An Object describing an expected index
								 * @return {Boolean} Whether both index definitions are identical
								 */
								indexComplies: function(actual, expected) {
									var complies = ['keyPath', 'unique', 'multiEntry'].every(function(key) {
										// IE10 returns undefined for no multiEntry
										if (key == 'multiEntry' && actual[key] === undefined && expected[key] === false) {
											return true;
										}
										// Compound keys
										if (key == 'keyPath' && Object.prototype.toString.call(expected[key]) == '[object Array]') {
											var exp = expected.keyPath;
											var act = actual.keyPath;

											// IE10 can't handle keyPath sequences and stores them as a string.
											// The index will be unusable there, but let's still return true if
											// the keyPath sequence matches.
											if (typeof act == 'string') {
												return exp.toString() == act;
											}

											// Chrome/Opera stores keyPath squences as DOMStringList, Firefox
											// as Array
											if (!(typeof act.contains == 'function' || typeof act.indexOf == 'function')) {
												return false;
											}

											if (act.length !== exp.length) {
												return false;
											}

											for (var i = 0, m = exp.length; i < m; i++) {
												if (!((act.contains && act.contains(exp[i])) || act.indexOf(exp[i] !== -1))) {
													return false;
												}
											}
											return true;
										}
										return expected[key] == actual[key];
									});
									return complies;
								},

								/**********
								 * cursor *
								 **********/

								/**
								 * Iterates over the store using the given options and calling onItem
								 * for each entry matching the options.
								 *
								 * @param {Function} onItem A callback to be called for each match
								 * @param {Object} [options] An object defining specific options
								 * @param {String} [options.index=null] A name of an IDBIndex to operate on
								 * @param {String} [options.order=ASC] The order in which to provide the
								 *  results, can be 'DESC' or 'ASC'
								 * @param {Boolean} [options.autoContinue=true] Whether to automatically
								 *  iterate the cursor to the next result
								 * @param {Boolean} [options.filterDuplicates=false] Whether to exclude
								 *  duplicate matches
								 * @param {IDBKeyRange} [options.keyRange=null] An IDBKeyRange to use
								 * @param {Boolean} [options.writeAccess=false] Whether grant write access
								 *  to the store in the onItem callback
								 * @param {Function} [options.onEnd=null] A callback to be called after
								 *  iteration has ended
								 * @param {Function} [options.onError=throw] A callback to be called
								 *  if an error occurred during the operation.
								 * @param {Number} [options.limit=Infinity] Limit the number of returned
								 *  results to this number
								 * @param {Number} [options.offset=0] Skip the provided number of results
								 *  in the resultset
								 * @param {Boolean} [options.allowItemRejection=false] Allows the onItem
								 * function to return a Boolean to accept or reject the current item
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								iterate: function(onItem, options) {
									options = mixin(
										{
											index: null,
											order: 'ASC',
											autoContinue: true,
											filterDuplicates: false,
											keyRange: null,
											writeAccess: false,
											onEnd: null,
											onError: defaultErrorHandler,
											limit: Infinity,
											offset: 0,
											allowItemRejection: false,
										},
										options || {}
									);

									var directionType = options.order.toLowerCase() == 'desc' ? 'PREV' : 'NEXT';
									if (options.filterDuplicates) {
										directionType += '_NO_DUPLICATE';
									}

									var hasSuccess = false;
									var cursorTransaction = this.db.transaction([this.storeName], this.consts[options.writeAccess ? 'READ_WRITE' : 'READ_ONLY']);
									var cursorTarget = cursorTransaction.objectStore(this.storeName);
									if (options.index) {
										cursorTarget = cursorTarget.index(options.index);
									}
									var recordCount = 0;

									cursorTransaction.oncomplete = function() {
										if (!hasSuccess) {
											options.onError(null);
											return;
										}
										if (options.onEnd) {
											options.onEnd();
										} else {
											onItem(null);
										}
									};
									cursorTransaction.onabort = options.onError;
									cursorTransaction.onerror = options.onError;

									var cursorRequest = cursorTarget.openCursor(options.keyRange, this.consts[directionType]);
									cursorRequest.onerror = options.onError;
									cursorRequest.onsuccess = function(event) {
										var cursor = event.target.result;
										if (cursor) {
											if (options.offset) {
												cursor.advance(options.offset);
												options.offset = 0;
											} else {
												var onItemReturn = onItem(cursor.value, cursor, cursorTransaction);
												if (!options.allowItemRejection || onItemReturn !== false) {
													recordCount++;
												}
												if (options.autoContinue) {
													if (recordCount + options.offset < options.limit) {
														cursor['continue']();
													} else {
														hasSuccess = true;
													}
												}
											}
										} else {
											hasSuccess = true;
										}
									};

									return cursorTransaction;
								},

								/**
								 * Runs a query against the store and passes an array containing matched
								 * objects to the success handler.
								 *
								 * @param {Function} onSuccess A callback to be called when the operation
								 *  was successful.
								 * @param {Object} [options] An object defining specific options
								 * @param {String} [options.index=null] A name of an IDBIndex to operate on
								 * @param {String} [options.order=ASC] The order in which to provide the
								 *  results, can be 'DESC' or 'ASC'
								 * @param {Boolean} [options.filterDuplicates=false] Whether to exclude
								 *  duplicate matches
								 * @param {IDBKeyRange} [options.keyRange=null] An IDBKeyRange to use
								 * @param {Function} [options.onError=throw] A callback to be called
								 *  if an error occurred during the operation.
								 * @param {Number} [options.limit=Infinity] Limit the number of returned
								 *  results to this number
								 * @param {Number} [options.offset=0] Skip the provided number of results
								 *  in the resultset
								 * @param {Function} [options.filter=null] A custom filter function to
								 *  apply to query resuts before returning. Must return `false` to reject
								 *  an item. Can be combined with keyRanges.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								query: function(onSuccess, options) {
									var result = [],
										processedItems = 0;
									options = options || {};
									options.autoContinue = true;
									options.writeAccess = false;
									options.allowItemRejection = !!options.filter;
									options.onEnd = function() {
										onSuccess(result, processedItems);
									};
									return this.iterate(function(item) {
										processedItems++;
										var accept = options.filter ? options.filter(item) : true;
										if (accept !== false) {
											result.push(item);
										}
										return accept;
									}, options);
								},

								/**
								 *
								 * Runs a query against the store, but only returns the number of matches
								 * instead of the matches itself.
								 *
								 * @param {Function} onSuccess A callback to be called if the opration
								 *  was successful.
								 * @param {Object} [options] An object defining specific options
								 * @param {String} [options.index=null] A name of an IDBIndex to operate on
								 * @param {IDBKeyRange} [options.keyRange=null] An IDBKeyRange to use
								 * @param {Function} [options.onError=throw] A callback to be called if an error
								 *  occurred during the operation.
								 * @returns {IDBTransaction} The transaction used for this operation.
								 */
								count: function(onSuccess, options) {
									options = mixin(
										{
											index: null,
											keyRange: null,
										},
										options || {}
									);

									var onError = options.onError || defaultErrorHandler;

									var hasSuccess = false,
										result = null;

									var cursorTransaction = this.db.transaction([this.storeName], this.consts.READ_ONLY);
									cursorTransaction.oncomplete = function() {
										var callback = hasSuccess ? onSuccess : onError;
										callback(result);
									};
									cursorTransaction.onabort = onError;
									cursorTransaction.onerror = onError;

									var cursorTarget = cursorTransaction.objectStore(this.storeName);
									if (options.index) {
										cursorTarget = cursorTarget.index(options.index);
									}
									var countRequest = cursorTarget.count(options.keyRange);
									countRequest.onsuccess = function(evt) {
										hasSuccess = true;
										result = evt.target.result;
									};
									countRequest.onError = onError;

									return cursorTransaction;
								},

								/**************/
								/* key ranges */
								/**************/

								/**
								 * Creates a key range using specified options. This key range can be
								 * handed over to the count() and iterate() methods.
								 *
								 * Note: You must provide at least one or both of "lower" or "upper" value.
								 *
								 * @param {Object} options The options for the key range to create
								 * @param {*} [options.lower] The lower bound
								 * @param {Boolean} [options.excludeLower] Whether to exclude the lower
								 *  bound passed in options.lower from the key range
								 * @param {*} [options.upper] The upper bound
								 * @param {Boolean} [options.excludeUpper] Whether to exclude the upper
								 *  bound passed in options.upper from the key range
								 * @param {*} [options.only] A single key value. Use this if you need a key
								 *  range that only includes one value for a key. Providing this
								 *  property invalidates all other properties.
								 * @return {IDBKeyRange} The IDBKeyRange representing the specified options
								 */
								makeKeyRange: function(options) {
									/*jshint onecase:true */
									var keyRange,
										hasLower = typeof options.lower != 'undefined',
										hasUpper = typeof options.upper != 'undefined',
										isOnly = typeof options.only != 'undefined';

									switch (true) {
										case isOnly:
											keyRange = this.keyRange.only(options.only);
											break;
										case hasLower && hasUpper:
											keyRange = this.keyRange.bound(options.lower, options.upper, options.excludeLower, options.excludeUpper);
											break;
										case hasLower:
											keyRange = this.keyRange.lowerBound(options.lower, options.excludeLower);
											break;
										case hasUpper:
											keyRange = this.keyRange.upperBound(options.upper, options.excludeUpper);
											break;
										default:
											throw new Error('Cannot create KeyRange. Provide one or both of "lower" or "upper" value, or an "only" value.');
									}

									return keyRange;
								},
							};

							/** helpers **/
							var empty = {};

							function mixin(target, source) {
								var name, s;
								for (name in source) {
									s = source[name];
									if (s !== empty[name] && s !== target[name]) {
										target[name] = s;
									}
								}
								return target;
							}

							function hasVersionError(errorEvent) {
								if ('error' in errorEvent.target) {
									return errorEvent.target.error.name == 'VersionError';
								} else if ('errorCode' in errorEvent.target) {
									return errorEvent.target.errorCode == 12;
								}
								return false;
							}

							IDBStore.prototype = proto;
							IDBStore.version = proto.version;

							return IDBStore;
						},
						this
					);
				},
				{},
			],
			49: [
				function(require, module, exports) {
					arguments[4][7][0].apply(exports, arguments);
				},
				{dup: 7},
			],
			50: [
				function(require, module, exports) {
					module.exports =
						Array.isArray ||
						function(arr) {
							return Object.prototype.toString.call(arr) == '[object Array]';
						};
				},
				{},
			],
			51: [
				function(require, module, exports) {
					var Buffer = require('buffer').Buffer;

					module.exports = isBuffer;

					function isBuffer(o) {
						return Buffer.isBuffer(o) || /\[object (.+Array|Array.+)\]/.test(Object.prototype.toString.call(o));
					}
				},
				{buffer: 3},
			],
			52: [
				function(require, module, exports) {
					var encodings = require('./lib/encodings');

					module.exports = Codec;

					function Codec(opts) {
						this.opts = opts || {};
						this.encodings = encodings;
					}

					Codec.prototype._encoding = function(encoding) {
						if (typeof encoding == 'string') encoding = encodings[encoding];
						if (!encoding) encoding = encodings.id;
						return encoding;
					};

					Codec.prototype._keyEncoding = function(opts, batchOpts) {
						return this._encoding((batchOpts && batchOpts.keyEncoding) || (opts && opts.keyEncoding) || this.opts.keyEncoding);
					};

					Codec.prototype._valueEncoding = function(opts, batchOpts) {
						return this._encoding((batchOpts && (batchOpts.valueEncoding || batchOpts.encoding)) || (opts && (opts.valueEncoding || opts.encoding)) || (this.opts.valueEncoding || this.opts.encoding));
					};

					Codec.prototype.encodeKey = function(key, opts, batchOpts) {
						return this._keyEncoding(opts, batchOpts).encode(key);
					};

					Codec.prototype.encodeValue = function(value, opts, batchOpts) {
						return this._valueEncoding(opts, batchOpts).encode(value);
					};

					Codec.prototype.decodeKey = function(key, opts) {
						return this._keyEncoding(opts).decode(key);
					};

					Codec.prototype.decodeValue = function(value, opts) {
						return this._valueEncoding(opts).decode(value);
					};

					Codec.prototype.encodeBatch = function(ops, opts) {
						var self = this;

						return ops.map(function(_op) {
							var op = {
								type: _op.type,
								key: self.encodeKey(_op.key, opts, _op),
							};
							if (self.keyAsBuffer(opts, _op)) op.keyEncoding = 'binary';
							if (_op.prefix) op.prefix = _op.prefix;
							if ('value' in _op) {
								op.value = self.encodeValue(_op.value, opts, _op);
								if (self.valueAsBuffer(opts, _op)) op.valueEncoding = 'binary';
							}
							return op;
						});
					};

					var ltgtKeys = ['lt', 'gt', 'lte', 'gte', 'start', 'end'];

					Codec.prototype.encodeLtgt = function(ltgt) {
						var self = this;
						var ret = {};
						Object.keys(ltgt).forEach(function(key) {
							ret[key] = ltgtKeys.indexOf(key) > -1 ? self.encodeKey(ltgt[key], ltgt) : ltgt[key];
						});
						return ret;
					};

					Codec.prototype.createStreamDecoder = function(opts) {
						var self = this;

						if (opts.keys && opts.values) {
							return function(key, value) {
								return {
									key: self.decodeKey(key, opts),
									value: self.decodeValue(value, opts),
								};
							};
						} else if (opts.keys) {
							return function(key) {
								return self.decodeKey(key, opts);
							};
						} else if (opts.values) {
							return function(_, value) {
								return self.decodeValue(value, opts);
							};
						} else {
							return function() {};
						}
					};

					Codec.prototype.keyAsBuffer = function(opts) {
						return this._keyEncoding(opts).buffer;
					};

					Codec.prototype.valueAsBuffer = function(opts) {
						return this._valueEncoding(opts).buffer;
					};
				},
				{'./lib/encodings': 53},
			],
			53: [
				function(require, module, exports) {
					(function(Buffer) {
						exports.utf8 = exports['utf-8'] = {
							encode: function(data) {
								return isBinary(data) ? data : String(data);
							},
							decode: function(data) {
								return typeof data === 'string' ? data : String(data);
							},
							buffer: false,
							type: 'utf8',
						};

						exports.json = {
							encode: JSON.stringify,
							decode: JSON.parse,
							buffer: false,
							type: 'json',
						};

						exports.binary = {
							encode: function(data) {
								return isBinary(data) ? data : new Buffer(data);
							},
							decode: identity,
							buffer: true,
							type: 'binary',
						};

						exports.none = {
							encode: identity,
							decode: identity,
							buffer: false,
							type: 'id',
						};

						exports.id = exports.none;

						var bufferEncodings = ['hex', 'ascii', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le'];

						bufferEncodings.forEach(function(type) {
							exports[type] = {
								encode: function(data) {
									return isBinary(data) ? data : new Buffer(data, type);
								},
								decode: function(buffer) {
									return buffer.toString(type);
								},
								buffer: true,
								type: type,
							};
						});

						function identity(value) {
							return value;
						}

						function isBinary(data) {
							return data === undefined || data === null || Buffer.isBuffer(data);
						}
					}.call(this, require('buffer').Buffer));
				},
				{buffer: 3},
			],
			54: [
				function(require, module, exports) {
					/* Copyright (c) 2012-2017 LevelUP contributors
					 * See list at <https://github.com/rvagg/node-levelup#contributing>
					 * MIT License
					 * <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
					 */

					var createError = require('errno').create,
						LevelUPError = createError('LevelUPError'),
						NotFoundError = createError('NotFoundError', LevelUPError);

					NotFoundError.prototype.notFound = true;
					NotFoundError.prototype.status = 404;

					module.exports = {
						LevelUPError: LevelUPError,
						InitializationError: createError('InitializationError', LevelUPError),
						OpenError: createError('OpenError', LevelUPError),
						ReadError: createError('ReadError', LevelUPError),
						WriteError: createError('WriteError', LevelUPError),
						NotFoundError: NotFoundError,
						EncodingError: createError('EncodingError', LevelUPError),
					};
				},
				{errno: 47},
			],
			55: [
				function(require, module, exports) {
					var inherits = require('inherits');
					var Readable = require('readable-stream').Readable;
					var extend = require('xtend');
					var EncodingError = require('level-errors').EncodingError;

					module.exports = ReadStream;
					inherits(ReadStream, Readable);

					function ReadStream(iterator, options) {
						if (!(this instanceof ReadStream)) return new ReadStream(iterator, options);
						Readable.call(
							this,
							extend(options, {
								objectMode: true,
							})
						);
						this._iterator = iterator;
						this._destroyed = false;
						this._decoder = null;
						if (options && options.decoder) this._decoder = options.decoder;
						this.on('end', this._cleanup.bind(this));
					}

					ReadStream.prototype._read = function() {
						var self = this;
						if (this._destroyed) return;

						this._iterator.next(function(err, key, value) {
							if (self._destroyed) return;
							if (err) return self.emit('error', err);
							if (key === undefined && value === undefined) {
								self.push(null);
							} else {
								if (!self._decoder) return self.push({key: key, value: value});

								try {
									var value = self._decoder(key, value);
								} catch (err) {
									self.emit('error', new EncodingError(err));
									self.push(null);
									return;
								}
								self.push(value);
							}
						});
					};

					ReadStream.prototype.destroy = ReadStream.prototype._cleanup = function() {
						var self = this;
						if (this._destroyed) return;
						this._destroyed = true;

						this._iterator.end(function(err) {
							if (err) return self.emit('error', err);
							self.emit('close');
						});
					};
				},
				{inherits: 49, 'level-errors': 54, 'readable-stream': 75, xtend: 56},
			],
			56: [
				function(require, module, exports) {
					arguments[4][45][0].apply(exports, arguments);
				},
				{dup: 45},
			],
			57: [
				function(require, module, exports) {
					(function(Buffer) {
						module.exports = Level;

						var IDB = require('idb-wrapper');
						var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN;
						var util = require('util');
						var Iterator = require('./iterator');
						var isBuffer = require('isbuffer');
						var xtend = require('xtend');
						var toBuffer = require('typedarray-to-buffer');

						function Level(location) {
							if (!(this instanceof Level)) return new Level(location);
							if (!location) throw new Error('constructor requires at least a location argument');
							this.IDBOptions = {};
							this.location = location;
						}

						util.inherits(Level, AbstractLevelDOWN);

						Level.prototype._open = function(options, callback) {
							var self = this;

							var idbOpts = {
								storeName: this.location,
								autoIncrement: false,
								keyPath: null,
								onStoreReady: function() {
									callback && callback(null, self.idb);
								},
								onError: function(err) {
									callback && callback(err);
								},
							};

							xtend(idbOpts, options);
							this.IDBOptions = idbOpts;
							this.idb = new IDB(idbOpts);
						};

						Level.prototype._get = function(key, options, callback) {
							this.idb.get(
								key,
								function(value) {
									if (value === undefined) {
										// 'NotFound' error, consistent with LevelDOWN API
										return callback(new Error('NotFound'));
									}
									// by default return buffers, unless explicitly told not to
									var asBuffer = true;
									if (options.asBuffer === false) asBuffer = false;
									if (options.raw) asBuffer = false;
									if (asBuffer) {
										if (value instanceof Uint8Array) value = toBuffer(value);
										else value = new Buffer(String(value));
									}
									return callback(null, value, key);
								},
								callback
							);
						};

						Level.prototype._del = function(id, options, callback) {
							this.idb.remove(id, callback, callback);
						};

						Level.prototype._put = function(key, value, options, callback) {
							if (value instanceof ArrayBuffer) {
								value = toBuffer(new Uint8Array(value));
							}
							var obj = this.convertEncoding(key, value, options);
							if (Buffer.isBuffer(obj.value)) {
								if (typeof value.toArrayBuffer === 'function') {
									obj.value = new Uint8Array(value.toArrayBuffer());
								} else {
									obj.value = new Uint8Array(value);
								}
							}
							this.idb.put(
								obj.key,
								obj.value,
								function() {
									callback();
								},
								callback
							);
						};

						Level.prototype.convertEncoding = function(key, value, options) {
							if (options.raw) return {key: key, value: value};
							if (value) {
								var stringed = value.toString();
								if (stringed === 'NaN') value = 'NaN';
							}
							var valEnc = options.valueEncoding;
							var obj = {key: key, value: value};
							if (value && (!valEnc || valEnc !== 'binary')) {
								if (typeof obj.value !== 'object') {
									obj.value = stringed;
								}
							}
							return obj;
						};

						Level.prototype.iterator = function(options) {
							if (typeof options !== 'object') options = {};
							return new Iterator(this.idb, options);
						};

						Level.prototype._batch = function(array, options, callback) {
							var op;
							var i;
							var k;
							var copiedOp;
							var currentOp;
							var modified = [];

							if (array.length === 0) return setTimeout(callback, 0);

							for (i = 0; i < array.length; i++) {
								copiedOp = {};
								currentOp = array[i];
								modified[i] = copiedOp;

								var converted = this.convertEncoding(currentOp.key, currentOp.value, options);
								currentOp.key = converted.key;
								currentOp.value = converted.value;

								for (k in currentOp) {
									if (k === 'type' && currentOp[k] == 'del') {
										copiedOp[k] = 'remove';
									} else {
										copiedOp[k] = currentOp[k];
									}
								}
							}

							return this.idb.batch(
								modified,
								function() {
									callback();
								},
								callback
							);
						};

						Level.prototype._close = function(callback) {
							this.idb.db.close();
							callback();
						};

						Level.prototype._approximateSize = function(start, end, callback) {
							var err = new Error('Not implemented');
							if (callback) return callback(err);

							throw err;
						};

						Level.prototype._isBuffer = function(obj) {
							return Buffer.isBuffer(obj);
						};

						Level.destroy = function(db, callback) {
							if (typeof db === 'object') {
								var prefix = db.IDBOptions.storePrefix || 'IDBWrapper-';
								var dbname = db.location;
							} else {
								var prefix = 'IDBWrapper-';
								var dbname = db;
							}
							var request = indexedDB.deleteDatabase(prefix + dbname);
							request.onsuccess = function() {
								callback();
							};
							request.onerror = function(err) {
								callback(err);
							};
						};

						var checkKeyValue = (Level.prototype._checkKeyValue = function(obj, type) {
							if (obj === null || obj === undefined) return new Error(type + ' cannot be `null` or `undefined`');
							if (obj === null || obj === undefined) return new Error(type + ' cannot be `null` or `undefined`');
							if (isBuffer(obj) && obj.byteLength === 0) return new Error(type + ' cannot be an empty ArrayBuffer');
							if (String(obj) === '') return new Error(type + ' cannot be an empty String');
							if (obj.length === 0) return new Error(type + ' cannot be an empty Array');
						});
					}.call(this, require('buffer').Buffer));
				},
				{'./iterator': 58, 'abstract-leveldown': 35, buffer: 3, 'idb-wrapper': 48, isbuffer: 51, 'typedarray-to-buffer': 77, util: 31, xtend: 79},
			],
			58: [
				function(require, module, exports) {
					var util = require('util');
					var AbstractIterator = require('abstract-leveldown').AbstractIterator;
					var ltgt = require('ltgt');

					module.exports = Iterator;

					function Iterator(db, options) {
						if (!options) options = {};
						this.options = options;
						AbstractIterator.call(this, db);
						this._order = options.reverse ? 'DESC' : 'ASC';
						this._limit = options.limit;
						this._count = 0;
						this._done = false;
						var lower = ltgt.lowerBound(options);
						var upper = ltgt.upperBound(options);
						try {
							this._keyRange =
								lower || upper
									? this.db.makeKeyRange({
											lower: lower,
											upper: upper,
											excludeLower: ltgt.lowerBoundExclusive(options),
											excludeUpper: ltgt.upperBoundExclusive(options),
									  })
									: null;
						} catch (e) {
							// The lower key is greater than the upper key.
							// IndexedDB throws an error, but we'll just return 0 results.
							this._keyRangeError = true;
						}
						this.callback = null;
					}

					util.inherits(Iterator, AbstractIterator);

					Iterator.prototype.createIterator = function() {
						var self = this;

						self.iterator = self.db.iterate(
							function() {
								self.onItem.apply(self, arguments);
							},
							{
								keyRange: self._keyRange,
								autoContinue: false,
								order: self._order,
								onError: function(err) {
									console.log('horrible error', err);
								},
							}
						);
					};

					// TODO the limit implementation here just ignores all reads after limit has been reached
					// it should cancel the iterator instead but I don't know how
					Iterator.prototype.onItem = function(value, cursor, cursorTransaction) {
						if (!cursor && this.callback) {
							this.callback();
							this.callback = false;
							return;
						}
						var shouldCall = true;

						if (!!this._limit && this._limit > 0 && this._count++ >= this._limit) shouldCall = false;

						if (shouldCall) this.callback(false, cursor.key, cursor.value);
						if (cursor) cursor['continue']();
					};

					Iterator.prototype._next = function(callback) {
						if (!callback) return new Error('next() requires a callback argument');
						if (this._keyRangeError) return callback();
						if (!this._started) {
							this.createIterator();
							this._started = true;
						}
						this.callback = callback;
					};
				},
				{'abstract-leveldown': 35, ltgt: 64, util: 31},
			],
			59: [
				function(require, module, exports) {
					const levelup = require('levelup');

					function packager(leveldown) {
						function Level(location, options, callback) {
							if (typeof options === 'function') callback = options;
							if (!(typeof options === 'object' && options !== null)) options = {};

							options.db = leveldown;

							return levelup(location, options, callback);
						}

						['destroy', 'repair'].forEach(function(m) {
							if (typeof leveldown[m] === 'function') {
								Level[m] = function(location, callback) {
									leveldown[m](location, callback || function() {});
								};
							}
						});

						return Level;
					}

					module.exports = packager;
				},
				{levelup: 61},
			],
			60: [
				function(require, module, exports) {
					/* Copyright (c) 2012-2016 LevelUP contributors
					 * See list at <https://github.com/level/levelup#contributing>
					 * MIT License
					 * <https://github.com/level/levelup/blob/master/LICENSE.md>
					 */

					var util = require('./util');
					var WriteError = require('level-errors').WriteError;
					var getOptions = util.getOptions;
					var dispatchError = util.dispatchError;

					function Batch(levelup, codec) {
						this._levelup = levelup;
						this._codec = codec;
						this.batch = levelup.db.batch();
						this.ops = [];
						this.length = 0;
					}

					Batch.prototype.put = function(key_, value_, options) {
						options = getOptions(options);

						var key = this._codec.encodeKey(key_, options);
						var value = this._codec.encodeValue(value_, options);

						try {
							this.batch.put(key, value);
						} catch (e) {
							throw new WriteError(e);
						}

						this.ops.push({type: 'put', key: key, value: value});
						this.length++;

						return this;
					};

					Batch.prototype.del = function(key_, options) {
						options = getOptions(options);

						var key = this._codec.encodeKey(key_, options);

						try {
							this.batch.del(key);
						} catch (err) {
							throw new WriteError(err);
						}

						this.ops.push({type: 'del', key: key});
						this.length++;

						return this;
					};

					Batch.prototype.clear = function() {
						try {
							this.batch.clear();
						} catch (err) {
							throw new WriteError(err);
						}

						this.ops = [];
						this.length = 0;

						return this;
					};

					Batch.prototype.write = function(callback) {
						var levelup = this._levelup;
						var ops = this.ops;

						try {
							this.batch.write(function(err) {
								if (err) {
									return dispatchError(levelup, new WriteError(err), callback);
								}
								levelup.emit('batch', ops);
								if (callback) {
									callback();
								}
							});
						} catch (err) {
							throw new WriteError(err);
						}
					};

					module.exports = Batch;
				},
				{'./util': 62, 'level-errors': 54},
			],
			61: [
				function(require, module, exports) {
					(function(process) {
						/* Copyright (c) 2012-2016 LevelUP contributors
						 * See list at <https://github.com/level/levelup#contributing>
						 * MIT License
						 * <https://github.com/level/levelup/blob/master/LICENSE.md>
						 */

						var EventEmitter = require('events').EventEmitter;
						var inherits = require('util').inherits;
						var deprecate = require('util').deprecate;
						var extend = require('xtend');
						var prr = require('prr');
						var DeferredLevelDOWN = require('deferred-leveldown');
						var IteratorStream = require('level-iterator-stream');
						var Batch = require('./batch');
						var Codec = require('level-codec');
						var getLevelDOWN = require('./leveldown');
						var errors = require('level-errors');
						var util = require('./util');

						var WriteError = errors.WriteError;
						var ReadError = errors.ReadError;
						var NotFoundError = errors.NotFoundError;
						var OpenError = errors.OpenError;
						var EncodingError = errors.EncodingError;
						var InitializationError = errors.InitializationError;
						var LevelUPError = errors.LevelUPError;

						var getOptions = util.getOptions;
						var defaultOptions = util.defaultOptions;
						var dispatchError = util.dispatchError;

						function getCallback(options, callback) {
							return typeof options === 'function' ? options : callback;
						}

						// Possible LevelUP#_status values:
						//  - 'new'     - newly created, not opened or closed
						//  - 'opening' - waiting for the database to be opened, post open()
						//  - 'open'    - successfully opened the database, available for use
						//  - 'closing' - waiting for the database to be closed, post close()
						//  - 'closed'  - database has been successfully closed, should not be
						//                 used except for another open() operation

						function LevelUP(location, options, callback) {
							if (!(this instanceof LevelUP)) {
								return new LevelUP(location, options, callback);
							}

							var error;

							EventEmitter.call(this);
							this.setMaxListeners(Infinity);

							if (typeof location === 'function') {
								options = typeof options === 'object' ? options : {};
								options.db = location;
								location = null;
							} else if (typeof location === 'object' && typeof location.db === 'function') {
								options = location;
								location = null;
							}

							if (typeof options === 'function') {
								callback = options;
								options = {};
							}

							if ((!options || typeof options.db !== 'function') && typeof location !== 'string') {
								error = new InitializationError('Must provide a location for the database');
								if (callback) {
									return process.nextTick(function() {
										callback(error);
									});
								}
								throw error;
							}

							options = getOptions(options);
							this.options = extend(defaultOptions, options);
							this._codec = new Codec(this.options);
							this._status = 'new';
							// set this.location as enumerable but not configurable or writable
							prr(this, 'location', location, 'e');

							this.open(callback);
						}

						inherits(LevelUP, EventEmitter);

						LevelUP.prototype.open = function(callback) {
							var self = this;
							var dbFactory;
							var db;

							if (this.isOpen()) {
								if (callback) {
									process.nextTick(function() {
										callback(null, self);
									});
								}
								return this;
							}

							if (this._isOpening()) {
								return (
									callback &&
									this.once('open', function() {
										callback(null, self);
									})
								);
							}

							this.emit('opening');
							this._status = 'opening';
							this.db = new DeferredLevelDOWN(this.location);

							if (typeof this.options.db !== 'function' && typeof getLevelDOWN !== 'function') {
								throw new LevelUPError('missing db factory, you need to set options.db');
							}

							dbFactory = this.options.db || getLevelDOWN();
							db = dbFactory(this.location);

							db.open(this.options, function(err) {
								if (err) {
									return dispatchError(self, new OpenError(err), callback);
								}
								self.db.setDb(db);
								self.db = db;
								self._status = 'open';
								if (callback) {
									callback(null, self);
								}
								self.emit('open');
								self.emit('ready');
							});
						};

						LevelUP.prototype.close = function(callback) {
							var self = this;

							if (this.isOpen()) {
								this._status = 'closing';
								this.db.close(function() {
									self._status = 'closed';
									self.emit('closed');
									if (callback) {
										callback.apply(null, arguments);
									}
								});
								this.emit('closing');
								this.db = new DeferredLevelDOWN(this.location);
							} else if (this._status === 'closed' && callback) {
								return process.nextTick(callback);
							} else if (this._status === 'closing' && callback) {
								this.once('closed', callback);
							} else if (this._isOpening()) {
								this.once('open', function() {
									self.close(callback);
								});
							}
						};

						LevelUP.prototype.isOpen = function() {
							return this._status === 'open';
						};

						LevelUP.prototype._isOpening = function() {
							return this._status === 'opening';
						};

						LevelUP.prototype.isClosed = function() {
							return /^clos/.test(this._status);
						};

						function maybeError(db, options, callback) {
							if (!db._isOpening() && !db.isOpen()) {
								dispatchError(db, new ReadError('Database is not open'), callback);
								return true;
							}
						}

						function writeError(db, message, callback) {
							dispatchError(db, new WriteError(message), callback);
						}

						function readError(db, message, callback) {
							dispatchError(db, new ReadError(message), callback);
						}

						LevelUP.prototype.get = function(key_, options, callback) {
							var self = this;
							var key;

							callback = getCallback(options, callback);

							if (maybeError(this, options, callback)) {
								return;
							}

							if (key_ === null || key_ === undefined || typeof callback !== 'function') {
								return readError(this, 'get() requires key and callback arguments', callback);
							}

							options = util.getOptions(options);
							key = this._codec.encodeKey(key_, options);

							options.asBuffer = this._codec.valueAsBuffer(options);

							this.db.get(key, options, function(err, value) {
								if (err) {
									if (/notfound/i.test(err) || err.notFound) {
										err = new NotFoundError('Key not found in database [' + key_ + ']', err);
									} else {
										err = new ReadError(err);
									}
									return dispatchError(self, err, callback);
								}
								if (callback) {
									try {
										value = self._codec.decodeValue(value, options);
									} catch (e) {
										return callback(new EncodingError(e));
									}
									callback(null, value);
								}
							});
						};

						LevelUP.prototype.put = function(key_, value_, options, callback) {
							var self = this;
							var key;
							var value;

							callback = getCallback(options, callback);

							if (key_ === null || key_ === undefined) {
								return writeError(this, 'put() requires a key argument', callback);
							}

							if (maybeError(this, options, callback)) {
								return;
							}

							options = getOptions(options);
							key = this._codec.encodeKey(key_, options);
							value = this._codec.encodeValue(value_, options);

							this.db.put(key, value, options, function(err) {
								if (err) {
									return dispatchError(self, new WriteError(err), callback);
								}
								self.emit('put', key_, value_);
								if (callback) {
									callback();
								}
							});
						};

						LevelUP.prototype.del = function(key_, options, callback) {
							var self = this;
							var key;

							callback = getCallback(options, callback);

							if (key_ === null || key_ === undefined) {
								return writeError(this, 'del() requires a key argument', callback);
							}

							if (maybeError(this, options, callback)) {
								return;
							}

							options = getOptions(options);
							key = this._codec.encodeKey(key_, options);

							this.db.del(key, options, function(err) {
								if (err) {
									return dispatchError(self, new WriteError(err), callback);
								}
								self.emit('del', key_);
								if (callback) {
									callback();
								}
							});
						};

						LevelUP.prototype.batch = function(arr_, options, callback) {
							var self = this;
							var arr;

							if (!arguments.length) {
								return new Batch(this, this._codec);
							}

							callback = getCallback(options, callback);

							if (!Array.isArray(arr_)) {
								return writeError(this, 'batch() requires an array argument', callback);
							}

							if (maybeError(this, options, callback)) {
								return;
							}

							options = getOptions(options);
							arr = self._codec.encodeBatch(arr_, options);
							arr = arr.map(function(op) {
								if (!op.type && op.key !== undefined && op.value !== undefined) {
									op.type = 'put';
								}
								return op;
							});

							this.db.batch(arr, options, function(err) {
								if (err) {
									return dispatchError(self, new WriteError(err), callback);
								}
								self.emit('batch', arr_);
								if (callback) {
									callback();
								}
							});
						};

						LevelUP.prototype.approximateSize = deprecate(function(start_, end_, options, callback) {
							var self = this;
							var start;
							var end;

							callback = getCallback(options, callback);

							options = getOptions(options);

							if (start_ === null || start_ === undefined || end_ === null || end_ === undefined || typeof callback !== 'function') {
								return readError(this, 'approximateSize() requires start, end and callback arguments', callback);
							}

							start = this._codec.encodeKey(start_, options);
							end = this._codec.encodeKey(end_, options);

							this.db.approximateSize(start, end, function(err, size) {
								if (err) {
									return dispatchError(self, new OpenError(err), callback);
								} else if (callback) {
									callback(null, size);
								}
							});
						}, 'db.approximateSize() is deprecated. Use db.db.approximateSize() instead');

						LevelUP.prototype.readStream = LevelUP.prototype.createReadStream = function(options) {
							options = extend({keys: true, values: true}, this.options, options);

							options.keyEncoding = options.keyEncoding;
							options.valueEncoding = options.valueEncoding;

							options = this._codec.encodeLtgt(options);
							options.keyAsBuffer = this._codec.keyAsBuffer(options);
							options.valueAsBuffer = this._codec.valueAsBuffer(options);

							if (typeof options.limit !== 'number') {
								options.limit = -1;
							}

							return new IteratorStream(
								this.db.iterator(options),
								extend(options, {
									decoder: this._codec.createStreamDecoder(options),
								})
							);
						};

						LevelUP.prototype.keyStream = LevelUP.prototype.createKeyStream = function(options) {
							return this.createReadStream(extend(options, {keys: true, values: false}));
						};

						LevelUP.prototype.valueStream = LevelUP.prototype.createValueStream = function(options) {
							return this.createReadStream(extend(options, {keys: false, values: true}));
						};

						LevelUP.prototype.toString = function() {
							return 'LevelUP';
						};

						function utilStatic(name) {
							return function(location, callback) {
								getLevelDOWN()[name](location, callback || function() {});
							};
						}

						module.exports = LevelUP;
						module.exports.errors = require('level-errors');
						module.exports.destroy = deprecate(utilStatic('destroy'), 'levelup.destroy() is deprecated. Use leveldown.destroy() instead');
						module.exports.repair = deprecate(utilStatic('repair'), 'levelup.repair() is deprecated. Use leveldown.repair() instead');
					}.call(this, require('_process')));
				},
				{'./batch': 60, './leveldown': 2, './util': 62, _process: 11, 'deferred-leveldown': 39, events: 5, 'level-codec': 52, 'level-errors': 54, 'level-iterator-stream': 55, prr: 69, util: 31, xtend: 63},
			],
			62: [
				function(require, module, exports) {
					/* Copyright (c) 2012-2016 LevelUP contributors
					 * See list at <https://github.com/level/levelup#contributing>
					 * MIT License
					 * <https://github.com/level/levelup/blob/master/LICENSE.md>
					 */

					var defaultOptions = {
						createIfMissing: true,
						errorIfExists: false,
						keyEncoding: 'utf8',
						valueEncoding: 'utf8',
						compression: true,
					};

					function getOptions(options) {
						if (typeof options === 'string') {
							options = {valueEncoding: options};
						}
						if (typeof options !== 'object') {
							options = {};
						}
						return options;
					}

					function dispatchError(db, error, callback) {
						typeof callback === 'function' ? callback(error) : db.emit('error', error);
					}

					function isDefined(v) {
						return typeof v !== 'undefined';
					}

					module.exports = {
						defaultOptions: defaultOptions,
						getOptions: getOptions,
						dispatchError: dispatchError,
						isDefined: isDefined,
					};
				},
				{},
			],
			63: [
				function(require, module, exports) {
					arguments[4][45][0].apply(exports, arguments);
				},
				{dup: 45},
			],
			64: [
				function(require, module, exports) {
					(function(Buffer) {
						exports.compare = function(a, b) {
							if (Buffer.isBuffer(a)) {
								var l = Math.min(a.length, b.length);
								for (var i = 0; i < l; i++) {
									var cmp = a[i] - b[i];
									if (cmp) return cmp;
								}
								return a.length - b.length;
							}

							return a < b ? -1 : a > b ? 1 : 0;
						};

						// to be compatible with the current abstract-leveldown tests
						// nullish or empty strings.
						// I could use !!val but I want to permit numbers and booleans,
						// if possible.

						function isDef(val) {
							return val !== undefined && val !== '';
						}

						function has(range, name) {
							return Object.hasOwnProperty.call(range, name);
						}

						function hasKey(range, name) {
							return Object.hasOwnProperty.call(range, name) && name;
						}

						var lowerBoundKey = (exports.lowerBoundKey = function(range) {
							return hasKey(range, 'gt') || hasKey(range, 'gte') || hasKey(range, 'min') || (range.reverse ? hasKey(range, 'end') : hasKey(range, 'start')) || undefined;
						});

						var lowerBound = (exports.lowerBound = function(range, def) {
							var k = lowerBoundKey(range);
							return k ? range[k] : def;
						});

						var lowerBoundInclusive = (exports.lowerBoundInclusive = function(range) {
							return has(range, 'gt') ? false : true;
						});

						var upperBoundInclusive = (exports.upperBoundInclusive = function(range) {
							return has(range, 'lt') /*&& !range.maxEx*/ ? false : true;
						});

						var lowerBoundExclusive = (exports.lowerBoundExclusive = function(range) {
							return !lowerBoundInclusive(range);
						});

						var upperBoundExclusive = (exports.upperBoundExclusive = function(range) {
							return !upperBoundInclusive(range);
						});

						var upperBoundKey = (exports.upperBoundKey = function(range) {
							return hasKey(range, 'lt') || hasKey(range, 'lte') || hasKey(range, 'max') || (range.reverse ? hasKey(range, 'start') : hasKey(range, 'end')) || undefined;
						});

						var upperBound = (exports.upperBound = function(range, def) {
							var k = upperBoundKey(range);
							return k ? range[k] : def;
						});

						exports.start = function(range, def) {
							return range.reverse ? upperBound(range, def) : lowerBound(range, def);
						};
						exports.end = function(range, def) {
							return range.reverse ? lowerBound(range, def) : upperBound(range, def);
						};
						exports.startInclusive = function(range) {
							return range.reverse ? upperBoundInclusive(range) : lowerBoundInclusive(range);
						};
						exports.endInclusive = function(range) {
							return range.reverse ? lowerBoundInclusive(range) : upperBoundInclusive(range);
						};

						function id(e) {
							return e;
						}

						exports.toLtgt = function(range, _range, map, lower, upper) {
							_range = _range || {};
							map = map || id;
							var defaults = arguments.length > 3;
							var lb = exports.lowerBoundKey(range);
							var ub = exports.upperBoundKey(range);
							if (lb) {
								if (lb === 'gt') _range.gt = map(range.gt, false);
								else _range.gte = map(range[lb], false);
							} else if (defaults) _range.gte = map(lower, false);

							if (ub) {
								if (ub === 'lt') _range.lt = map(range.lt, true);
								else _range.lte = map(range[ub], true);
							} else if (defaults) _range.lte = map(upper, true);

							if (range.reverse != null) _range.reverse = !!range.reverse;

							//if range was used mutably
							//(in level-sublevel it's part of an options object
							//that has more properties on it.)
							if (has(_range, 'max')) delete _range.max;
							if (has(_range, 'min')) delete _range.min;
							if (has(_range, 'start')) delete _range.start;
							if (has(_range, 'end')) delete _range.end;

							return _range;
						};

						exports.contains = function(range, key, compare) {
							compare = compare || exports.compare;

							var lb = lowerBound(range);
							if (isDef(lb)) {
								var cmp = compare(key, lb);
								if (cmp < 0 || (cmp === 0 && lowerBoundExclusive(range))) return false;
							}

							var ub = upperBound(range);
							if (isDef(ub)) {
								var cmp = compare(key, ub);
								if (cmp > 0 || (cmp === 0 && upperBoundExclusive(range))) return false;
							}

							return true;
						};

						exports.filter = function(range, compare) {
							return function(key) {
								return exports.contains(range, key, compare);
							};
						};
					}.call(this, {isBuffer: require('../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js')}));
				},
				{'../../../../../.nvm/versions/node/v6.12.2/lib/node_modules/browserify/node_modules/is-buffer/index.js': 8},
			],
			65: [
				function(require, module, exports) {
					var hasOwn = Object.prototype.hasOwnProperty;
					var toString = Object.prototype.toString;

					var isFunction = function(fn) {
						var isFunc = (typeof fn === 'function' && !(fn instanceof RegExp)) || toString.call(fn) === '[object Function]';
						if (!isFunc && typeof window !== 'undefined') {
							isFunc = fn === window.setTimeout || fn === window.alert || fn === window.confirm || fn === window.prompt;
						}
						return isFunc;
					};

					module.exports = function forEach(obj, fn) {
						if (!isFunction(fn)) {
							throw new TypeError('iterator must be a function');
						}
						var i,
							k,
							isString = typeof obj === 'string',
							l = obj.length,
							context = arguments.length > 2 ? arguments[2] : null;
						if (l === +l) {
							for (i = 0; i < l; i++) {
								if (context === null) {
									fn(isString ? obj.charAt(i) : obj[i], i, obj);
								} else {
									fn.call(context, isString ? obj.charAt(i) : obj[i], i, obj);
								}
							}
						} else {
							for (k in obj) {
								if (hasOwn.call(obj, k)) {
									if (context === null) {
										fn(obj[k], k, obj);
									} else {
										fn.call(context, obj[k], k, obj);
									}
								}
							}
						}
					};
				},
				{},
			],
			66: [
				function(require, module, exports) {
					module.exports = Object.keys || require('./shim');
				},
				{'./shim': 68},
			],
			67: [
				function(require, module, exports) {
					var toString = Object.prototype.toString;

					module.exports = function isArguments(value) {
						var str = toString.call(value);
						var isArguments = str === '[object Arguments]';
						if (!isArguments) {
							isArguments = str !== '[object Array]' && value !== null && typeof value === 'object' && typeof value.length === 'number' && value.length >= 0 && toString.call(value.callee) === '[object Function]';
						}
						return isArguments;
					};
				},
				{},
			],
			68: [
				function(require, module, exports) {
					(function() {
						'use strict';

						// modified from https://github.com/kriskowal/es5-shim
						var has = Object.prototype.hasOwnProperty,
							toString = Object.prototype.toString,
							forEach = require('./foreach'),
							isArgs = require('./isArguments'),
							hasDontEnumBug = !{toString: null}.propertyIsEnumerable('toString'),
							hasProtoEnumBug = function() {}.propertyIsEnumerable('prototype'),
							dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
							keysShim;

						keysShim = function keys(object) {
							var isObject = object !== null && typeof object === 'object',
								isFunction = toString.call(object) === '[object Function]',
								isArguments = isArgs(object),
								theKeys = [];

							if (!isObject && !isFunction && !isArguments) {
								throw new TypeError('Object.keys called on a non-object');
							}

							if (isArguments) {
								forEach(object, function(value) {
									theKeys.push(value);
								});
							} else {
								var name,
									skipProto = hasProtoEnumBug && isFunction;

								for (name in object) {
									if (!(skipProto && name === 'prototype') && has.call(object, name)) {
										theKeys.push(name);
									}
								}
							}

							if (hasDontEnumBug) {
								var ctor = object.constructor,
									skipConstructor = ctor && ctor.prototype === object;

								forEach(dontEnums, function(dontEnum) {
									if (!(skipConstructor && dontEnum === 'constructor') && has.call(object, dontEnum)) {
										theKeys.push(dontEnum);
									}
								});
							}
							return theKeys;
						};

						module.exports = keysShim;
					})();
				},
				{'./foreach': 65, './isArguments': 67},
			],
			69: [
				function(require, module, exports) {
					/*!
					 * prr
					 * (c) 2013 Rod Vagg <rod@vagg.org>
					 * https://github.com/rvagg/prr
					 * License: MIT
					 */

					(function(name, context, definition) {
						if (typeof module != 'undefined' && module.exports) module.exports = definition();
						else context[name] = definition();
					})('prr', this, function() {
						var setProperty =
								typeof Object.defineProperty == 'function'
									? function(obj, key, options) {
											Object.defineProperty(obj, key, options);
											return obj;
									  }
									: function(obj, key, options) {
											// < es5
											obj[key] = options.value;
											return obj;
									  },
							makeOptions = function(value, options) {
								var oo = typeof options == 'object',
									os = !oo && typeof options == 'string',
									op = function(p) {
										return oo ? !!options[p] : os ? options.indexOf(p[0]) > -1 : false;
									};

								return {
									enumerable: op('enumerable'),
									configurable: op('configurable'),
									writable: op('writable'),
									value: value,
								};
							},
							prr = function(obj, key, value, options) {
								var k;

								options = makeOptions(value, options);

								if (typeof key == 'object') {
									for (k in key) {
										if (Object.hasOwnProperty.call(key, k)) {
											options.value = key[k];
											setProperty(obj, k, options);
										}
									}
									return obj;
								}

								return setProperty(obj, key, options);
							};

						return prr;
					});
				},
				{},
			],
			70: [
				function(require, module, exports) {
					(function(process) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						// a duplex stream is just a stream that is both readable and writable.
						// Since JS doesn't have multiple prototypal inheritance, this class
						// prototypally inherits from Readable, and then parasitically from
						// Writable.

						module.exports = Duplex;

						/*<replacement>*/
						var objectKeys =
							Object.keys ||
							function(obj) {
								var keys = [];
								for (var key in obj) keys.push(key);
								return keys;
							};
						/*</replacement>*/

						/*<replacement>*/
						var util = require('core-util-is');
						util.inherits = require('inherits');
						/*</replacement>*/

						var Readable = require('./_stream_readable');
						var Writable = require('./_stream_writable');

						util.inherits(Duplex, Readable);

						forEach(objectKeys(Writable.prototype), function(method) {
							if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
						});

						function Duplex(options) {
							if (!(this instanceof Duplex)) return new Duplex(options);

							Readable.call(this, options);
							Writable.call(this, options);

							if (options && options.readable === false) this.readable = false;

							if (options && options.writable === false) this.writable = false;

							this.allowHalfOpen = true;
							if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

							this.once('end', onend);
						}

						// the no-half-open enforcer
						function onend() {
							// if we allow half-open state, or if the writable side ended,
							// then we're ok.
							if (this.allowHalfOpen || this._writableState.ended) return;

							// no more data can be written.
							// But allow more writes to happen in this tick.
							process.nextTick(this.end.bind(this));
						}

						function forEach(xs, f) {
							for (var i = 0, l = xs.length; i < l; i++) {
								f(xs[i], i);
							}
						}
					}.call(this, require('_process')));
				},
				{'./_stream_readable': 72, './_stream_writable': 74, _process: 11, 'core-util-is': 37, inherits: 49},
			],
			71: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					// a passthrough stream.
					// basically just the most minimal sort of Transform stream.
					// Every written chunk gets output as-is.

					module.exports = PassThrough;

					var Transform = require('./_stream_transform');

					/*<replacement>*/
					var util = require('core-util-is');
					util.inherits = require('inherits');
					/*</replacement>*/

					util.inherits(PassThrough, Transform);

					function PassThrough(options) {
						if (!(this instanceof PassThrough)) return new PassThrough(options);

						Transform.call(this, options);
					}

					PassThrough.prototype._transform = function(chunk, encoding, cb) {
						cb(null, chunk);
					};
				},
				{'./_stream_transform': 73, 'core-util-is': 37, inherits: 49},
			],
			72: [
				function(require, module, exports) {
					(function(process) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						module.exports = Readable;

						/*<replacement>*/
						var isArray = require('isarray');
						/*</replacement>*/

						/*<replacement>*/
						var Buffer = require('buffer').Buffer;
						/*</replacement>*/

						Readable.ReadableState = ReadableState;

						var EE = require('events').EventEmitter;

						/*<replacement>*/
						if (!EE.listenerCount)
							EE.listenerCount = function(emitter, type) {
								return emitter.listeners(type).length;
							};
						/*</replacement>*/

						var Stream = require('stream');

						/*<replacement>*/
						var util = require('core-util-is');
						util.inherits = require('inherits');
						/*</replacement>*/

						var StringDecoder;

						/*<replacement>*/
						var debug = require('util');
						if (debug && debug.debuglog) {
							debug = debug.debuglog('stream');
						} else {
							debug = function() {};
						}
						/*</replacement>*/

						util.inherits(Readable, Stream);

						function ReadableState(options, stream) {
							var Duplex = require('./_stream_duplex');

							options = options || {};

							// the point at which it stops calling _read() to fill the buffer
							// Note: 0 is a valid value, means "don't call _read preemptively ever"
							var hwm = options.highWaterMark;
							var defaultHwm = options.objectMode ? 16 : 16 * 1024;
							this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

							// cast to ints.
							this.highWaterMark = ~~this.highWaterMark;

							this.buffer = [];
							this.length = 0;
							this.pipes = null;
							this.pipesCount = 0;
							this.flowing = null;
							this.ended = false;
							this.endEmitted = false;
							this.reading = false;

							// a flag to be able to tell if the onwrite cb is called immediately,
							// or on a later tick.  We set this to true at first, because any
							// actions that shouldn't happen until "later" should generally also
							// not happen before the first write call.
							this.sync = true;

							// whenever we return null, then we set a flag to say
							// that we're awaiting a 'readable' event emission.
							this.needReadable = false;
							this.emittedReadable = false;
							this.readableListening = false;

							// object stream flag. Used to make read(n) ignore n and to
							// make all the buffer merging and length checks go away
							this.objectMode = !!options.objectMode;

							if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

							// Crypto is kind of old and crusty.  Historically, its default string
							// encoding is 'binary' so we have to make this configurable.
							// Everything else in the universe uses 'utf8', though.
							this.defaultEncoding = options.defaultEncoding || 'utf8';

							// when piping, we only care about 'readable' events that happen
							// after read()ing all the bytes and not getting any pushback.
							this.ranOut = false;

							// the number of writers that are awaiting a drain event in .pipe()s
							this.awaitDrain = 0;

							// if true, a maybeReadMore has been scheduled
							this.readingMore = false;

							this.decoder = null;
							this.encoding = null;
							if (options.encoding) {
								if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
								this.decoder = new StringDecoder(options.encoding);
								this.encoding = options.encoding;
							}
						}

						function Readable(options) {
							var Duplex = require('./_stream_duplex');

							if (!(this instanceof Readable)) return new Readable(options);

							this._readableState = new ReadableState(options, this);

							// legacy
							this.readable = true;

							Stream.call(this);
						}

						// Manually shove something into the read() buffer.
						// This returns true if the highWaterMark has not been hit yet,
						// similar to how Writable.write() returns true if you should
						// write() some more.
						Readable.prototype.push = function(chunk, encoding) {
							var state = this._readableState;

							if (util.isString(chunk) && !state.objectMode) {
								encoding = encoding || state.defaultEncoding;
								if (encoding !== state.encoding) {
									chunk = new Buffer(chunk, encoding);
									encoding = '';
								}
							}

							return readableAddChunk(this, state, chunk, encoding, false);
						};

						// Unshift should *always* be something directly out of read()
						Readable.prototype.unshift = function(chunk) {
							var state = this._readableState;
							return readableAddChunk(this, state, chunk, '', true);
						};

						function readableAddChunk(stream, state, chunk, encoding, addToFront) {
							var er = chunkInvalid(state, chunk);
							if (er) {
								stream.emit('error', er);
							} else if (util.isNullOrUndefined(chunk)) {
								state.reading = false;
								if (!state.ended) onEofChunk(stream, state);
							} else if (state.objectMode || (chunk && chunk.length > 0)) {
								if (state.ended && !addToFront) {
									var e = new Error('stream.push() after EOF');
									stream.emit('error', e);
								} else if (state.endEmitted && addToFront) {
									var e = new Error('stream.unshift() after end event');
									stream.emit('error', e);
								} else {
									if (state.decoder && !addToFront && !encoding) chunk = state.decoder.write(chunk);

									if (!addToFront) state.reading = false;

									// if we want the data now, just emit it.
									if (state.flowing && state.length === 0 && !state.sync) {
										stream.emit('data', chunk);
										stream.read(0);
									} else {
										// update the buffer info.
										state.length += state.objectMode ? 1 : chunk.length;
										if (addToFront) state.buffer.unshift(chunk);
										else state.buffer.push(chunk);

										if (state.needReadable) emitReadable(stream);
									}

									maybeReadMore(stream, state);
								}
							} else if (!addToFront) {
								state.reading = false;
							}

							return needMoreData(state);
						}

						// if it's past the high water mark, we can push in some more.
						// Also, if we have no data yet, we can stand some
						// more bytes.  This is to work around cases where hwm=0,
						// such as the repl.  Also, if the push() triggered a
						// readable event, and the user called read(largeNumber) such that
						// needReadable was set, then we ought to push more, so that another
						// 'readable' event will be triggered.
						function needMoreData(state) {
							return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
						}

						// backwards compatibility.
						Readable.prototype.setEncoding = function(enc) {
							if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
							this._readableState.decoder = new StringDecoder(enc);
							this._readableState.encoding = enc;
							return this;
						};

						// Don't raise the hwm > 128MB
						var MAX_HWM = 0x800000;
						function roundUpToNextPowerOf2(n) {
							if (n >= MAX_HWM) {
								n = MAX_HWM;
							} else {
								// Get the next highest power of 2
								n--;
								for (var p = 1; p < 32; p <<= 1) n |= n >> p;
								n++;
							}
							return n;
						}

						function howMuchToRead(n, state) {
							if (state.length === 0 && state.ended) return 0;

							if (state.objectMode) return n === 0 ? 0 : 1;

							if (isNaN(n) || util.isNull(n)) {
								// only flow one buffer at a time
								if (state.flowing && state.buffer.length) return state.buffer[0].length;
								else return state.length;
							}

							if (n <= 0) return 0;

							// If we're asking for more than the target buffer level,
							// then raise the water mark.  Bump up to the next highest
							// power of 2, to prevent increasing it excessively in tiny
							// amounts.
							if (n > state.highWaterMark) state.highWaterMark = roundUpToNextPowerOf2(n);

							// don't have that much.  return null, unless we've ended.
							if (n > state.length) {
								if (!state.ended) {
									state.needReadable = true;
									return 0;
								} else return state.length;
							}

							return n;
						}

						// you can override either this method, or the async _read(n) below.
						Readable.prototype.read = function(n) {
							debug('read', n);
							var state = this._readableState;
							var nOrig = n;

							if (!util.isNumber(n) || n > 0) state.emittedReadable = false;

							// if we're doing read(0) to trigger a readable event, but we
							// already have a bunch of data in the buffer, then just trigger
							// the 'readable' event and move on.
							if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
								debug('read: emitReadable', state.length, state.ended);
								if (state.length === 0 && state.ended) endReadable(this);
								else emitReadable(this);
								return null;
							}

							n = howMuchToRead(n, state);

							// if we've ended, and we're now clear, then finish it up.
							if (n === 0 && state.ended) {
								if (state.length === 0) endReadable(this);
								return null;
							}

							// All the actual chunk generation logic needs to be
							// *below* the call to _read.  The reason is that in certain
							// synthetic stream cases, such as passthrough streams, _read
							// may be a completely synchronous operation which may change
							// the state of the read buffer, providing enough data when
							// before there was *not* enough.
							//
							// So, the steps are:
							// 1. Figure out what the state of things will be after we do
							// a read from the buffer.
							//
							// 2. If that resulting state will trigger a _read, then call _read.
							// Note that this may be asynchronous, or synchronous.  Yes, it is
							// deeply ugly to write APIs this way, but that still doesn't mean
							// that the Readable class should behave improperly, as streams are
							// designed to be sync/async agnostic.
							// Take note if the _read call is sync or async (ie, if the read call
							// has returned yet), so that we know whether or not it's safe to emit
							// 'readable' etc.
							//
							// 3. Actually pull the requested chunks out of the buffer and return.

							// if we need a readable event, then we need to do some reading.
							var doRead = state.needReadable;
							debug('need readable', doRead);

							// if we currently have less than the highWaterMark, then also read some
							if (state.length === 0 || state.length - n < state.highWaterMark) {
								doRead = true;
								debug('length less than watermark', doRead);
							}

							// however, if we've ended, then there's no point, and if we're already
							// reading, then it's unnecessary.
							if (state.ended || state.reading) {
								doRead = false;
								debug('reading or ended', doRead);
							}

							if (doRead) {
								debug('do read');
								state.reading = true;
								state.sync = true;
								// if the length is currently zero, then we *need* a readable event.
								if (state.length === 0) state.needReadable = true;
								// call internal read method
								this._read(state.highWaterMark);
								state.sync = false;
							}

							// If _read pushed data synchronously, then `reading` will be false,
							// and we need to re-evaluate how much data we can return to the user.
							if (doRead && !state.reading) n = howMuchToRead(nOrig, state);

							var ret;
							if (n > 0) ret = fromList(n, state);
							else ret = null;

							if (util.isNull(ret)) {
								state.needReadable = true;
								n = 0;
							}

							state.length -= n;

							// If we have nothing in the buffer, then we want to know
							// as soon as we *do* get something into the buffer.
							if (state.length === 0 && !state.ended) state.needReadable = true;

							// If we tried to read() past the EOF, then emit end on the next tick.
							if (nOrig !== n && state.ended && state.length === 0) endReadable(this);

							if (!util.isNull(ret)) this.emit('data', ret);

							return ret;
						};

						function chunkInvalid(state, chunk) {
							var er = null;
							if (!util.isBuffer(chunk) && !util.isString(chunk) && !util.isNullOrUndefined(chunk) && !state.objectMode) {
								er = new TypeError('Invalid non-string/buffer chunk');
							}
							return er;
						}

						function onEofChunk(stream, state) {
							if (state.decoder && !state.ended) {
								var chunk = state.decoder.end();
								if (chunk && chunk.length) {
									state.buffer.push(chunk);
									state.length += state.objectMode ? 1 : chunk.length;
								}
							}
							state.ended = true;

							// emit 'readable' now to make sure it gets picked up.
							emitReadable(stream);
						}

						// Don't emit readable right away in sync mode, because this can trigger
						// another read() call => stack overflow.  This way, it might trigger
						// a nextTick recursion warning, but that's not so bad.
						function emitReadable(stream) {
							var state = stream._readableState;
							state.needReadable = false;
							if (!state.emittedReadable) {
								debug('emitReadable', state.flowing);
								state.emittedReadable = true;
								if (state.sync)
									process.nextTick(function() {
										emitReadable_(stream);
									});
								else emitReadable_(stream);
							}
						}

						function emitReadable_(stream) {
							debug('emit readable');
							stream.emit('readable');
							flow(stream);
						}

						// at this point, the user has presumably seen the 'readable' event,
						// and called read() to consume some data.  that may have triggered
						// in turn another _read(n) call, in which case reading = true if
						// it's in progress.
						// However, if we're not ended, or reading, and the length < hwm,
						// then go ahead and try to read some more preemptively.
						function maybeReadMore(stream, state) {
							if (!state.readingMore) {
								state.readingMore = true;
								process.nextTick(function() {
									maybeReadMore_(stream, state);
								});
							}
						}

						function maybeReadMore_(stream, state) {
							var len = state.length;
							while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
								debug('maybeReadMore read 0');
								stream.read(0);
								if (len === state.length)
									// didn't get any data, stop spinning.
									break;
								else len = state.length;
							}
							state.readingMore = false;
						}

						// abstract method.  to be overridden in specific implementation classes.
						// call cb(er, data) where data is <= n in length.
						// for virtual (non-string, non-buffer) streams, "length" is somewhat
						// arbitrary, and perhaps not very meaningful.
						Readable.prototype._read = function(n) {
							this.emit('error', new Error('not implemented'));
						};

						Readable.prototype.pipe = function(dest, pipeOpts) {
							var src = this;
							var state = this._readableState;

							switch (state.pipesCount) {
								case 0:
									state.pipes = dest;
									break;
								case 1:
									state.pipes = [state.pipes, dest];
									break;
								default:
									state.pipes.push(dest);
									break;
							}
							state.pipesCount += 1;
							debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

							var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

							var endFn = doEnd ? onend : cleanup;
							if (state.endEmitted) process.nextTick(endFn);
							else src.once('end', endFn);

							dest.on('unpipe', onunpipe);
							function onunpipe(readable) {
								debug('onunpipe');
								if (readable === src) {
									cleanup();
								}
							}

							function onend() {
								debug('onend');
								dest.end();
							}

							// when the dest drains, it reduces the awaitDrain counter
							// on the source.  This would be more elegant with a .once()
							// handler in flow(), but adding and removing repeatedly is
							// too slow.
							var ondrain = pipeOnDrain(src);
							dest.on('drain', ondrain);

							function cleanup() {
								debug('cleanup');
								// cleanup event handlers once the pipe is broken
								dest.removeListener('close', onclose);
								dest.removeListener('finish', onfinish);
								dest.removeListener('drain', ondrain);
								dest.removeListener('error', onerror);
								dest.removeListener('unpipe', onunpipe);
								src.removeListener('end', onend);
								src.removeListener('end', cleanup);
								src.removeListener('data', ondata);

								// if the reader is waiting for a drain event from this
								// specific writer, then it would cause it to never start
								// flowing again.
								// So, if this is awaiting a drain, then we just call it now.
								// If we don't know, then assume that we are waiting for one.
								if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
							}

							src.on('data', ondata);
							function ondata(chunk) {
								debug('ondata');
								var ret = dest.write(chunk);
								if (false === ret) {
									debug('false write response, pause', src._readableState.awaitDrain);
									src._readableState.awaitDrain++;
									src.pause();
								}
							}

							// if the dest has an error, then stop piping into it.
							// however, don't suppress the throwing behavior for this.
							function onerror(er) {
								debug('onerror', er);
								unpipe();
								dest.removeListener('error', onerror);
								if (EE.listenerCount(dest, 'error') === 0) dest.emit('error', er);
							}
							// This is a brutally ugly hack to make sure that our error handler
							// is attached before any userland ones.  NEVER DO THIS.
							if (!dest._events || !dest._events.error) dest.on('error', onerror);
							else if (isArray(dest._events.error)) dest._events.error.unshift(onerror);
							else dest._events.error = [onerror, dest._events.error];

							// Both close and finish should trigger unpipe, but only once.
							function onclose() {
								dest.removeListener('finish', onfinish);
								unpipe();
							}
							dest.once('close', onclose);
							function onfinish() {
								debug('onfinish');
								dest.removeListener('close', onclose);
								unpipe();
							}
							dest.once('finish', onfinish);

							function unpipe() {
								debug('unpipe');
								src.unpipe(dest);
							}

							// tell the dest that it's being piped to
							dest.emit('pipe', src);

							// start the flow if it hasn't been started already.
							if (!state.flowing) {
								debug('pipe resume');
								src.resume();
							}

							return dest;
						};

						function pipeOnDrain(src) {
							return function() {
								var state = src._readableState;
								debug('pipeOnDrain', state.awaitDrain);
								if (state.awaitDrain) state.awaitDrain--;
								if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
									state.flowing = true;
									flow(src);
								}
							};
						}

						Readable.prototype.unpipe = function(dest) {
							var state = this._readableState;

							// if we're not piping anywhere, then do nothing.
							if (state.pipesCount === 0) return this;

							// just one destination.  most common case.
							if (state.pipesCount === 1) {
								// passed in one, but it's not the right one.
								if (dest && dest !== state.pipes) return this;

								if (!dest) dest = state.pipes;

								// got a match.
								state.pipes = null;
								state.pipesCount = 0;
								state.flowing = false;
								if (dest) dest.emit('unpipe', this);
								return this;
							}

							// slow case. multiple pipe destinations.

							if (!dest) {
								// remove all.
								var dests = state.pipes;
								var len = state.pipesCount;
								state.pipes = null;
								state.pipesCount = 0;
								state.flowing = false;

								for (var i = 0; i < len; i++) dests[i].emit('unpipe', this);
								return this;
							}

							// try to find the right one.
							var i = indexOf(state.pipes, dest);
							if (i === -1) return this;

							state.pipes.splice(i, 1);
							state.pipesCount -= 1;
							if (state.pipesCount === 1) state.pipes = state.pipes[0];

							dest.emit('unpipe', this);

							return this;
						};

						// set up data events if they are asked for
						// Ensure readable listeners eventually get something
						Readable.prototype.on = function(ev, fn) {
							var res = Stream.prototype.on.call(this, ev, fn);

							// If listening to data, and it has not explicitly been paused,
							// then call resume to start the flow of data on the next tick.
							if (ev === 'data' && false !== this._readableState.flowing) {
								this.resume();
							}

							if (ev === 'readable' && this.readable) {
								var state = this._readableState;
								if (!state.readableListening) {
									state.readableListening = true;
									state.emittedReadable = false;
									state.needReadable = true;
									if (!state.reading) {
										var self = this;
										process.nextTick(function() {
											debug('readable nexttick read 0');
											self.read(0);
										});
									} else if (state.length) {
										emitReadable(this, state);
									}
								}
							}

							return res;
						};
						Readable.prototype.addListener = Readable.prototype.on;

						// pause() and resume() are remnants of the legacy readable stream API
						// If the user uses them, then switch into old mode.
						Readable.prototype.resume = function() {
							var state = this._readableState;
							if (!state.flowing) {
								debug('resume');
								state.flowing = true;
								if (!state.reading) {
									debug('resume read 0');
									this.read(0);
								}
								resume(this, state);
							}
							return this;
						};

						function resume(stream, state) {
							if (!state.resumeScheduled) {
								state.resumeScheduled = true;
								process.nextTick(function() {
									resume_(stream, state);
								});
							}
						}

						function resume_(stream, state) {
							state.resumeScheduled = false;
							stream.emit('resume');
							flow(stream);
							if (state.flowing && !state.reading) stream.read(0);
						}

						Readable.prototype.pause = function() {
							debug('call pause flowing=%j', this._readableState.flowing);
							if (false !== this._readableState.flowing) {
								debug('pause');
								this._readableState.flowing = false;
								this.emit('pause');
							}
							return this;
						};

						function flow(stream) {
							var state = stream._readableState;
							debug('flow', state.flowing);
							if (state.flowing) {
								do {
									var chunk = stream.read();
								} while (null !== chunk && state.flowing);
							}
						}

						// wrap an old-style stream as the async data source.
						// This is *not* part of the readable stream interface.
						// It is an ugly unfortunate mess of history.
						Readable.prototype.wrap = function(stream) {
							var state = this._readableState;
							var paused = false;

							var self = this;
							stream.on('end', function() {
								debug('wrapped end');
								if (state.decoder && !state.ended) {
									var chunk = state.decoder.end();
									if (chunk && chunk.length) self.push(chunk);
								}

								self.push(null);
							});

							stream.on('data', function(chunk) {
								debug('wrapped data');
								if (state.decoder) chunk = state.decoder.write(chunk);
								if (!chunk || (!state.objectMode && !chunk.length)) return;

								var ret = self.push(chunk);
								if (!ret) {
									paused = true;
									stream.pause();
								}
							});

							// proxy all the other methods.
							// important when wrapping filters and duplexes.
							for (var i in stream) {
								if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
									this[i] = (function(method) {
										return function() {
											return stream[method].apply(stream, arguments);
										};
									})(i);
								}
							}

							// proxy certain important events.
							var events = ['error', 'close', 'destroy', 'pause', 'resume'];
							forEach(events, function(ev) {
								stream.on(ev, self.emit.bind(self, ev));
							});

							// when we try to consume some more bytes, simply unpause the
							// underlying stream.
							self._read = function(n) {
								debug('wrapped _read', n);
								if (paused) {
									paused = false;
									stream.resume();
								}
							};

							return self;
						};

						// exposed for testing purposes only.
						Readable._fromList = fromList;

						// Pluck off n bytes from an array of buffers.
						// Length is the combined lengths of all the buffers in the list.
						function fromList(n, state) {
							var list = state.buffer;
							var length = state.length;
							var stringMode = !!state.decoder;
							var objectMode = !!state.objectMode;
							var ret;

							// nothing in the list, definitely empty.
							if (list.length === 0) return null;

							if (length === 0) ret = null;
							else if (objectMode) ret = list.shift();
							else if (!n || n >= length) {
								// read it all, truncate the array.
								if (stringMode) ret = list.join('');
								else ret = Buffer.concat(list, length);
								list.length = 0;
							} else {
								// read just some of it.
								if (n < list[0].length) {
									// just take a part of the first list item.
									// slice is the same for buffers and strings.
									var buf = list[0];
									ret = buf.slice(0, n);
									list[0] = buf.slice(n);
								} else if (n === list[0].length) {
									// first list is a perfect match
									ret = list.shift();
								} else {
									// complex case.
									// we have enough to cover it, but it spans past the first buffer.
									if (stringMode) ret = '';
									else ret = new Buffer(n);

									var c = 0;
									for (var i = 0, l = list.length; i < l && c < n; i++) {
										var buf = list[0];
										var cpy = Math.min(n - c, buf.length);

										if (stringMode) ret += buf.slice(0, cpy);
										else buf.copy(ret, c, 0, cpy);

										if (cpy < buf.length) list[0] = buf.slice(cpy);
										else list.shift();

										c += cpy;
									}
								}
							}

							return ret;
						}

						function endReadable(stream) {
							var state = stream._readableState;

							// If we get here before consuming all the bytes, then that is a
							// bug in node.  Should never happen.
							if (state.length > 0) throw new Error('endReadable called on non-empty stream');

							if (!state.endEmitted) {
								state.ended = true;
								process.nextTick(function() {
									// Check that we didn't get one last unshift.
									if (!state.endEmitted && state.length === 0) {
										state.endEmitted = true;
										stream.readable = false;
										stream.emit('end');
									}
								});
							}
						}

						function forEach(xs, f) {
							for (var i = 0, l = xs.length; i < l; i++) {
								f(xs[i], i);
							}
						}

						function indexOf(xs, x) {
							for (var i = 0, l = xs.length; i < l; i++) {
								if (xs[i] === x) return i;
							}
							return -1;
						}
					}.call(this, require('_process')));
				},
				{'./_stream_duplex': 70, _process: 11, buffer: 3, 'core-util-is': 37, events: 5, inherits: 49, isarray: 50, stream: 26, 'string_decoder/': 76, util: 2},
			],
			73: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					// a transform stream is a readable/writable stream where you do
					// something with the data.  Sometimes it's called a "filter",
					// but that's not a great name for it, since that implies a thing where
					// some bits pass through, and others are simply ignored.  (That would
					// be a valid example of a transform, of course.)
					//
					// While the output is causally related to the input, it's not a
					// necessarily symmetric or synchronous transformation.  For example,
					// a zlib stream might take multiple plain-text writes(), and then
					// emit a single compressed chunk some time in the future.
					//
					// Here's how this works:
					//
					// The Transform stream has all the aspects of the readable and writable
					// stream classes.  When you write(chunk), that calls _write(chunk,cb)
					// internally, and returns false if there's a lot of pending writes
					// buffered up.  When you call read(), that calls _read(n) until
					// there's enough pending readable data buffered up.
					//
					// In a transform stream, the written data is placed in a buffer.  When
					// _read(n) is called, it transforms the queued up data, calling the
					// buffered _write cb's as it consumes chunks.  If consuming a single
					// written chunk would result in multiple output chunks, then the first
					// outputted bit calls the readcb, and subsequent chunks just go into
					// the read buffer, and will cause it to emit 'readable' if necessary.
					//
					// This way, back-pressure is actually determined by the reading side,
					// since _read has to be called to start processing a new chunk.  However,
					// a pathological inflate type of transform can cause excessive buffering
					// here.  For example, imagine a stream where every byte of input is
					// interpreted as an integer from 0-255, and then results in that many
					// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
					// 1kb of data being output.  In this case, you could write a very small
					// amount of input, and end up with a very large amount of output.  In
					// such a pathological inflating mechanism, there'd be no way to tell
					// the system to stop doing the transform.  A single 4MB write could
					// cause the system to run out of memory.
					//
					// However, even in such a pathological case, only a single written chunk
					// would be consumed, and then the rest would wait (un-transformed) until
					// the results of the previous transformed chunk were consumed.

					module.exports = Transform;

					var Duplex = require('./_stream_duplex');

					/*<replacement>*/
					var util = require('core-util-is');
					util.inherits = require('inherits');
					/*</replacement>*/

					util.inherits(Transform, Duplex);

					function TransformState(options, stream) {
						this.afterTransform = function(er, data) {
							return afterTransform(stream, er, data);
						};

						this.needTransform = false;
						this.transforming = false;
						this.writecb = null;
						this.writechunk = null;
					}

					function afterTransform(stream, er, data) {
						var ts = stream._transformState;
						ts.transforming = false;

						var cb = ts.writecb;

						if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

						ts.writechunk = null;
						ts.writecb = null;

						if (!util.isNullOrUndefined(data)) stream.push(data);

						if (cb) cb(er);

						var rs = stream._readableState;
						rs.reading = false;
						if (rs.needReadable || rs.length < rs.highWaterMark) {
							stream._read(rs.highWaterMark);
						}
					}

					function Transform(options) {
						if (!(this instanceof Transform)) return new Transform(options);

						Duplex.call(this, options);

						this._transformState = new TransformState(options, this);

						// when the writable side finishes, then flush out anything remaining.
						var stream = this;

						// start out asking for a readable event once data is transformed.
						this._readableState.needReadable = true;

						// we have implemented the _read method, and done the other things
						// that Readable wants before the first _read call, so unset the
						// sync guard flag.
						this._readableState.sync = false;

						this.once('prefinish', function() {
							if (util.isFunction(this._flush))
								this._flush(function(er) {
									done(stream, er);
								});
							else done(stream);
						});
					}

					Transform.prototype.push = function(chunk, encoding) {
						this._transformState.needTransform = false;
						return Duplex.prototype.push.call(this, chunk, encoding);
					};

					// This is the part where you do stuff!
					// override this function in implementation classes.
					// 'chunk' is an input chunk.
					//
					// Call `push(newChunk)` to pass along transformed output
					// to the readable side.  You may call 'push' zero or more times.
					//
					// Call `cb(err)` when you are done with this chunk.  If you pass
					// an error, then that'll put the hurt on the whole operation.  If you
					// never call cb(), then you'll never get another chunk.
					Transform.prototype._transform = function(chunk, encoding, cb) {
						throw new Error('not implemented');
					};

					Transform.prototype._write = function(chunk, encoding, cb) {
						var ts = this._transformState;
						ts.writecb = cb;
						ts.writechunk = chunk;
						ts.writeencoding = encoding;
						if (!ts.transforming) {
							var rs = this._readableState;
							if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
						}
					};

					// Doesn't matter what the args are here.
					// _transform does all the work.
					// That we got here means that the readable side wants more data.
					Transform.prototype._read = function(n) {
						var ts = this._transformState;

						if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
							ts.transforming = true;
							this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
						} else {
							// mark that we need a transform, so that any data that comes in
							// will get processed, now that we've asked for it.
							ts.needTransform = true;
						}
					};

					function done(stream, er) {
						if (er) return stream.emit('error', er);

						// if there's nothing in the write buffer, then that means
						// that nothing more will ever be provided
						var ws = stream._writableState;
						var ts = stream._transformState;

						if (ws.length) throw new Error('calling transform done when ws.length != 0');

						if (ts.transforming) throw new Error('calling transform done when still transforming');

						return stream.push(null);
					}
				},
				{'./_stream_duplex': 70, 'core-util-is': 37, inherits: 49},
			],
			74: [
				function(require, module, exports) {
					(function(process) {
						// Copyright Joyent, Inc. and other Node contributors.
						//
						// Permission is hereby granted, free of charge, to any person obtaining a
						// copy of this software and associated documentation files (the
						// "Software"), to deal in the Software without restriction, including
						// without limitation the rights to use, copy, modify, merge, publish,
						// distribute, sublicense, and/or sell copies of the Software, and to permit
						// persons to whom the Software is furnished to do so, subject to the
						// following conditions:
						//
						// The above copyright notice and this permission notice shall be included
						// in all copies or substantial portions of the Software.
						//
						// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
						// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
						// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
						// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
						// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
						// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
						// USE OR OTHER DEALINGS IN THE SOFTWARE.

						// A bit simpler than readable streams.
						// Implement an async ._write(chunk, cb), and it'll handle all
						// the drain event emission and buffering.

						module.exports = Writable;

						/*<replacement>*/
						var Buffer = require('buffer').Buffer;
						/*</replacement>*/

						Writable.WritableState = WritableState;

						/*<replacement>*/
						var util = require('core-util-is');
						util.inherits = require('inherits');
						/*</replacement>*/

						var Stream = require('stream');

						util.inherits(Writable, Stream);

						function WriteReq(chunk, encoding, cb) {
							this.chunk = chunk;
							this.encoding = encoding;
							this.callback = cb;
						}

						function WritableState(options, stream) {
							var Duplex = require('./_stream_duplex');

							options = options || {};

							// the point at which write() starts returning false
							// Note: 0 is a valid value, means that we always return false if
							// the entire buffer is not flushed immediately on write()
							var hwm = options.highWaterMark;
							var defaultHwm = options.objectMode ? 16 : 16 * 1024;
							this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

							// object stream flag to indicate whether or not this stream
							// contains buffers or objects.
							this.objectMode = !!options.objectMode;

							if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

							// cast to ints.
							this.highWaterMark = ~~this.highWaterMark;

							this.needDrain = false;
							// at the start of calling end()
							this.ending = false;
							// when end() has been called, and returned
							this.ended = false;
							// when 'finish' is emitted
							this.finished = false;

							// should we decode strings into buffers before passing to _write?
							// this is here so that some node-core streams can optimize string
							// handling at a lower level.
							var noDecode = options.decodeStrings === false;
							this.decodeStrings = !noDecode;

							// Crypto is kind of old and crusty.  Historically, its default string
							// encoding is 'binary' so we have to make this configurable.
							// Everything else in the universe uses 'utf8', though.
							this.defaultEncoding = options.defaultEncoding || 'utf8';

							// not an actual buffer we keep track of, but a measurement
							// of how much we're waiting to get pushed to some underlying
							// socket or file.
							this.length = 0;

							// a flag to see when we're in the middle of a write.
							this.writing = false;

							// when true all writes will be buffered until .uncork() call
							this.corked = 0;

							// a flag to be able to tell if the onwrite cb is called immediately,
							// or on a later tick.  We set this to true at first, because any
							// actions that shouldn't happen until "later" should generally also
							// not happen before the first write call.
							this.sync = true;

							// a flag to know if we're processing previously buffered items, which
							// may call the _write() callback in the same tick, so that we don't
							// end up in an overlapped onwrite situation.
							this.bufferProcessing = false;

							// the callback that's passed to _write(chunk,cb)
							this.onwrite = function(er) {
								onwrite(stream, er);
							};

							// the callback that the user supplies to write(chunk,encoding,cb)
							this.writecb = null;

							// the amount that is being written when _write is called.
							this.writelen = 0;

							this.buffer = [];

							// number of pending user-supplied write callbacks
							// this must be 0 before 'finish' can be emitted
							this.pendingcb = 0;

							// emit prefinish if the only thing we're waiting for is _write cbs
							// This is relevant for synchronous Transform streams
							this.prefinished = false;

							// True if the error was already emitted and should not be thrown again
							this.errorEmitted = false;
						}

						function Writable(options) {
							var Duplex = require('./_stream_duplex');

							// Writable ctor is applied to Duplexes, though they're not
							// instanceof Writable, they're instanceof Readable.
							if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

							this._writableState = new WritableState(options, this);

							// legacy.
							this.writable = true;

							Stream.call(this);
						}

						// Otherwise people can pipe Writable streams, which is just wrong.
						Writable.prototype.pipe = function() {
							this.emit('error', new Error('Cannot pipe. Not readable.'));
						};

						function writeAfterEnd(stream, state, cb) {
							var er = new Error('write after end');
							// TODO: defer error events consistently everywhere, not just the cb
							stream.emit('error', er);
							process.nextTick(function() {
								cb(er);
							});
						}

						// If we get something that is not a buffer, string, null, or undefined,
						// and we're not in objectMode, then that's an error.
						// Otherwise stream chunks are all considered to be of length=1, and the
						// watermarks determine how many objects to keep in the buffer, rather than
						// how many bytes or characters.
						function validChunk(stream, state, chunk, cb) {
							var valid = true;
							if (!util.isBuffer(chunk) && !util.isString(chunk) && !util.isNullOrUndefined(chunk) && !state.objectMode) {
								var er = new TypeError('Invalid non-string/buffer chunk');
								stream.emit('error', er);
								process.nextTick(function() {
									cb(er);
								});
								valid = false;
							}
							return valid;
						}

						Writable.prototype.write = function(chunk, encoding, cb) {
							var state = this._writableState;
							var ret = false;

							if (util.isFunction(encoding)) {
								cb = encoding;
								encoding = null;
							}

							if (util.isBuffer(chunk)) encoding = 'buffer';
							else if (!encoding) encoding = state.defaultEncoding;

							if (!util.isFunction(cb)) cb = function() {};

							if (state.ended) writeAfterEnd(this, state, cb);
							else if (validChunk(this, state, chunk, cb)) {
								state.pendingcb++;
								ret = writeOrBuffer(this, state, chunk, encoding, cb);
							}

							return ret;
						};

						Writable.prototype.cork = function() {
							var state = this._writableState;

							state.corked++;
						};

						Writable.prototype.uncork = function() {
							var state = this._writableState;

							if (state.corked) {
								state.corked--;

								if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.buffer.length) clearBuffer(this, state);
							}
						};

						function decodeChunk(state, chunk, encoding) {
							if (!state.objectMode && state.decodeStrings !== false && util.isString(chunk)) {
								chunk = new Buffer(chunk, encoding);
							}
							return chunk;
						}

						// if we're already writing something, then just put this
						// in the queue, and wait our turn.  Otherwise, call _write
						// If we return false, then we need a drain event, so set that flag.
						function writeOrBuffer(stream, state, chunk, encoding, cb) {
							chunk = decodeChunk(state, chunk, encoding);
							if (util.isBuffer(chunk)) encoding = 'buffer';
							var len = state.objectMode ? 1 : chunk.length;

							state.length += len;

							var ret = state.length < state.highWaterMark;
							// we must ensure that previous needDrain will not be reset to false.
							if (!ret) state.needDrain = true;

							if (state.writing || state.corked) state.buffer.push(new WriteReq(chunk, encoding, cb));
							else doWrite(stream, state, false, len, chunk, encoding, cb);

							return ret;
						}

						function doWrite(stream, state, writev, len, chunk, encoding, cb) {
							state.writelen = len;
							state.writecb = cb;
							state.writing = true;
							state.sync = true;
							if (writev) stream._writev(chunk, state.onwrite);
							else stream._write(chunk, encoding, state.onwrite);
							state.sync = false;
						}

						function onwriteError(stream, state, sync, er, cb) {
							if (sync)
								process.nextTick(function() {
									state.pendingcb--;
									cb(er);
								});
							else {
								state.pendingcb--;
								cb(er);
							}

							stream._writableState.errorEmitted = true;
							stream.emit('error', er);
						}

						function onwriteStateUpdate(state) {
							state.writing = false;
							state.writecb = null;
							state.length -= state.writelen;
							state.writelen = 0;
						}

						function onwrite(stream, er) {
							var state = stream._writableState;
							var sync = state.sync;
							var cb = state.writecb;

							onwriteStateUpdate(state);

							if (er) onwriteError(stream, state, sync, er, cb);
							else {
								// Check if we're actually ready to finish, but don't emit yet
								var finished = needFinish(stream, state);

								if (!finished && !state.corked && !state.bufferProcessing && state.buffer.length) {
									clearBuffer(stream, state);
								}

								if (sync) {
									process.nextTick(function() {
										afterWrite(stream, state, finished, cb);
									});
								} else {
									afterWrite(stream, state, finished, cb);
								}
							}
						}

						function afterWrite(stream, state, finished, cb) {
							if (!finished) onwriteDrain(stream, state);
							state.pendingcb--;
							cb();
							finishMaybe(stream, state);
						}

						// Must force callback to be called on nextTick, so that we don't
						// emit 'drain' before the write() consumer gets the 'false' return
						// value, and has a chance to attach a 'drain' listener.
						function onwriteDrain(stream, state) {
							if (state.length === 0 && state.needDrain) {
								state.needDrain = false;
								stream.emit('drain');
							}
						}

						// if there's something in the buffer waiting, then process it
						function clearBuffer(stream, state) {
							state.bufferProcessing = true;

							if (stream._writev && state.buffer.length > 1) {
								// Fast case, write everything using _writev()
								var cbs = [];
								for (var c = 0; c < state.buffer.length; c++) cbs.push(state.buffer[c].callback);

								// count the one we are adding, as well.
								// TODO(isaacs) clean this up
								state.pendingcb++;
								doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
									for (var i = 0; i < cbs.length; i++) {
										state.pendingcb--;
										cbs[i](err);
									}
								});

								// Clear buffer
								state.buffer = [];
							} else {
								// Slow case, write chunks one-by-one
								for (var c = 0; c < state.buffer.length; c++) {
									var entry = state.buffer[c];
									var chunk = entry.chunk;
									var encoding = entry.encoding;
									var cb = entry.callback;
									var len = state.objectMode ? 1 : chunk.length;

									doWrite(stream, state, false, len, chunk, encoding, cb);

									// if we didn't call the onwrite immediately, then
									// it means that we need to wait until it does.
									// also, that means that the chunk and cb are currently
									// being processed, so move the buffer counter past them.
									if (state.writing) {
										c++;
										break;
									}
								}

								if (c < state.buffer.length) state.buffer = state.buffer.slice(c);
								else state.buffer.length = 0;
							}

							state.bufferProcessing = false;
						}

						Writable.prototype._write = function(chunk, encoding, cb) {
							cb(new Error('not implemented'));
						};

						Writable.prototype._writev = null;

						Writable.prototype.end = function(chunk, encoding, cb) {
							var state = this._writableState;

							if (util.isFunction(chunk)) {
								cb = chunk;
								chunk = null;
								encoding = null;
							} else if (util.isFunction(encoding)) {
								cb = encoding;
								encoding = null;
							}

							if (!util.isNullOrUndefined(chunk)) this.write(chunk, encoding);

							// .end() fully uncorks
							if (state.corked) {
								state.corked = 1;
								this.uncork();
							}

							// ignore unnecessary end() calls.
							if (!state.ending && !state.finished) endWritable(this, state, cb);
						};

						function needFinish(stream, state) {
							return state.ending && state.length === 0 && !state.finished && !state.writing;
						}

						function prefinish(stream, state) {
							if (!state.prefinished) {
								state.prefinished = true;
								stream.emit('prefinish');
							}
						}

						function finishMaybe(stream, state) {
							var need = needFinish(stream, state);
							if (need) {
								if (state.pendingcb === 0) {
									prefinish(stream, state);
									state.finished = true;
									stream.emit('finish');
								} else prefinish(stream, state);
							}
							return need;
						}

						function endWritable(stream, state, cb) {
							state.ending = true;
							finishMaybe(stream, state);
							if (cb) {
								if (state.finished) process.nextTick(cb);
								else stream.once('finish', cb);
							}
							state.ended = true;
						}
					}.call(this, require('_process')));
				},
				{'./_stream_duplex': 70, _process: 11, buffer: 3, 'core-util-is': 37, inherits: 49, stream: 26},
			],
			75: [
				function(require, module, exports) {
					(function(process) {
						exports = module.exports = require('./lib/_stream_readable.js');
						exports.Stream = require('stream');
						exports.Readable = exports;
						exports.Writable = require('./lib/_stream_writable.js');
						exports.Duplex = require('./lib/_stream_duplex.js');
						exports.Transform = require('./lib/_stream_transform.js');
						exports.PassThrough = require('./lib/_stream_passthrough.js');
						if (!process.browser && process.env.READABLE_STREAM === 'disable') {
							module.exports = require('stream');
						}
					}.call(this, require('_process')));
				},
				{'./lib/_stream_duplex.js': 70, './lib/_stream_passthrough.js': 71, './lib/_stream_readable.js': 72, './lib/_stream_transform.js': 73, './lib/_stream_writable.js': 74, _process: 11, stream: 26},
			],
			76: [
				function(require, module, exports) {
					// Copyright Joyent, Inc. and other Node contributors.
					//
					// Permission is hereby granted, free of charge, to any person obtaining a
					// copy of this software and associated documentation files (the
					// "Software"), to deal in the Software without restriction, including
					// without limitation the rights to use, copy, modify, merge, publish,
					// distribute, sublicense, and/or sell copies of the Software, and to permit
					// persons to whom the Software is furnished to do so, subject to the
					// following conditions:
					//
					// The above copyright notice and this permission notice shall be included
					// in all copies or substantial portions of the Software.
					//
					// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
					// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
					// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
					// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
					// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
					// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
					// USE OR OTHER DEALINGS IN THE SOFTWARE.

					var Buffer = require('buffer').Buffer;

					var isBufferEncoding =
						Buffer.isEncoding ||
						function(encoding) {
							switch (encoding && encoding.toLowerCase()) {
								case 'hex':
								case 'utf8':
								case 'utf-8':
								case 'ascii':
								case 'binary':
								case 'base64':
								case 'ucs2':
								case 'ucs-2':
								case 'utf16le':
								case 'utf-16le':
								case 'raw':
									return true;
								default:
									return false;
							}
						};

					function assertEncoding(encoding) {
						if (encoding && !isBufferEncoding(encoding)) {
							throw new Error('Unknown encoding: ' + encoding);
						}
					}

					// StringDecoder provides an interface for efficiently splitting a series of
					// buffers into a series of JS strings without breaking apart multi-byte
					// characters. CESU-8 is handled as part of the UTF-8 encoding.
					//
					// @TODO Handling all encodings inside a single object makes it very difficult
					// to reason about this code, so it should be split up in the future.
					// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
					// points as used by CESU-8.
					var StringDecoder = (exports.StringDecoder = function(encoding) {
						this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
						assertEncoding(encoding);
						switch (this.encoding) {
							case 'utf8':
								// CESU-8 represents each of Surrogate Pair by 3-bytes
								this.surrogateSize = 3;
								break;
							case 'ucs2':
							case 'utf16le':
								// UTF-16 represents each of Surrogate Pair by 2-bytes
								this.surrogateSize = 2;
								this.detectIncompleteChar = utf16DetectIncompleteChar;
								break;
							case 'base64':
								// Base-64 stores 3 bytes in 4 chars, and pads the remainder.
								this.surrogateSize = 3;
								this.detectIncompleteChar = base64DetectIncompleteChar;
								break;
							default:
								this.write = passThroughWrite;
								return;
						}

						// Enough space to store all bytes of a single character. UTF-8 needs 4
						// bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
						this.charBuffer = new Buffer(6);
						// Number of bytes received for the current incomplete multi-byte character.
						this.charReceived = 0;
						// Number of bytes expected for the current incomplete multi-byte character.
						this.charLength = 0;
					});

					// write decodes the given buffer and returns it as JS string that is
					// guaranteed to not contain any partial multi-byte characters. Any partial
					// character found at the end of the buffer is buffered up, and will be
					// returned when calling write again with the remaining bytes.
					//
					// Note: Converting a Buffer containing an orphan surrogate to a String
					// currently works, but converting a String to a Buffer (via `new Buffer`, or
					// Buffer#write) will replace incomplete surrogates with the unicode
					// replacement character. See https://codereview.chromium.org/121173009/ .
					StringDecoder.prototype.write = function(buffer) {
						var charStr = '';
						// if our last write ended with an incomplete multibyte character
						while (this.charLength) {
							// determine how many remaining bytes this buffer has to offer for this char
							var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;

							// add the new bytes to the char buffer
							buffer.copy(this.charBuffer, this.charReceived, 0, available);
							this.charReceived += available;

							if (this.charReceived < this.charLength) {
								// still not enough chars in this buffer? wait for more ...
								return '';
							}

							// remove bytes belonging to the current character from the buffer
							buffer = buffer.slice(available, buffer.length);

							// get the character that was split
							charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

							// CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
							var charCode = charStr.charCodeAt(charStr.length - 1);
							if (charCode >= 0xd800 && charCode <= 0xdbff) {
								this.charLength += this.surrogateSize;
								charStr = '';
								continue;
							}
							this.charReceived = this.charLength = 0;

							// if there are no more bytes in this buffer, just emit our char
							if (buffer.length === 0) {
								return charStr;
							}
							break;
						}

						// determine and set charLength / charReceived
						this.detectIncompleteChar(buffer);

						var end = buffer.length;
						if (this.charLength) {
							// buffer the incomplete character bytes we got
							buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
							end -= this.charReceived;
						}

						charStr += buffer.toString(this.encoding, 0, end);

						var end = charStr.length - 1;
						var charCode = charStr.charCodeAt(end);
						// CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
						if (charCode >= 0xd800 && charCode <= 0xdbff) {
							var size = this.surrogateSize;
							this.charLength += size;
							this.charReceived += size;
							this.charBuffer.copy(this.charBuffer, size, 0, size);
							buffer.copy(this.charBuffer, 0, 0, size);
							return charStr.substring(0, end);
						}

						// or just emit the charStr
						return charStr;
					};

					// detectIncompleteChar determines if there is an incomplete UTF-8 character at
					// the end of the given buffer. If so, it sets this.charLength to the byte
					// length that character, and sets this.charReceived to the number of bytes
					// that are available for this character.
					StringDecoder.prototype.detectIncompleteChar = function(buffer) {
						// determine how many bytes we have to check at the end of this buffer
						var i = buffer.length >= 3 ? 3 : buffer.length;

						// Figure out if one of the last i bytes of our buffer announces an
						// incomplete char.
						for (; i > 0; i--) {
							var c = buffer[buffer.length - i];

							// See http://en.wikipedia.org/wiki/UTF-8#Description

							// 110XXXXX
							if (i == 1 && c >> 5 == 0x06) {
								this.charLength = 2;
								break;
							}

							// 1110XXXX
							if (i <= 2 && c >> 4 == 0x0e) {
								this.charLength = 3;
								break;
							}

							// 11110XXX
							if (i <= 3 && c >> 3 == 0x1e) {
								this.charLength = 4;
								break;
							}
						}
						this.charReceived = i;
					};

					StringDecoder.prototype.end = function(buffer) {
						var res = '';
						if (buffer && buffer.length) res = this.write(buffer);

						if (this.charReceived) {
							var cr = this.charReceived;
							var buf = this.charBuffer;
							var enc = this.encoding;
							res += buf.slice(0, cr).toString(enc);
						}

						return res;
					};

					function passThroughWrite(buffer) {
						return buffer.toString(this.encoding);
					}

					function utf16DetectIncompleteChar(buffer) {
						this.charReceived = buffer.length % 2;
						this.charLength = this.charReceived ? 2 : 0;
					}

					function base64DetectIncompleteChar(buffer) {
						this.charReceived = buffer.length % 3;
						this.charLength = this.charReceived ? 3 : 0;
					}
				},
				{buffer: 3},
			],
			77: [
				function(require, module, exports) {
					(function(Buffer) {
						/**
						 * Convert a typed array to a Buffer without a copy
						 *
						 * Author:   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
						 * License:  MIT
						 *
						 * `npm install typedarray-to-buffer`
						 */

						module.exports = function(arr) {
							if (typeof Buffer._augment === 'function' && Buffer.TYPED_ARRAY_SUPPORT) {
								// If `Buffer` is from the `buffer` module and this browser supports typed arrays,
								// then augment it with all the `Buffer` methods.
								return Buffer._augment(arr);
							} else {
								// Otherwise, fallback to creating a `Buffer` with a copy.
								return new Buffer(arr);
							}
						};
					}.call(this, require('buffer').Buffer));
				},
				{buffer: 3},
			],
			78: [
				function(require, module, exports) {
					module.exports = hasKeys;

					function hasKeys(source) {
						return source !== null && (typeof source === 'object' || typeof source === 'function');
					}
				},
				{},
			],
			79: [
				function(require, module, exports) {
					var Keys = require('object-keys');
					var hasKeys = require('./has-keys');

					module.exports = extend;

					function extend() {
						var target = {};

						for (var i = 0; i < arguments.length; i++) {
							var source = arguments[i];

							if (!hasKeys(source)) {
								continue;
							}

							var keys = Keys(source);

							for (var j = 0; j < keys.length; j++) {
								var name = keys[j];
								target[name] = source[name];
							}
						}

						return target;
					}
				},
				{'./has-keys': 78, 'object-keys': 66},
			],
		},
		{},
		[32]
	)(32);
});
