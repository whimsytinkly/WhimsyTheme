
const theme = {
  primary: "#7C5CFF",
  secondary: "#E9E4FF",
  accent: "#7C5CFF",
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
  accent: "Accent",
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

// Function to calculate brightness of a hex color
function getBrightness(hex) {
  // Convert hex to RGB
  const rgb = parseInt(hex.slice(1), 16);

  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Function to determine readable text color based on background brightness
function getReadableText(background) {
  if (getBrightness(background) > 0.7) {
    return "#000000";
  }
  return "#FFFFFF";
}

function applyTheme() {
  for (const key of Object.keys(theme)) {
    const input = [...document.querySelectorAll(".hex-input")]
      .find(
        el =>
          el.getAttribute("aria-label") ===
          `${labels[key]} hex value`
      );

    const value = input.value.trim();

    if (!validHex(value)) {
      input.classList.add("invalid");
      input.focus();
      return false;
    }

    document.documentElement.style.setProperty(
      variables[key],
      value
    );

    if (["primary", "secondary", "danger"].includes(key)) {
      const textColor = getReadableText(value);

      document.documentElement.style.setProperty(
        `--color-${key}-text`,
        textColor
      );
    }
  }

  generateCSS();
  return true;
}

document.querySelector("#apply-theme").addEventListener("click", () => {
  applyTheme()
});

// Toggle between preview and CSS view
document.querySelectorAll(".view-toggle-button").forEach(button => {
  button.addEventListener("click", () => {
    const isPreview = button.dataset.view === "preview";

    document.querySelector("#preview-view").style.display =
      isPreview ? "block" : "none";

    document.querySelector("#css-view").style.display =
      isPreview ? "none" : "block";

    document.querySelectorAll(".view-toggle-button").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });
  });
});

// Copy generated CSS to clipboard
document.querySelector("#copy-css").addEventListener("click", async () => {
  const css = document.querySelector("#generated-css").textContent;

  await navigator.clipboard.writeText(css);

  const button = document.querySelector("#copy-css");
  button.textContent = "Copied!";

  setTimeout(() => {
    button.textContent = "Copy";
  }, 1500);
});


// Preset themes
const presetSelect = document.querySelector("#theme-preset");

for (const [key, preset] of Object.entries(presets)) {
  const option = document.createElement("option");

  option.value = key;
  option.textContent = preset.name;

  presetSelect.append(option);
}

presetSelect.addEventListener("change", () => {
  const preset = presets[presetSelect.value];

  if (!preset) {
    return;
  }

  applyGeneratedTheme(preset);
});