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
  const group =
    tab.groupId > 0 ? await chrome.tabGroups.get(tab.groupId) : null;

  element.querySelector(".title").textContent = title;
  element.querySelector(".pathname").textContent = pathname;
  element.querySelector("#tab-id").textContent = tab.id;
  element.querySelector("#group-name").textContent = group?.title;

  element
    .querySelector("#group-info")
    .addEventListener("click", () => ungroupTabEventListener(tab, title));

  element
    .querySelector("#close")
    .addEventListener("click", () => closeTabEventListener(tab, title));

  element.querySelector("a").addEventListener("click", async () => {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  });

  elements.add(element);
} // For

ul.addEventListener("close-tab", ({ detail }) => onCloseTabCallback(detail));

ul.addEventListener("ungroup-tab", ({ detail }) =>
  onUngroupTabCallback(detail)
);

ul.append(...elements);

//===================================================================

const button = document.querySelector("button");

button.addEventListener("click", async () => {
  const tabIds = tabs.map(({ id }) => id);
  const group = await chrome.tabs.group({ tabIds });
  await chrome.tabGroups.update(group, { title: "DOCS" });
});

//===================================================================

chrome.tabGroups.onUpdated.addListener((event) => {
  console.log(event);
});

//===================================================================

async function closeTabEventListener(tab, title) {
  const option = confirm(`Are you sure you want to close tab "${title}"?`);
  if (option) {
    const event = new CustomEvent("close-tab", { detail: { tabId: tab.id } });
    await chrome.tabs.remove(tab.id, () => ul.dispatchEvent(event));
  }
}

function onCloseTabCallback(detail) {
  const lis = document.querySelectorAll("li");
  for (const li of lis) {
    const id = li.querySelector("#tab-id").textContent;
    console.log(detail, id);
    if (Number(id) === Number(detail.tabId)) {
      ul.removeChild(li);
      break;
    }
  }
}

async function ungroupTabEventListener({ id }, title) {
  const option = confirm(`Ungroup tab "${title}"?`);
  if (option) {
    const event = new CustomEvent("ungroup-tab", { detail: { tabId: id } });
    await chrome.tabs.ungroup(id, () => ul.dispatchEvent(event));
  }
}

async function onUngroupTabCallback({ tabId }) {
  const lis = document.querySelectorAll("li");
  for (const li of lis) {
    const id = li.querySelector("#tab-id").textContent;
    if (Number(id) === Number(tabId)) {
      li.querySelectorAll("#group-name")[0].textContent = "";
      break;
    }
  }
}
