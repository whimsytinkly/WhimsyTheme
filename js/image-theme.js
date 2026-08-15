const imageInput = document.querySelector("#theme-image");
const imagePreview = document.querySelector("#theme-image-preview");
const LIGHTNESS_THRESHOLD = 0.45;

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
        imagePreview.hidden = true;
        return;
    }

    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        showImageError(
            "Please upload a PNG, JPG, JPEG, or WebP image."
        );

        imageInput.value = "";
        imagePreview.hidden = true;
        return;
    }

    const url = URL.createObjectURL(file);

    imagePreview.src = url;
    imagePreview.hidden = false;

    const image = new Image();

    image.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const pixels = imageData.data;
        const colorData = getColorFrequency(pixels);
        console.table(colorData);
        if (colorData.length < 2) {
            showImageError(
                "Not enough colours were found to generate a theme."
            );
            return;
        }

        const colorDataWithSaturation =
            getColorSaturation(colorData);

        const colorDataWithLightness =
            getColorLightness(colorDataWithSaturation);

        const background = getBackground(colorDataWithLightness);
        let surface = getSurface(colorDataWithLightness);

        // Ensure that the surface color is compatible with the background color
        surface = normalizeSurface(background, surface);

        const primary = getPrimary(
            colorDataWithSaturation,
            background,
            surface
        );

        const secondary = getSecondary(
            colorDataWithSaturation,
            primary,
            background,
            surface
        );

        const accent = normalizeAccent(primary, background);

        const text = getText(
            colorDataWithLightness,
            background
        );

        const subtext = getSubText(
            colorDataWithLightness,
            background
        );

        const border = getBorder(subtext, surface);


        applyGeneratedTheme({
            background,
            surface,
            primary,
            secondary,
            accent,
            text,
            subtext,
            border
        });
    };
    image.onerror = () => {
        showImageError(
            "We couldn't read this image. Please try another image."
        );
    };

    image.src = url;
});

/**
 * Calculates the frequency of colors in the image
 * Used for Background, Surface color selection
 */

// Function to calculate the frequency of colors in the image
function getColorFrequency(pixels) {
    const colorCounts = {};
    const bucketSize = 16;

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a === 0) {
            continue;
        }

        const bucketR = Math.floor(r / bucketSize) * bucketSize;
        const bucketG = Math.floor(g / bucketSize) * bucketSize;
        const bucketB = Math.floor(b / bucketSize) * bucketSize;

        const hex =
            "#" +
            [bucketR, bucketG, bucketB]
                .map(value => value.toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase();

        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    return Object.entries(colorCounts)
        .map(([hex, pixels]) => ({
            hex,
            pixels
        }))
        .sort((a, b) => b.pixels - a.pixels);
}

// Function to get the background color from the most frequent color
function getBackground(colorData) {
    return normalizeBackground(colorData[0]);
}

// Function to get the surface color from the second most frequent color
function getSurface(colorData) {
    return normalizeBackground(colorData[1]);
}


/**
 * Calculates the saturation of colors in the image
 * Used for Primary, Secondary color selection
 */

// Function to calculate the saturation of a hex color
function getSaturation(hex) {
    const rgb = parseInt(hex.slice(1), 16);

    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max === 0) {
        return 0;
    }

    return (max - min) / max;
}

// Function to get the saturation of all colors in the color data
function getColorSaturation(colorData) {
    return colorData.map(color => ({
        ...color,
        saturation: getSaturation(color.hex)
    }));
}

// Function to get the primary color based on saturation and pixel count
function getPrimary(colorData, background, surface) {
    const candidates = [...colorData]
        .filter(color => color.pixels >= 100)
        .filter(
            color =>
                getColorDistance(color.hex, background.hex) >= 60 &&
                getColorDistance(color.hex, surface.hex) >= 60
        );

    // Try to avoid saturation of 1, as it is just black :|
    const nonMaxSaturationCandidates = candidates.filter(
        color => color.saturation < 1
    );

    const usableCandidates =
        nonMaxSaturationCandidates.length > 0
            ? nonMaxSaturationCandidates
            : candidates;

    return [...usableCandidates]
        .sort((a, b) => b.saturation - a.saturation)[0]
        || colorData[0];
}

