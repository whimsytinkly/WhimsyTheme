// CSS Generator

// Generates CSS based on the current theme settings
function generateThemeCSS() {
    let css = ``;

    for (const key of Object.keys(theme)) {
        const input = document.querySelector(
            `[aria-label="${labels[key]} hex value"]`
        );

        const value = input ? input.value.trim() : theme[key];

        css += `  --color-${key}: ${value};
`;
    }

    css += `  --color-focus: var(--color-primary);
`;

    for (const key of ["primary", "secondary", "danger"]) {
        const input = document.querySelector(
            `[aria-label="${labels[key]} hex value"]`
        );

        const value = input.value.trim();
        const textColor = getReadableText(value);

        css += `  --color-${key}-text: ${textColor};
`;
    }

    return css;
}

// Generates the complete root variables
function generateRootCSS() {
    return `:root {
${generateThemeCSS()}
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --shadow-sm: 0 2px 8px rgb(0 0 0 / .08);
  --shadow-md: 0 8px 24px rgb(0 0 0 / .10);

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-xxl: 48px;

  --font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
  `;
}

// Generates CSS for buttons
function generateButtonCSS() {
    return `
.button {
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  font-weight: 700;
}

.button-primary {
  color: var(--color-primary-text);
  background: var(--color-primary);
}

.button-secondary {
  color: var(--color-secondary-text);
  background: var(--color-secondary);
}

.button-danger {
  color: var(--color-danger-text);
  background: var(--color-danger);
}
`;
}

// Generates CSS for links
function generateLinkCSS() {
    return `
a {
  color: var(--color-accent);
  text-decoration: underline;
}

.preview-header a {
  font-weight: 600;
  text-underline-offset: 3px;
}
`;
}

// Generates CSS for button states
function generateButtonStateCSS() {
    return `
.button {
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.button:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 12px color-mix(
    in srgb,
    var(--color-accent) 85%,
    transparent
  );
}

.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.button:active {
  transform: translateY(1px);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;
}

// Generates CSS for input fields
function generateInputCSS() {
    return `
.input {
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  background: var(--color-surface);
}
`;
}

// Generates CSS for Cards
function generateCardCSS() {
    return `
.card {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.card-header,
.card-content {
  padding: var(--space-lg);
}

.card-header {
  border-bottom: 1px solid var(--color-border);
}

.card-header h3,
.card-header p {
  margin: 0;
}

.card-header p {
  margin-top: var(--space-xs);
}

.card-content {
  display: grid;
  gap: var(--space-sm);
}
`;
}

// Generates CSS for Notices
function generateNoticeCSS() {
    return `
.notice {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid color-mix(in srgb, var(--color-warning) 45%, var(--color-border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
}
`;
}

// Generates the complete CSS for the theme
function generateCSS() {
    css = `${generateRootCSS()}
    ${generateButtonCSS()}
    ${generateButtonStateCSS()}
    ${generateLinkCSS()}
    ${generateInputCSS()}
    ${generateCardCSS()}
    ${generateNoticeCSS()}
  `;
    document.querySelector("#generated-css").textContent = css;
}