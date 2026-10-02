// Support both Chrome (callback/promise) and Firefox (browser.*) namespaces.
const extensionApi = typeof chrome !== 'undefined' ? chrome : typeof browser !== 'undefined' ? browser : null;

if (extensionApi?.runtime) {
  extensionApi.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedText") {
      try {
        const text = window.getSelection().toString();
        sendResponse({ text });
      } catch (e) {
        sendResponse({ text: "" });
      }
    } else if (request.action === "insertText") {
      try {
        insertTextIntoActiveField(request.text);
        sendResponse({ success: true });
      } catch (e) {
        console.error("Insert failed", e);
        sendResponse({ success: false, error: e.message });
      }
    }
  });
}

function insertTextIntoActiveField(text) {
  const activeElement = document.activeElement;

  const isTextInput =
    activeElement &&
    (activeElement.tagName === "TEXTAREA" ||
      (activeElement.tagName === "INPUT" &&
        ["text", "search", "url", "tel", "email", "password", ""].includes(
          (activeElement.getAttribute("type") || "text").toLowerCase()
        )));

  if (activeElement && isTextInput) {
    const start = activeElement.selectionStart ?? activeElement.value.length;
    const end = activeElement.selectionEnd ?? start;
    const currentValue = activeElement.value;

    activeElement.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    const newPos = start + text.length;
    activeElement.selectionStart = activeElement.selectionEnd = newPos;

    // React/Vue controlled inputs need a native setter + InputEvent to notice.
    activeElement.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
    activeElement.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (activeElement && activeElement.isContentEditable) {
    const sel = window.getSelection();
    if (!sel) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    throw new Error("No active editable element to insert text into.");
  }
}