const ANIMATION_EVENTS = ["webkitAnimationEnd", "mozAnimationEnd", "animationend"];

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

export function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve(url);
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

export async function headRequest(url) {
  const response = await fetch(url, { method: "HEAD" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return { url };
}

export async function fetchResource(url) {
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  return parseByType(url, text);
}

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

export function isVisible(element) {
  if (!element) {
    return false;
  }

  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}