// Function to get the secondary color based on saturation and pixel count, excluding the primary color
function getSecondary(colorData, primary, background, surface) {
    const candidates = [...colorData]
        .filter(color => color.hex !== primary.hex)
        .filter(color => color.pixels >= 100)
        .filter(
            color =>
                getColorDistance(color.hex, background.hex) >= 60 &&
                getColorDistance(color.hex, surface.hex) >= 60
        );

    const nonMaxSaturationCandidates = candidates.filter(
        color => color.saturation < 1
    );

    const usableCandidates =
        nonMaxSaturationCandidates.length > 0
            ? nonMaxSaturationCandidates
            : candidates;

    return [...usableCandidates]
        .sort((a, b) => b.saturation - a.saturation)[0]
        || primary;
}

// Function to calculate the distance between two hex colors
function getColorDistance(hex1, hex2) {
    const rgb1 = parseInt(hex1.slice(1), 16);
    const rgb2 = parseInt(hex2.slice(1), 16);

    const r1 = (rgb1 >> 16) & 0xff;
    const g1 = (rgb1 >> 8) & 0xff;
    const b1 = rgb1 & 0xff;

    const r2 = (rgb2 >> 16) & 0xff;
    const g2 = (rgb2 >> 8) & 0xff;
    const b2 = rgb2 & 0xff;

    return Math.sqrt(
        (r1 - r2) ** 2 +
        (g1 - g2) ** 2 +
        (b1 - b2) ** 2
    );
}


/**
 * Calculates the lightness of colors in the image
 * Used for Text, SubText color selection
 */

// Function to calculate the lightness of a hex color
function getLightness(hex) {
    const rgb = parseInt(hex.slice(1), 16);

    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    return (max + min) / 2;
}

// Function to get the lightness of all colors in the color data
function getColorLightness(colorData) {
    return colorData.map(color => ({
        ...color,
        lightness: getLightness(color.hex)
    }));
}

// Function to get the text color based on lightness
function getText(colorData, background) {
    if (background.lightness > LIGHTNESS_THRESHOLD) {
        return [...colorData]
            .sort((a, b) => a.lightness - b.lightness)[0];
    }

    return [...colorData]
        .sort((a, b) => b.lightness - a.lightness)[0];
}

// Function to get the subtext color based on lightness, excluding the text color
function getSubText(colorData, background) {
    if (background.lightness > LIGHTNESS_THRESHOLD) {
        return [...colorData]
            .sort((a, b) => a.lightness - b.lightness)[1];
    }

    return [...colorData]
        .sort((a, b) => b.lightness - a.lightness)[1];
}

/**
 * Colour Blending time!
 * Used for Border color selection
 */

function blendColors(color1, color2, ratio) {
    const rgb1 = parseInt(color1.slice(1), 16);
    const rgb2 = parseInt(color2.slice(1), 16);

    const r1 = (rgb1 >> 16) & 0xff;
    const g1 = (rgb1 >> 8) & 0xff;
    const b1 = rgb1 & 0xff;

    const r2 = (rgb2 >> 16) & 0xff;
    const g2 = (rgb2 >> 8) & 0xff;
    const b2 = rgb2 & 0xff;

    const r = Math.round(r1 * ratio + r2 * (1 - ratio));
    const g = Math.round(g1 * ratio + g2 * (1 - ratio));
    const b = Math.round(b1 * ratio + b2 * (1 - ratio));

    return (
        "#" +
        [r, g, b]
            .map(value => value.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase()
    );
}

function getBorder(subtext, surface) {
    // Blend 25% text with 75% surface
    return blendColors(subtext.hex, surface.hex, 0.25);
}


/**
 * Applys the generated colors to the theme preview and updates the color controls
 */

function applyGeneratedTheme({
    background,
    surface,
    primary,
    secondary,
    accent,
    text,
    subtext,
    border
}) {
    const generatedColors = {
        background,
        surface,
        primary,
        secondary,
        accent,
        text,
        subtext,
        border
    };

    for (const [key, color] of Object.entries(generatedColors)) {
        const input = [...document.querySelectorAll(".hex-input")]
            .find(
                el =>
                    el.getAttribute("aria-label") ===
                    `${labels[key]} hex value`
            );

        if (!input) {
            continue;
        }

        input.value = color.hex ?? color;
        input.dispatchEvent(new Event("input"));
    }
    applyTheme();
}

/**
 * Handling for cursed images
 */

function normalizeBackground(color) {

    const rgb = parseInt(color.hex.slice(1), 16);

    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;

    // Convert RGB → HSL
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;

    const lightness = (max + min) / 2;

    let saturation = 0;

    if (max !== min) {
        const delta = max - min;
        saturation =
            delta /
            (1 - Math.abs(2 * lightness - 1));
    }

    // Only tone down very highly saturated backgrounds
    if (saturation < 0.70) {
        return color;
    }

    saturation = 0.5;

    // Convert HSL back to RGB
    const hue = getHue(r / 255, g / 255, b / 255);

    const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = lightness - c / 2;

    let r1 = 0;
    let g1 = 0;
    let b1 = 0;

    if (hue < 60) {
        r1 = c;
        g1 = x;
    } else if (hue < 120) {
        r1 = x;
        g1 = c;
    } else if (hue < 180) {
        g1 = c;
        b1 = x;
    } else if (hue < 240) {
        g1 = x;
        b1 = c;
    } else if (hue < 300) {
        r1 = x;
        b1 = c;
    } else {
        r1 = c;
        b1 = x;
    }

    const newR = Math.round((r1 + m) * 255);
    const newG = Math.round((g1 + m) * 255);
    const newB = Math.round((b1 + m) * 255);

    const hex =
        "#" +
        [newR, newG, newB]
            .map(value =>
                value.toString(16).padStart(2, "0")
            )
            .join("")
            .toUpperCase();

    return {
        ...color,
        hex,
        lightness: getLightness(hex)
    };
}

function getHue(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max === min) {
        return 0;
    }

    const delta = max - min;
    let hue;

    if (max === r) {
        hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
        hue = 60 * ((b - r) / delta + 2);
    } else {
        hue = 60 * ((r - g) / delta + 4);
    }

    if (hue < 0) {
        hue += 360;
    }

    return hue;
}

