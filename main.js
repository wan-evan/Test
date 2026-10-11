const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const form = document.querySelector(".contact-form");
const status = document.querySelector(".form-status");
const workCards = document.querySelectorAll(".work-card");

const themeKey = "theme";

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const dark = theme === "dark";
  root.dataset.theme = dark ? "dark" : "light";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.textContent = dark ? "浅色" : "深色";
}

themeButton.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(themeKey, next);
  } catch (error) {
    /* 隐私模式写不进时，这次访问仍然切换。 */
  }
  applyTheme(next);
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  let saved = null;
  try {
    saved = localStorage.getItem(themeKey);
  } catch (error) {
    saved = null;
  }
  if (saved !== "light" && saved !== "dark") applyTheme(systemTheme());
});

applyTheme(root.dataset.theme || systemTheme());

function setNav(open) {
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.textContent = open ? "关闭" : "菜单";
}

navToggle.addEventListener("click", () => {
  setNav(!nav.classList.contains("is-open"));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setNav(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setNav(false);
});

workCards.forEach((card) => {
  const button = card.querySelector(".work-select");
  card.addEventListener("click", () => {
    const selected = card.classList.contains("is-selected");
    workCards.forEach((item) => {
      item.classList.remove("is-selected");
      item.querySelector(".work-select").setAttribute("aria-pressed", "false");
    });
    if (!selected) {
      card.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
    }
  });
});

const fields = [
  { id: "name", message: "请填写姓名。", test: (value) => value.trim().length > 0 },
  {
    id: "email",
    message: "请填写有效的邮箱。",
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  },
  { id: "message", message: "请填写留言。", test: (value) => value.trim().length > 0 },
];

function showError(input, error, message) {
  input.setAttribute("aria-invalid", "true");
  error.hidden = false;
  error.textContent = message;
}

function clearError(input, error) {
  input.removeAttribute("aria-invalid");
  error.hidden = true;
  error.textContent = "";
}

fields.forEach(({ id }) => {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  input.addEventListener("input", () => clearError(input, error));
});

const submitButton = form.querySelector('[type="submit"]');

form.noValidate = true;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  let firstInvalid = null;

  fields.forEach(({ id, message, test }) => {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);
    if (test(input.value)) {
      clearError(input, error);
      return;
    }
    showError(input, error, message);
    if (!firstInvalid) firstInvalid = input;
  });

  if (firstInvalid) {
    status.hidden = true;
    status.textContent = "";
    firstInvalid.focus();
    return;
  }

  submitButton.disabled = true;
  status.hidden = false;
  status.textContent = "正在发送…";

  try {
    const payload = Object.fromEntries(new FormData(form));
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.success) {
      status.textContent = "没有发送成功，请稍后再试。";
      return;
    }
    form.reset();
    status.textContent = "已发送，请到邮箱查收。";
  } catch (error) {
    status.textContent = "没有发送成功，请稍后再试。";
  } finally {
    submitButton.disabled = false;
  }
});
