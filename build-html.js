const fs = require('fs');
const path = require('path');

function getNextVersion(outputDir) {
    if (process.env.GITHUB_RUN_NUMBER) {
        return parseInt(process.env.GITHUB_RUN_NUMBER);
    }
    if (!fs.existsSync(outputDir)) return 1;
    const files = fs.readdirSync(outputDir);
    const versions = files
        .filter(f => f.match(/_v(\d+)\.html$/))
        .map(f => parseInt(f.match(/_v(\d+)\.html$/)[1]));
    return versions.length > 0 ? Math.max(...versions) + 1 : 1;
}

async function buildStaticHtml() {
    console.log('Generating Static HTML bundles...');
    const cvJsonStr = fs.readFileSync('app-profile.json', 'utf8');
    const cv = JSON.parse(cvJsonStr);
    const firstName = cv.basics?.name?.given?.replace(/\s+/g, '') || 'FirstName';
    const lastName = cv.basics?.name?.family?.replace(/\s+/g, '') || 'LastName';
    const prefix = `${firstName}${lastName}_CV`;

    const cssContent = fs.readFileSync('index.css', 'utf8');
    let appJsContent = fs.readFileSync('app.js', 'utf8');
    let indexHtml = fs.readFileSync('index.html', 'utf8');

    // Remove the fetch block and replace it with direct data injection
    const fetchRegex = /try \{\s*const response = await fetch\('app-profile\.json'\);\s*if \(!response\.ok\) throw new Error\('Network response was not ok'\);\s*const data = await response\.json\(\);\s*renderCV\(data\);/g;
    
    appJsContent = appJsContent.replace(fetchRegex, `try {\n        const data = ${cvJsonStr};\n        renderCV(data);`);

    // Prepare outputs
    const date = new Date();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const folderName = `${month}${year}`;
    const outputDir = path.join(__dirname, 'html-output-static', folderName);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const nextVersion = getNextVersion(outputDir);
    const baseFilename = `${prefix}_${folderName}_v${nextVersion}`;

    // Replace external links with inline content
    let bundledHtml = indexHtml.replace('<link rel="stylesheet" href="index.css">', `<style>\n${cssContent}\n</style>`);
    bundledHtml = bundledHtml.replace('<script src="app.js"></script>', `<script>\n${appJsContent}\n</script>`);

    // Full version
    const fullHtmlPath = path.join(outputDir, `${baseFilename}.html`);
    fs.writeFileSync(fullHtmlPath, bundledHtml);

    // No Skills version
    let noSkillsHtml = bundledHtml.replace('<script>window.showSkills = true;</script>', '<script>window.showSkills = false;</script>');
    const noSkillsHtmlPath = path.join(outputDir, `${baseFilename}_s.html`);
    fs.writeFileSync(noSkillsHtmlPath, noSkillsHtml);

    console.log('Done! Successfully generated:');
    console.log(`- html-output-static/${folderName}/${baseFilename}.html`);
    console.log(`- html-output-static/${folderName}/${baseFilename}_s.html`);
}

buildStaticHtml();
