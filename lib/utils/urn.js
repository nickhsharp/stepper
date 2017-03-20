"use strict";

const PARTIAL_REGEX = "(?:/([^:]+?))?";
const WILDCARD_REGEX = "([^/:]+?)";
const MULTI_LEVEL_WILDCARD_REGEX = "(.+?)";

function createRegex(urn) {
  const pattern = createPattern(urn, true);
  return new RegExp(pattern, "i");
}

function createPattern(urn, useRegexEscape) {
  const escape = useRegexEscape ? "(?:\\/|:)" : "(?:\/|:)";
  const pattern = urn.split(":").map((part, index) => {
    if (part === "*") {
      return WILDCARD_REGEX;
    } else if (part === "#") {
      return MULTI_LEVEL_WILDCARD_REGEX;
    } else if (part.indexOf("/?") > -1) {
      const preSlash = part.split("/")[0];
      return `${preSlash}${PARTIAL_REGEX}`;
    }

    return part;
  }).join(escape);

  return `^${pattern}$`;
}

module.exports = {
  createRegex: createRegex,
  createRegexString: createPattern,
};
