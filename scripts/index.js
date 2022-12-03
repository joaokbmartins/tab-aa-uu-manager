const tabs = await chrome.tabs.query({
  url: [
    "https://developer.chrome.com/docs/webstore/*",
    "https://developer.chrome.com/docs/extensions/*",
  ],
});
const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

const ul = document.querySelector("ul");
const template = document.getElementById("li_template");
const elements = new Set();

for (const tab of tabs) {
  const element = template.content.firstElementChild.cloneNode(true);

  const title = tab.title.split("-")[0].trim();
  const pathname = new URL(tab.url).pathname.slice("/docs".length);

  element.querySelector(".title").textContent = title;
  element.querySelector(".pathname").textContent = pathname;
  element.querySelector("#tab-id").textContent = tab.id;
  element.querySelector("a").addEventListener("click", async () => {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  });
  element.querySelector("#close").addEventListener("click", async (title) => {
    const option = confirm("Are you sure you want to close tab: ", title);
    if (option) {
      const event = new CustomEvent("test", { detail: { tabId: tab.id } });
      await chrome.tabs.remove(tab.id, () => {
        ul.dispatchEvent(event);
      });
    }
  });

  elements.add(element);
}

ul.addEventListener("test", (event) => {
  const lis = document.querySelectorAll("li");
  for (const li of lis) {
    const id = li.querySelector("span").textContent;
    if (id == event.detail.tabId) {
      ul.removeChild(li);
      break;
    }
  }
});
ul.append(...elements);

//===================================================================

const button = document.querySelector("button");

button.addEventListener("click", async () => {
  const tabIds = tabs.map(({ id }) => id);
  const group = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(group, { title: "DOCS" });
});

//===================================================================
