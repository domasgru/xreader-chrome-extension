export function getAllHrefs(node: Element) {
  try {
    const hrefs = new Set();
    const anchors = node.querySelectorAll("a"); // Select all <a> tags within the provided node

    anchors.forEach((anchor) => {
      if (anchor.href) {
        hrefs.add(anchor.href);
      }
    });

    return Array.from(hrefs); // Convert Set to array
  } catch (error) {
    console.log(error);
  }
}

export function getAllTextNodes(node: Element) {
  const textNodes = [];
  const xpathResult = document.evaluate(
    ".//text()[normalize-space()]",
    node,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < xpathResult.snapshotLength; i++) {
    textNodes.push(xpathResult.snapshotItem(i));
  }

  return textNodes;
}
