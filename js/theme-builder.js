const theme = {
  primary: "#7C5CFF",
  secondary: "#E9E4FF",
  danger: "#D9534F",
  success: "#3F9F6B",
  warning: "#D99A2B",
  background: "#F6F4F1",
  surface: "#FFFFFF",
  text: "#25232A",
  subtext: "#716D78",
  border: "#DDD9E1"
};

const labels = {
  primary: "Primary",
  secondary: "Secondary",
  danger: "Danger",
  success: "Success",
  warning: "Warning",
  background: "Background",
  surface: "Surface",
  text: "Text",
  subtext: "Subtext",
  border: "Border"
};

const variables = Object.fromEntries(
  Object.keys(theme).map(key => [key, `--color-${key}`])
);

const controls = document.querySelector("#color-controls");

function validHex(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

for (const [key, value] of Object.entries(theme)) {
  const row = document.createElement("div");
  row.className = "color-control";

  const label = document.createElement("label");
  label.textContent = labels[key];

  const wrap = document.createElement("div");
  wrap.className = "color-input-wrap";

  const picker = document.createElement("input");
  picker.type = "color";
  picker.className = "color-picker";
  picker.value = value;

  const hex = document.createElement("input");
  hex.type = "text";
  hex.className = "hex-input";
  hex.value = value;
  hex.maxLength = 7;
  hex.setAttribute("aria-label", `${labels[key]} hex value`);

  picker.addEventListener("input", () => {
    hex.value = picker.value.toUpperCase();
    hex.classList.remove("invalid");
  });

  hex.addEventListener("input", () => {
    const value = hex.value.trim();
    if (validHex(value)) {
      picker.value = value;
      hex.classList.remove("invalid");
    } else {
      hex.classList.add("invalid");
    }
  });

  wrap.append(picker, hex);
  row.append(label, wrap);
  controls.append(row);
}

document.querySelector("#apply-theme").addEventListener("click", () => {
  for (const key of Object.keys(theme)) {
    const input = [...document.querySelectorAll(".hex-input")]
      .find(el => el.getAttribute("aria-label") === `${labels[key]} hex value`);

    const value = input.value.trim();

    if (!validHex(value)) {
      input.classList.add("invalid");
      input.focus();
      return;
    }

    document.documentElement.style.setProperty(variables[key], value);
  }
});
