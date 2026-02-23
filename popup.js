(function () {
  const promptsEl = document.getElementById('prompts');
  const promptCountEl = document.getElementById('promptCount');
  const imageInputEl = document.getElementById('imageInput');
  const imageListEl = document.getElementById('imageList');
  const imageMappingEl = document.getElementById('imageMapping');
  const generateBtn = document.getElementById('generateBtn');
  const statusEl = document.getElementById('status');

  function parsePrompts(text) {
    const blocks = text.split(/\n\s*\n/).map(function (b) {
      return b.trim();
    }).filter(Boolean);
    return blocks;
  }

  function updatePromptCount() {
    const prompts = parsePrompts(promptsEl.value);
    promptCountEl.textContent = prompts.length ? prompts.length + ' prompt(s)' : '';
  }

  promptsEl.addEventListener('input', updatePromptCount);
  updatePromptCount();

  const imageFiles = [];

  imageInputEl.addEventListener('change', function () {
    const files = Array.from(this.files || []);
    imageFiles.length = 0;
    imageListEl.innerHTML = '';
    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.startsWith('image/')) continue;
      imageFiles.push(files[i]);
      const div = document.createElement('div');
      div.className = 'image-item';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(files[i]);
      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.min = '1';
      numInput.placeholder = 'Prompt #';
      numInput.dataset.fileIndex = String(i);
      numInput.addEventListener('input', updateMappingSummary);
      div.appendChild(img);
      div.appendChild(document.createTextNode('→ Prompt index:'));
      div.appendChild(numInput);
      imageListEl.appendChild(div);
    }
    updateMappingSummary();
  });

  function updateMappingSummary() {
    const inputs = imageListEl.querySelectorAll('input[type="number"]');
    const lines = [];
    inputs.forEach(function (inp, i) {
      const idx = parseInt(inp.value, 10);
      if (!isNaN(idx) && idx >= 1) {
        lines.push('Image ' + (i + 1) + ' → Prompt ' + idx);
      }
    });
    imageMappingEl.textContent = lines.length ? lines.join(', ') : '';
  }

  function getImageMap() {
    const map = {};
    const inputs = imageListEl.querySelectorAll('input[type="number"]');
    inputs.forEach(function (inp, i) {
      const idx = parseInt(inp.value, 10);
      if (!isNaN(idx) && idx >= 1 && imageFiles[i]) {
        map[idx - 1] = i;
      }
    });
    return map;
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status' + (isError ? ' error' : ' success');
  }

  generateBtn.addEventListener('click', function () {
    const raw = promptsEl.value.trim();
    const prompts = parsePrompts(raw);
    if (!prompts.length) {
      setStatus('Enter at least one prompt (separate with blank lines).', true);
      return;
    }

    const imageMap = getImageMap();
    const imageDataUrls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      imageDataUrls.push(null);
    }

    generateBtn.disabled = true;
    setStatus('Preparing…');

    function readNextImage(fileIndex, onDone) {
      if (fileIndex >= imageFiles.length) {
        onDone();
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        imageDataUrls[fileIndex] = reader.result;
        readNextImage(fileIndex + 1, onDone);
      };
      reader.onerror = function () {
        readNextImage(fileIndex + 1, onDone);
      };
      reader.readAsDataURL(imageFiles[fileIndex]);
    }

    readNextImage(0, function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0];
        if (!tab || !tab.id) {
          setStatus('No active tab.', true);
          generateBtn.disabled = false;
          return;
        }
        const url = tab.url || '';
        if (!/^https:\/\/(www\.)?meta\.ai\//.test(url)) {
          setStatus('Open https://meta.ai/media first.', true);
          generateBtn.disabled = false;
          return;
        }
        setStatus('Starting bulk generation…');
        chrome.tabs.sendMessage(tab.id, {
          type: 'BULK_GENERATE',
          payload: {
            prompts: prompts,
            imageMap: imageMap,
            imageDataUrls: imageDataUrls
          }
        }, function (response) {
          if (chrome.runtime.lastError) {
            setStatus('Error: ' + (chrome.runtime.lastError.message || 'Could not reach page.'), true);
          } else if (response && response.error) {
            setStatus(response.error, true);
          } else {
            setStatus('Generation started. Keep the tab open.');
          }
          generateBtn.disabled = false;
        });
      });
    });
  });
})();