function getHueFromHex(hex) {
    const rgb = parseInt(hex.slice(1), 16);

    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    return getHue(r, g, b);
}

function hslToHex(hue, saturation, lightness) {
    const c =
        (1 - Math.abs(2 * lightness - 1)) *
        saturation;

    const x =
        c *
        (1 - Math.abs((hue / 60) % 2 - 1));

    const m = lightness - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (hue < 60) {
        r = c;
        g = x;
    } else if (hue < 120) {
        r = x;
        g = c;
    } else if (hue < 180) {
        g = c;
        b = x;
    } else if (hue < 240) {
        g = x;
        b = c;
    } else if (hue < 300) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    const newR = Math.round((r + m) * 255);
    const newG = Math.round((g + m) * 255);
    const newB = Math.round((b + m) * 255);

    return (
        "#" +
        [newR, newG, newB]
            .map(value =>
                value.toString(16).padStart(2, "0")
            )
            .join("")
            .toUpperCase()
    );
}

// Function to normalize the surface color based on the background color
function normalizeSurface(background, surface) {
    const backgroundIsLight =
        background.lightness >= LIGHTNESS_THRESHOLD;

    const surfaceIsLight =
        surface.lightness >= LIGHTNESS_THRESHOLD;

    // Background and surface are already compatible.
    if (backgroundIsLight === surfaceIsLight) {
        return surface;
    }

    // Move surface 70% toward background.
    const hex = blendColors(
        background.hex,
        surface.hex,
        0.6
    );

    return {
        ...surface,
        hex,
        lightness: getLightness(hex)
    };
}


 /**
  * Functions to normalize the primary color based on saturation and lightness
  * For accent colors, we want to avoid overly saturated colors that can be harsh on the eyes.
  */
 const ACCENT_SATURATION_MAX = 0.6;
 const ACCENT_LIGHTNESS_SHIFT = 0.15;

 function normalizeAccent(primary, background) {
     let lightness = getLightness(primary.hex);
     const saturation = getSaturation(primary.hex);

     // Shift the accent away from the background lightness
     if (background.lightness >= LIGHTNESS_THRESHOLD) {
         lightness -= ACCENT_LIGHTNESS_SHIFT;
     } else {
         lightness += ACCENT_LIGHTNESS_SHIFT;
     }

     // Keep lightness within a valid range
     lightness = Math.max(0, Math.min(1, lightness));

     // Tone down overly saturated colours.
     const adjustedSaturation =
         Math.min(saturation, ACCENT_SATURATION_MAX);

     const hex = hslToHex(
         getHueFromHex(primary.hex),
         adjustedSaturation,
         lightness
     );

     return {
         ...primary,
         hex,
         lightness: getLightness(hex)
     };
 }

/**
 * Functions to show and clear image errors
 */

function showImageError(message) {
    const error = document.querySelector("#theme-image-error");

    error.querySelector("span").textContent = message;
    error.style.display = "flex";
}

function clearImageError() {
    const error = document.querySelector("#theme-image-error");

    error.querySelector("span").textContent = "";
    error.style.display = "none";
    imagePreview.hidden = true;
}

clearImageError();