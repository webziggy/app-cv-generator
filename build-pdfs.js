const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;

// 1. Create a simple static HTTP server
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

async function build() {
    console.log('Starting local server...');
    server.listen(PORT);

    // 2. Generate JSON-LD manually for a complete Schema.org mapping
    console.log('Generating JSON-LD...');
    const cvData = JSON.parse(fs.readFileSync('app-profile.json', 'utf8'));
    const firstName = cvData.basics?.name?.given?.replace(/\s+/g, '') || 'FirstName';
    const lastName = cvData.basics?.name?.family?.replace(/\s+/g, '') || 'LastName';
    const prefix = `${firstName}${lastName}_CV`;
    const jsonldObj = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": `${cvData.basics.name.given} ${cvData.basics.name.family}`,
      "jobTitle": cvData.basics.headline,
      "description": cvData.basics.summary,
      "email": cvData.basics.contact.email,
      "telephone": cvData.basics.contact.phone,
      "url": cvData.basics.contact.website,
      "sameAs": cvData.basics.contact.social ? cvData.basics.contact.social.map(s => s.url) : [],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cvData.basics.location.city,
        "addressRegion": cvData.basics.location.region,
        "addressCountry": cvData.basics.location.country
      },
      "knowsAbout": cvData.skills ? cvData.skills.flatMap(s => s.keywords) : [],
      "hasCredential": [
        ...(cvData.credentials ? cvData.credentials.map(c => ({
          "@type": "EducationalOccupationalCredential",
          "name": c.name,
          "recognizedBy": { "@type": "Organization", "name": c.issuer }
        })) : []),
        ...(cvData.education ? cvData.education.map(e => ({
          "@type": "EducationalOccupationalCredential",
          "credentialCategory": "Degree",
          "name": `${e.degree} in ${e.area}`,
          "recognizedBy": { "@type": "EducationalOrganization", "name": e.institution }
        })) : [])
      ],
      "alumniOf": cvData.education ? cvData.education.map(e => ({
        "@type": "EducationalOrganization",
        "name": e.institution
      })) : [],
      "worksFor": cvData.experience ? cvData.experience.map(exp => ({
        "@type": "Organization",
        "name": exp.organization.name,
        "member": {
          "@type": "OrganizationRole",
          "roleName": exp.role,
          "startDate": exp.start,
          "endDate": exp.end || "Present",
          "description": exp.highlights ? exp.highlights.join(' ') : ""
        }
      })) : []
    };
    const jsonld = JSON.stringify(jsonldObj, null, 2);
    fs.writeFileSync('cv.jsonld', jsonld);

    // 3. Launch Puppeteer
    console.log('Launching Puppeteer...');
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // 4. Generate PDF WITH Skills
    // Determine dynamic filenames based on Month/Year and version
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthYear = `${monthNames[now.getMonth()]}${now.getFullYear()}`;
    
    const outputDir = `pdf-output/${monthYear}`;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    function getNextVersion(dir) {
        let version = 1;
        while (
            fs.existsSync(`${dir}/${prefix}_${monthYear}_v${version}.pdf`) || 
            fs.existsSync(`${dir}/${prefix}_${monthYear}_v${version}_s.pdf`)
        ) {
            version++;
        }
        return version;
    }

    const nextVersion = getNextVersion(outputDir);
    const baseFilename = `${prefix}_${monthYear}_v${nextVersion}`;
    
    const skillsPdf = `${outputDir}/${baseFilename}_s.pdf`;
    const noSkillsPdf = `${outputDir}/${baseFilename}.pdf`;
    const jsonLdPath = `${outputDir}/${baseFilename}.jsonld`;

    console.log(`Generating ${skillsPdf}...`);
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });
    await page.pdf({ 
        path: skillsPdf, 
        format: 'A4', 
        printBackground: true,
        tagged: true
    });

    // 5. Generate PDF WITHOUT Skills
    console.log(`Generating ${noSkillsPdf}...`);
    await page.goto(`http://localhost:${PORT}/index-noskills.html`, { waitUntil: 'networkidle0' });
    await page.pdf({ 
        path: noSkillsPdf, 
        format: 'A4', 
        printBackground: true,
        tagged: true
    });

    await browser.close();

    // 6. Embed JSON-LD via ExifTool
    console.log('Embedding JSON-LD into PDF metadata via ExifTool...');
    // We use a temporary file to hold the JSON-LD so ExifTool can read it cleanly without command line escaping issues
    fs.writeFileSync('temp.xmp', jsonld);
    
    // Injecting into XMP-dc:Source to avoid clobbering the standard PDF Subject/Description field
    // We also explicitly set Title, Author, and Subject, and wipe the Skia/Puppeteer Producer tags for a cleaner file
    const exifFlags = '-Title="Alan Ogilvie - CV" -Author="Alan Ogilvie" -Subject="Curriculum Vitae" -Creator="" -Producer=""';
    
    execSync(`exiftool "-XMP-dc:Source<=temp.xmp" ${exifFlags} -overwrite_original "${skillsPdf}"`);
    execSync(`exiftool "-XMP-dc:Source<=temp.xmp" ${exifFlags} -overwrite_original "${noSkillsPdf}"`);

    // Save JSON-LD alongside PDFs
    fs.copyFileSync('cv.jsonld', jsonLdPath);

    // Cleanup
    fs.unlinkSync('temp.xmp');
    server.close();
    
    console.log('Done! Successfully generated:');
    console.log(`- ${skillsPdf}`);
    console.log(`- ${noSkillsPdf}`);
    console.log(`- ${jsonLdPath}`);
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
