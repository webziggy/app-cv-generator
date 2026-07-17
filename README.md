# ATS-Compliant CV Generator (with Semantic JSON-LD)

**The ultimate resume builder for the modern job hunt.**

Most candidates are forced to choose between:
1. **Beautiful, human-readable CVs** (that get completely mangled and rejected by automated ATS systems like Workday, Lever, and Greenhouse).
2. **Ugly, unformatted text CVs** (that parse perfectly into ATS systems but put human hiring managers to sleep).

This project solves that. It uses an **[Applicant Profile Protocol (APP)](https://app-protocol.org/)** JSON file as a single source of truth to automatically generate a suite of resumes:
- A stunning **Glassmorphism Static HTML** web viewer.
- A beautiful **PDF** that has **invisible, machine-readable `schema.org` JSON-LD baked directly into its metadata** for perfect ATS parsing.
- A clean **Markdown** fallback.
- A raw **Plain Text** fallback.

## 🚀 Getting Started

1. **Fork or Clone this repository.**
2. **Install the dependencies** (Puppeteer for PDF generation, ExifTool for metadata injection):
   ```bash
   npm install
   ```
3. **Update your Profile:**
   Open `app-profile.json` and replace the placeholder "Jane Doe" data with your own professional history.
4. **Generate your Artifacts:**
   ```bash
   node build.js
   ```
   All of your fresh CVs will be automatically generated and versioned in their respective `pdf-output`, `md-output`, `txt-output`, and `html-output-static` folders!

## 🎨 Customizing the Design

The HTML viewer and PDF generator use a highly polished Glassmorphism aesthetic. 
To theme the CV to your personal brand, simply edit the CSS Custom Properties at the top of `index.css`:

```css
:root {
  --primary-bg: #1e1e1e;
  --secondary-bg: #2d2d2d;
  --accent-color: #3b82f6; /* Change this to your favorite color */
  --text-main: #f3f4f6;
  --heading-font: 'DM Sans', sans-serif;
  --body-font: 'EB Garamond', serif;
}
```

## ⚙️ Architecture

- **`build.js`**: The master orchestrator.
- **`build-pdfs.js`**: Boots a headless browser, renders your CV, saves it as a PDF, generates semantic `schema.org` JSON-LD from your `app-profile.json`, and uses `exiftool` to silently embed that semantic data directly into the PDF binary.
- **`build-html.js`**: Compiles your CSS, JS, and JSON into two zero-dependency, self-contained static `.html` files (one with skills, one without) that you can host absolutely anywhere (like AWS S3, GitHub Pages, or Vercel).

## 📄 Built on APP (Applicant Profile Protocol)

This project leverages the excellent **[Applicant Profile Protocol (APP)](https://app-protocol.org/)** as its core data standard. APP is a modern, extensible JSON schema designed explicitly to standardize applicant profiles across the web. 

By structuring your career history in APP, you ensure maximum compatibility with modern recruitment tools while this generator handles the premium visual rendering.

To learn more about the schema or contribute to the standard, visit the **[official APP GitHub Repository](https://github.com/caglarorhan/Applicant-Profile-Protocol)**.
