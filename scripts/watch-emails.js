// scripts/watch-emails.js
const mjml = require("mjml");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const chokidar = require("chokidar");

const BUILD_DIR = path.join(__dirname, "../build");
const SRC_DIR = path.join(__dirname, "../src");

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

async function buildFile(filepath) {
  try {
    console.log(`Building: ${filepath}`);
    const mjmlContent = fs.readFileSync(filepath, "utf8");
    const filename = path.basename(filepath);

    const htmlOutput = mjml(mjmlContent, {
      minify: false,
      validationLevel: "strict",
    });

    if (htmlOutput.errors.length > 0) {
      console.error(`❌ Error in ${filename}:`, htmlOutput.errors);
      return;
    }

    const formattedHtml = await prettier.format(htmlOutput.html, {
      parser: "html",
      printWidth: 100,
      htmlWhitespaceSensitivity: "strict",
    });

    const htmlFileName = path.basename(filename, ".mjml") + ".html";
    const htmlPath = path.join(BUILD_DIR, htmlFileName);
    fs.writeFileSync(htmlPath, formattedHtml);

    console.log(`✅ Built ${filename} -> ${htmlFileName}`);
  } catch (err) {
    console.error(`Error processing ${filepath}:`, err);
  }
}

// Initial build
console.log("🚀 Initial build...");
fs.readdirSync(SRC_DIR)
  .filter((file) => file.endsWith(".mjml"))
  .forEach((file) => buildFile(path.join(SRC_DIR, file)));

// Set up watcher
console.log("👀 Watching for changes...");

const watcher = chokidar.watch(SRC_DIR, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
});

// Add event listeners
watcher
  .on("add", (path) => buildFile(path))
  .on("change", (path) => buildFile(path))
  .on("unlink", (filepath) => {
    const htmlPath = path.join(
      BUILD_DIR,
      path.basename(filepath, ".mjml") + ".html"
    );
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
      console.log(`🗑️  Removed ${path.basename(htmlPath)}`);
    }
  });

// Prevent the script from exiting
process.stdin.resume();

// Handle exit
process.on("SIGINT", function () {
  console.log("Closing...");
  process.exit();
});
