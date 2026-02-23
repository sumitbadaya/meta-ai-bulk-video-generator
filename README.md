# Meta AI Bulk Video Generator

A Chrome extension that bulk-generates videos on [Meta AI Media](https://meta.ai/media) from multiple prompts, with optional image-to-prompt linking and 16:9 aspect ratio.

---

## What It Does

- **Bulk prompts**: Enter multiple video prompts (one per block, separated by a blank line). The extension fills the Meta AI media composer and clicks **Animate** for each prompt automatically.
- **4-second gap**: Waits 4 seconds between starting each generation so the page stays responsive.
- **Image linking**: Optionally attach images to specific prompts. You upload images, assign each image a **prompt index** (1 = first prompt, 2 = second, etc.). That image is attached to Meta AI before the corresponding prompt is sent.
- **16:9 aspect ratio**: Before each generation, the extension tries to set the aspect ratio to 16:9 on the page (instead of the default 9:16).
- **Waits for image upload**: When an image is linked to a prompt, the extension waits until Meta AI has finished processing the image (Animate button becomes enabled) before entering the prompt and clicking Animate, so timing issues are avoided.

---

## Requirements

- **Chrome** (or a Chromium-based browser that supports Manifest V3 extensions).
- An open tab on **https://meta.ai/media** (or https://www.meta.ai/media). You must be on the Media page when you click **Generate videos** in the extension.

---

## Installation

1. **Download or clone** this project so you have a folder containing `manifest.json`, `popup.html`, `popup.js`, `popup.css`, and `content.js`.

2. Open Chrome and go to: chrome://extensions/

3. Turn **Developer mode** on (toggle in the top-right corner).

4. Click **Load unpacked**.

5. Select the project folder (the one that contains `manifest.json`).

6. The extension **Meta AI Bulk Video Generator** should appear in your extensions list. Pin it to the toolbar if you like (click the puzzle icon, then the pin next to the extension name).

---

## How to Use

### 1. Open Meta AI Media

- In Chrome, go to **https://meta.ai/media** (or https://www.meta.ai/media) and leave this tab open. The extension only works when this tab is active and on the Media page.

### 2. Open the Extension

- Click the extension icon in the Chrome toolbar to open the **Bulk Video Generator** popup.

### 3. Enter Prompts

- In the **Prompts** text area, type one prompt per “block,” with a **blank line** between blocks.  
  Example:

A cat walking in the rain

A dog running on the beach

Sunset over mountains

- The popup shows how many prompts were detected (e.g. `3 prompt(s)`).

### 4. (Optional) Add Images and Index Them

- Click **Choose Files** (or the file input under “Images”) and select one or more image files.
- For each image, a row appears with a thumbnail and a **Prompt index** field.
- **Prompt index** = which prompt (1-based) this image should be used with:
  - **1** = first prompt  
  - **2** = second prompt  
  - **3** = third prompt  
  - etc.
- You can leave the index empty for an image if you don’t want it used.
- Example: You have 3 prompts. You upload 2 images and set:
  - Image 1 → Prompt index **1**
  - Image 2 → Prompt index **3**  
  Then the first prompt gets image 1, the third gets image 2, and the second prompt has no image.

### 5. Generate Videos

- Click **Generate videos**.
- The extension will:
  - Run only if the current tab is on `meta.ai` (or `www.meta.ai`).
  - For each prompt in order:
    - If that prompt has a linked image: attach the image, wait until the Animate button is enabled (image processed), then enter the prompt, set 16:9 if possible, and click Animate.
    - If no image: enter the prompt, set 16:9 if possible, and click Animate.
  - Wait 4 seconds, then move to the next prompt.
- Keep the **meta.ai/media** tab open and visible until all generations have started. The status message in the popup will indicate when generation has been started.

---

## Tips

- **Blank lines matter**: Prompts are split by blank lines. A single line with no blank line in between counts as one prompt.
- **Prompt index**: Use integers 1, 2, 3, … corresponding to the order of your prompts. Index 1 = first prompt, 2 = second, etc.
- **No image for a prompt**: Leave the prompt index blank for that image, or simply don’t assign that image to any prompt. Only prompts that have an index in the image list will receive an image.
- **Reload after Meta AI changes**: If Meta AI updates their Media page layout, reload the extension (chrome://extensions → Reload) and refresh the meta.ai/media tab.

---

## Files in This Extension

| File          | Purpose                                                                 |
|---------------|-------------------------------------------------------------------------|
| `manifest.json` | Extension config (name, permissions, content script, popup).          |
| `popup.html`  | Popup layout (prompts textarea, image upload, Generate button).          |
| `popup.css`   | Popup styling.                                                         |
| `popup.js`    | Parses prompts, builds image→prompt index map, sends message to tab.    |
| `content.js`  | Injected on meta.ai; fills prompt, attaches images, sets 16:9, clicks Animate, handles timing. |

---

## Permissions

- **activeTab** / **scripting**: So the extension can run in the current tab when you click the icon.
- **https://www.meta.ai/*** and **https://meta.ai/***: So the content script can run on the Meta AI Media page and interact with it.

---

## Troubleshooting

- **“Open https://meta.ai/media first”**: The active tab must be on `meta.ai` (or `www.meta.ai`). Open the Media page and try again.
- **“Could not find prompt input”**: Reload the meta.ai/media tab and try again. If Meta AI changed their page, the extension may need selector updates.
- **“Could not find Animate button”**: Usually a timing or layout issue. Ensure the Media page is fully loaded and no modal is covering the composer. Reload the tab and extension and try again.
- **“Image upload timed out”**: The Animate button didn’t become enabled within ~25 seconds after attaching the image. Check your connection and try with a smaller image or try again.
