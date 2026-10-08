/**
 * An accent remap applied through data-tone. "merklon" and "neutral" ship
 * with the library; any other string works once a site defines
 * [data-tone="that-name"] in its own CSS.
 */
export type Tone = "merklon" | "neutral" | (string & {});
