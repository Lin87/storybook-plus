const ANIMATION_EVENTS = ["webkitAnimationEnd", "mozAnimationEnd", "animationend"];

/**
 * Parses fetched text payloads into XML when the source URL is XML.
 * @param {string} url Resource URL used to infer response type.
 * @param {string} text Raw response text.
 * @returns {string|Document}
 * @throws {Error} Throws when XML parsing fails.
 */
function parseByType(url, text) {
  const normalizedUrl = String(url || "").toLowerCase();

  if (normalizedUrl.includes(".xml")) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    if (xml.querySelector("parsererror")) {
      const error = new Error("XML parse error");
      error.type = "parsererror";
      throw error;
    }

    return xml;
  }

  return text;
}

/**
 * Appends a script tag and resolves once it has loaded.
 * @param {string} url Script URL.
 * @returns {Promise<string>}
 */
export function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve(url);
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

/**
 * Sends a HEAD request to confirm a resource exists.
 * @param {string} url Resource URL.
 * @returns {Promise<{url: string}>}
 * @throws {Error} Throws for non-2xx responses.
 */
export async function headRequest(url) {
  const response = await fetch(url, { method: "HEAD" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return { url };
}

/**
 * Fetches a URL and returns parsed content based on file type.
 * @param {string} url Resource URL.
 * @returns {Promise<string|Document>}
 * @throws {Error} Throws for non-2xx responses or invalid XML.
 */
export async function fetchResource(url) {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  return parseByType(url, text);
}

/**
 * Runs a callback once on the next CSS animation end event for an element.
 * @param {Element} element Target element.
 * @param {(event: Event) => void} callback Callback invoked on animation end.
 * @returns {void}
 */
export function onAnimationEnd(element, callback) {
  if (!element || typeof callback !== "function") {
    return;
  }

  const wrapped = (event) => {
    ANIMATION_EVENTS.forEach((eventName) => {
      element.removeEventListener(eventName, wrapped);
    });

    callback.call(element, event);
  };

  ANIMATION_EVENTS.forEach((eventName) => {
    element.addEventListener(eventName, wrapped);
  });
}

/**
 * Adds delegated event handling under a root element.
 * @param {Element|Document} root Delegation root.
 * @param {string} eventName Event type.
 * @param {string} selector Descendant selector to match.
 * @param {(event: Event) => void} handler Handler invoked with `this` bound to the matched element.
 * @returns {() => void} Cleanup function to remove the listener.
 */
export function onDelegate(root, eventName, selector, handler) {
  if (!root || typeof handler !== "function") {
    return () => {};
  }

  const listener = (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const target = event.target.closest(selector);

    if (target && root.contains(target)) {
      handler.call(target, event);
    }
  };

  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
}

/**
 * Checks whether an element is currently rendered with measurable layout.
 * @param {Element|null|undefined} element Element to test.
 * @returns {boolean}
 */
export function isVisible(element) {
  if (!element) {
    return false;
  }

  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

/**
 * Tests browser storage availability for localStorage/sessionStorage.
 * @param {"localStorage"|"sessionStorage"|string} storageType Storage key on `window`.
 * @returns {boolean}
 */
export function supportsStorage(storageType) {
  try {
    const storage = window[storageType];
    const key = "__sbplus_storage_test__";
    storage.setItem(key, key);
    storage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Normalizes a mixed XML/DOM context value to a single Element.
 * @param {Array|NodeList|HTMLCollection|Node|Object|null} data Source context value.
 * @returns {Element|null}
 */
export function getContextElement(data) {
  if (!data) {
    return null;
  }

  if (data.nodeType === Node.ELEMENT_NODE) {
    return data;
  }

  if (Array.isArray(data) || data instanceof NodeList || data instanceof HTMLCollection) {
    return data[0] || null;
  }

  if (typeof data === "object" && data[0] && data[0].nodeType === Node.ELEMENT_NODE) {
    return data[0];
  }

  return null;
}

/**
 * Gets an attribute value from an element.
 * @param {Element|null} node Source node.
 * @param {string} name Attribute name.
 * @returns {string}
 */
export function getNodeAttr(node, name) {
  if (!node) {
    return "";
  }

  const value = node.getAttribute(name);
  return value == null ? "" : value;
}

/**
 * Randomizes an array in place using Fisher-Yates shuffle.
 * @param {Array<any>} array Array to shuffle.
 * @returns {void}
 */
export function shuffle(array) {
  let randomIndex;
  let temp;

  for (let index = array.length; index; index--) {
    randomIndex = Math.floor(Math.random() * index);
    temp = array[index - 1];
    array[index - 1] = array[randomIndex];
    array[randomIndex] = temp;
  }
}

/**
 * Converts `mm:ss` or `hh:mm:ss` time strings into total seconds.
 * @param {string|number} str Time value.
 * @returns {number}
 */
export function toSeconds(str) {
  const arr = String(str).split(":");

  if (arr.length >= 3) {
    return Number(arr[0] * 60) * 60 + Number(arr[1] * 60) + Number(arr[2]);
  }

  return Number(arr[0] * 60) + Number(arr[1]);
}

/**
 * Tests whether a string resembles an absolute URL.
 * @param {string} s Candidate URL string.
 * @returns {boolean}
 */
export function isUrl(s) {
  const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(s);
}

/**
 * Sends analytics data by appending a hidden tracking image.
 * @param {string} requestURL Fully built analytics request URL.
 * @returns {boolean}
 */
export function sendData(requestURL) {
  const scriptElement = document.createElement("img");
  scriptElement.setAttribute("src", requestURL);
  scriptElement.setAttribute("alt", "");
  scriptElement.setAttribute("aria-hidden", "true");
  scriptElement.style.display = "none";
  document.getElementsByTagName("body")[0].appendChild(scriptElement);
  return true;
}
