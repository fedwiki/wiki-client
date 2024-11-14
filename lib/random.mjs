// We create strings of hexidecimal digits representing a
// given number of random bytes. We use short strings for
// cache busting, medium strings for keys linking dom to
// model, and, longer still strings for lifetime identity
// of story elements.

export function randomByte () { return (((1+Math.random())*0x100)|0).toString(16).substring(1); }

export function randomBytes (n) { return [...Array(n)].map((_i) => randomByte()).join(''); }

export function itemId () { return randomBytes(8); }

