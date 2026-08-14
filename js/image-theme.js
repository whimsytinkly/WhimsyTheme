const imageInput = document.querySelector("#theme-image");
const imagePreview = document.querySelector("#theme-image-preview");

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
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
        const surface = getSurface(colorDataWithLightness);

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
    return colorData[0];
}

// Function to get the surface color from the second most frequent color
function getSurface(colorData) {
    return colorData[1];
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
        )
        .sort((a, b) => b.saturation - a.saturation);

    return candidates[0] || colorData[0];
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
        )
        .sort((a, b) => b.saturation - a.saturation);

    return candidates[0] || primary;
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
    if (background.lightness > 0.45) {
        return [...colorData]
            .sort((a, b) => a.lightness - b.lightness)[0];
    }

    return [...colorData]
        .sort((a, b) => b.lightness - a.lightness)[0];
}

// Function to get the subtext color based on lightness, excluding the text color
function getSubText(colorData, background) {
    if (background.lightness > 0.45) {
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
    text,
    subtext,
    border
}) {
    const generatedColors = {
        background,
        surface,
        primary,
        secondary,
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
}

clearImageError();