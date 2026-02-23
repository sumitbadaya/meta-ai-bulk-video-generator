(function () {
  const GAP_MS = 4000;
  const ASPECT_16_9 = '16:9';

  function findPromptInput() {
    const selectors = [
      'textarea[placeholder*="animation"]',
      'textarea[placeholder*="Describe your"]',
      '[contenteditable="true"][data-placeholder]',
      'div[role="textbox"][contenteditable="true"]',
      '[contenteditable="true"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="Describe"]',
      'textarea[placeholder*="Message"]',
      'form textarea',
      'main textarea',
      'textarea'
    ];
    for (let i = 0; i < selectors.length; i++) {
      const el = document.querySelector(selectors[i]);
      if (el && isVisible(el)) return { el: el, contentEditable: el.getAttribute('contenteditable') === 'true' };
    }
    return null;
  }

  function dismissDropdowns() {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    var inputInfo = findPromptInput();
    if (inputInfo) inputInfo.el.focus();
  }

  function hasAnimateText(el) {
    var text = (el.textContent || el.innerText || '').trim();
    return text === 'Animate' || (text.indexOf('Animate') !== -1 && text.length < 25);
  }

  function findAnimateButton(requireEnabled) {
    var allClickable = document.querySelectorAll('button, [role="button"], a[role="button"]');
    for (var i = 0; i < allClickable.length; i++) {
      var el = allClickable[i];
      if (requireEnabled && el.disabled) continue;
      if (hasAnimateText(el)) return el;
    }
    var fallback = document.querySelectorAll('button');
    for (var k = 0; k < fallback.length; k++) {
      var btn = fallback[k];
      if (requireEnabled && btn.disabled) continue;
      if (hasAnimateText(btn)) return btn;
    }
    return null;
  }

  function findSubmitButton() {
    var btn = findAnimateButton(true);
    if (btn && isVisible(btn)) return btn;
    var inputInfo = findPromptInput();
    var root = inputInfo ? inputInfo.el.closest('form') || inputInfo.el.closest('[role="form"]') || inputInfo.el.closest('div[class]') : null;
    var scope = root || document;
    function isSendLike(el) {
      var label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('data-label') || el.textContent || '').toLowerCase();
      if (label.indexOf('animate') !== -1 || label.indexOf('send') !== -1 || label.indexOf('submit') !== -1) return true;
      return el.querySelector('svg') && (el.getAttribute('type') === 'submit' || el.tagName === 'BUTTON');
    }
    var inScope = scope.querySelectorAll('button[type="submit"], button[aria-label], button[title], [role="button"]');
    for (var j = inScope.length - 1; j >= 0; j--) {
      var b = inScope[j];
      if (!b.disabled && (hasAnimateText(b) || isSendLike(b)) && isVisible(b)) return b;
    }
    return findAnimateButton(true);
  }

  function waitForAnimateEnabled(maxWaitMs) {
    var intervalMs = 500;
    return new Promise(function (resolve, reject) {
      var elapsed = 0;
      function check() {
        var btn = findAnimateButton(true);
        if (btn) {
          resolve();
          return;
        }
        elapsed += intervalMs;
        if (elapsed >= maxWaitMs) {
          reject(new Error('Animate button did not become enabled in time. Image may still be uploading.'));
          return;
        }
        setTimeout(check, intervalMs);
      }
      setTimeout(check, intervalMs);
    });
  }

  function clickSubmitButton(btn) {
    btn.focus();
    btn.click();
  }

  function findFileInput() {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (let i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.accept === '' || (inp.accept && inp.accept.indexOf('image') !== -1)) return inp;
    }
    return document.querySelector('input[type="file"]') || null;
  }

  function findAttachmentButton() {
    const inputInfo = findPromptInput();
    const root = inputInfo ? inputInfo.el.closest('form') || inputInfo.el.closest('div[class]') : document.body;
    const all = root.querySelectorAll('button, [role="button"], a[role="button"]');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.querySelector('input[type="file"]')) continue;
      var t = (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
      if (t === '+' || t === 'Add' || t === 'Upload' || t === 'Attach' || t.toLowerCase().indexOf('attach') !== -1 || t.toLowerCase().indexOf('upload') !== -1) return el;
    }
    return null;
  }

  function findAspectRatioDropdown() {
    const all = document.querySelectorAll('button, [role="button"], [role="listbox"], div[class]');
    for (let i = 0; i < all.length; i++) {
      var t = (all[i].textContent || '').trim();
      if ((t.indexOf('9:16') !== -1 || t.indexOf('16:9') !== -1 || t === 'Video') && isVisible(all[i])) return all[i];
    }
    return null;
  }

  function findAspectRatio16x9Option() {
    const all = document.querySelectorAll('button, [role="button"], [role="option"], div[role="menuitem"], li');
    for (let i = 0; i < all.length; i++) {
      var t = (all[i].textContent || '').trim();
      if (t.indexOf('16:9') !== -1 && isVisible(all[i])) return all[i];
    }
    return null;
  }

  function selectAspectRatio16x9() {
    var opener = findAspectRatioDropdown();
    if (opener) {
      opener.click();
      return new Promise(function (resolve) {
        setTimeout(function () {
          var opt = findAspectRatio16x9Option();
          if (opt) opt.click();
          resolve();
        }, 300);
      });
    }
    var direct = findAspectRatio16x9Option();
    if (direct) {
      direct.click();
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
  }

  function setContentEditableText(el, text) {
    el.focus();
    if (document.execCommand) {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
    } else {
      if (el.innerText !== undefined) {
        el.innerText = text;
      } else {
        el.textContent = text;
      }
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setTextareaValue(el, text) {
    el.focus();
    try {
      const desc = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (desc && desc.set) desc.set.call(el, text);
      else el.value = text;
    } catch (e) {
      el.value = text;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setPrompt(inputInfo, text) {
    if (inputInfo.contentEditable) {
      setContentEditableText(inputInfo.el, text);
    } else {
      setTextareaValue(inputInfo.el, text);
    }
  }

  function clearFileInput(fileInput) {
    fileInput.value = '';
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function triggerFileUpload(fileInput, dataUrl, callback) {
    if (!dataUrl) {
      clearFileInput(fileInput);
      setTimeout(callback, 100);
      return;
    }
    fetch(dataUrl)
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(callback, 500);
      })
      .catch(function () { setTimeout(callback, 100); });
  }

  function runOne(payload, index, imageMap, imageDataUrls, callback) {
    const prompt = payload.prompts[index];
    if (!prompt) {
      callback(null);
      return;
    }

    const inputInfo = findPromptInput();
    if (!inputInfo) {
      callback('Could not find prompt input on page.');
      return;
    }

    const fileInput = findFileInput();
    const imageFileIndex = imageMap[index];
    const dataUrl = imageFileIndex != null && imageDataUrls[imageFileIndex] ? imageDataUrls[imageFileIndex] : null;

    function afterAttach() {
      setPrompt(inputInfo, prompt);
      selectAspectRatio16x9().then(function () {
        dismissDropdowns();
        setTimeout(function () {
          var btn = findSubmitButton();
          if (!btn) {
            callback('Could not find Animate button. Ensure the media page is loaded and the prompt box has text.');
            return;
          }
          clickSubmitButton(btn);
          callback(null);
        }, 500);
      });
    }

    function doAttachThenProceed() {
      triggerFileUpload(fileInput, dataUrl, function () {
        waitForAnimateEnabled(25000).then(afterAttach, function (err) {
          callback(err && err.message ? err.message : 'Image upload timed out. Try again.');
        });
      });
    }

    if (fileInput && dataUrl) {
      var attachBtn = findAttachmentButton();
      if (attachBtn) {
        attachBtn.click();
        setTimeout(doAttachThenProceed, 400);
      } else {
        doAttachThenProceed();
      }
    } else {
      if (fileInput) clearFileInput(fileInput);
      setTimeout(afterAttach, 200);
    }
  }

  function runBulk(payload, sendResponse) {
    const prompts = payload.prompts || [];
    const imageMap = payload.imageMap || {};
    const imageDataUrls = payload.imageDataUrls || [];
    let current = 0;
    let responded = false;

    function reply(obj) {
      if (responded) return;
      responded = true;
      sendResponse(obj);
    }

    function next() {
      if (current >= prompts.length) return;
      runOne(payload, current, imageMap, imageDataUrls, function (err) {
        if (err) {
          reply({ error: err });
          return;
        }
        if (!responded) reply({ ok: true });
        current += 1;
        if (current < prompts.length) {
          setTimeout(next, GAP_MS);
        }
      });
    }

    next();
  }

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message.type !== 'BULK_GENERATE' || !message.payload) {
      sendResponse({ error: 'Invalid message' });
      return true;
    }
    if (!findPromptInput()) {
      sendResponse({ error: 'Could not find prompt input. Open https://www.meta.ai/media and try again.' });
      return true;
    }
    runBulk(message.payload, sendResponse);
    return true;
  });
})();
