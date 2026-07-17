# ATS-Optimized CV Generator (Dual-Path PDF & APP JSON)

**An experimental build pipeline designed to maximize Applicant Tracking System (ATS) compatibility using the Applicant Profile Protocol (APP).**

Most candidates are forced to choose between:

**Visually appealing CVs** (which often use complex layouts, columns, or tables that completely break legacy ATS parsers, leading to automatic rejection).**Plain text, unformatted CVs** (which parse reliably into an ATS but fail to impress the human hiring manager who eventually reads them).

## 🚀 What This Pipeline Actually Does (The "Dual-Path" Approach)

There is no such thing as a "100% ATS-proof" CV, because different systems (like Workday vs. Taleo) use fundamentally different parsing logic. However, this tool gives you the highest mathematical probability of accurate data extraction by generating a **Dual-Path PDF**:

- **For Legacy ATS (The Presentation Path):** The pipeline generates a **Tagged PDF**. By preserving the semantic HTML DOM tree (e.g., `<h1>`, `<h2>`, `<p>`), it forces legacy text extractors to read your CV in a perfect, linear, left-to-right order. This prevents the catastrophic data scrambling that usually happens when parsers encounter multi-column layouts.
- **For Modern/AI-Ready ATS (The Metadata Path):** The pipeline converts your APP profile into canonical `schema.org` JSON-LD and uses `exiftool` to embed this structured data directly into the PDF's XMP metadata (specifically the Dublin Core `Source` property). If a modern ATS supports XMP-first parsing, it will bypass the visual text entirely and ingest your perfect, machine-readable JSON payload.

## ⚠️ The Reality Check: What This Tool CANNOT Fix

While this pipeline solves the *structural* problems of PDF parsing, it cannot fix bad data. To successfully navigate an ATS, you must still ensure the content within your `app-profile.json` follows strict ATS conventions:

- **Strict Date Formats:** Always use `MM/YYYY - MM/YYYY` formats. Legacy parsers will still reject text dates like "March 2020" or UK-formatted `DD/MM/YYYY` dates.
- **No Stacked Titles:** Do not group multiple job titles under a single company heading and date range. You must break out each promotion into its own distinct, linear block (Title + Dates + Achievements) or the parser will overwrite your tenure.
- **Keyword Context:** The ATS still needs to see the right keywords embedded naturally within your work achievements (using Challenge-Action-Result formatting).

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

## 📁 Generated Outputs & Formats

When you run the build (or trigger the GitHub Release), the pipeline generates artifacts into grouped folders organized by month and year (e.g., `Jul2026`). 

You will notice that the HTML and PDF outputs come in two distinct variants:

1. **Standard Variant** (e.g., `JaneDoe_CV_Jul2026_v1.pdf`)
   - **What it is:** The primary, streamlined version of your CV.
   - **Why we made it:** This hides the often massive wall of "Key Skills" tags from the visual document. It forces human reviewers to focus strictly on your chronological work experience and achievements. Because the skills are still embedded in the invisible `schema.org` JSON-LD metadata, ATS parsers will still successfully extract all your keywords without bloating the visual page count.

2. **Skills Variant** (e.g., `JaneDoe_CV_Jul2026_v1_s.pdf` - Note the `_s` suffix)
   - **What it is:** The exact same CV, but with a highly visible "Key Skills" section injected at the top.
   - **Why we made it:** Some older ATS parsers still rely heavily on OCR or visual text scraping rather than metadata, and some specific recruiters explicitly request a visible skills matrix. This variant ensures you have a visually complete fallback if requested.

In addition to the PDFs and HTML bundles, you will also receive:
- **`.md` (Markdown)**: A beautifully formatted, lightweight text file perfect for pasting into internal GitHub/GitLab wikis or developer portals.
- **`.txt` (Plain Text)**: The rawest possible fallback. Essential for copying and pasting into those dreaded corporate job portals that force you to paste your resume into a tiny unformatted `<textarea>`.

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
- **`build-pdfs.js`**: Boots a headless browser, renders your CV, saves it as a PDF, generates semantic `schema.org` JSON-LD from your `app-profile.json`, and uses `exiftool` to silently embed that semantic data directly into the PDF binary's XMP packet.
- **`build-html.js`**: Compiles your CSS, JS, and JSON into two zero-dependency, self-contained static `.html` files (one with skills, one without) that you can host absolutely anywhere (like AWS S3, GitHub Pages, or Vercel).

## 📄 Built on APP (Applicant Profile Protocol)

This project leverages the excellent **[Applicant Profile Protocol (APP)](https://app-protocol.org/)** as its core data standard. APP is a modern, extensible JSON schema designed explicitly to standardize applicant profiles across the web. 

By structuring your career history in APP, you ensure maximum compatibility with modern recruitment tools while this generator handles the premium visual rendering.

To learn more about the schema or contribute to the standard, visit the **[official APP GitHub Repository](https://github.com/caglarorhan/Applicant-Profile-Protocol)**.

## 🕵️ Extracting the Semantic Payload

The complete `schema.org/Person` JSON-LD payload is embedded directly into the generated PDFs' XMP (Extensible Metadata Platform) packet, specifically within the Dublin Core `Source` property (`XMP-dc:Source`). 

To programmatically extract the raw semantic database from any of the generated PDFs, use ExifTool:

```bash
exiftool -XMP-dc:Source -b filename.pdf
```
*(The `-b` flag outputs the raw binary block of text, extracting the beautifully formatted JSON-LD directly to standard output).*
