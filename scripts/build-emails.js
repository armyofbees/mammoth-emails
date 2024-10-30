const mjml = require("mjml");
const fs = require("fs").promises;
const path = require("path");
const prettier = require("prettier");

const BUILD_DIR = path.join(__dirname, "../build");
const SRC_DIR = path.join(__dirname, "../src");

async function cleanBuildDir() {
  try {
    await fs.rm(BUILD_DIR, { recursive: true, force: true });
    await fs.mkdir(BUILD_DIR, { recursive: true });
    console.log("🧹 Cleaned build directory");
  } catch (err) {
    console.error("Error cleaning build directory:", err);
    process.exit(1);
  }
}

async function buildEmails() {
  try {
    // Clean and create build directory
    await cleanBuildDir();

    // Read all files from src directory
    const files = await fs.readdir(SRC_DIR);
    const mjmlFiles = files.filter((file) => path.extname(file) === ".mjml");

    if (mjmlFiles.length === 0) {
      console.log("⚠️  No MJML files found in src directory");
      return;
    }

    // Process each MJML file
    for (const file of mjmlFiles) {
      const mjmlPath = path.join(SRC_DIR, file);
      const mjmlContent = await fs.readFile(mjmlPath, "utf8");

      // Convert to HTML
      const htmlOutput = mjml(mjmlContent, {
        minify: false,
        validationLevel: "strict",
      });

      if (htmlOutput.errors.length > 0) {
        console.error(`❌ Error in ${file}:`, htmlOutput.errors);
        continue;
      }

      // Format HTML with Prettier
      const formattedHtml = await prettier.format(htmlOutput.html, {
        parser: "html",
        printWidth: 100,
        htmlWhitespaceSensitivity: "strict",
      });

      // Write HTML file
      const htmlFileName = path.basename(file, ".mjml") + ".html";
      const htmlPath = path.join(BUILD_DIR, htmlFileName);
      await fs.writeFile(htmlPath, formattedHtml);

      console.log(`✅ Built ${file} -> ${htmlFileName}`);
    }

    console.log("\n🎉 Email templates built successfully!");
  } catch (err) {
    console.error("Error building emails:", err);
    process.exit(1);
  }
}

buildEmails();
