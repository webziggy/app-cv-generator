const fs = require('fs');
const path = require('path');

async function buildText() {
    console.log('Generating Plain Text from JSON...');
    const cv = JSON.parse(fs.readFileSync('app-profile.json', 'utf8'));
const firstName = cv.basics?.name?.given?.replace(/\s+/g, '') || 'FirstName';
const lastName = cv.basics?.name?.family?.replace(/\s+/g, '') || 'LastName';
const prefix = `${firstName}${lastName}_CV`;

    // Format Month/Year string
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthYear = `${monthNames[now.getMonth()]}${now.getFullYear()}`;
    const outputDir = `txt-output/${monthYear}`;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let version = 1;
    while (fs.existsSync(`${outputDir}/${prefix}_${monthYear}_v${version}.txt`)) {
        version++;
    }
    const txtPath = path.join(outputDir, `${prefix}_${monthYear}_v${version}.txt`);

    let txt = `${cv.basics.name.given} ${cv.basics.name.family}\n`;
    txt += `${cv.basics.headline}\n\n`;
    txt += `Email: ${cv.basics.contact.email} | Phone: ${cv.basics.contact.phone} | LinkedIn: ${cv.basics.contact.social[0].url}\n\n`;
    
    txt += `========================================\n`;
    txt += `SUMMARY\n`;
    txt += `========================================\n\n${cv.basics.summary}\n\n`;

    txt += `========================================\n`;
    txt += `KEY SKILLS\n`;
    txt += `========================================\n\n`;
    if (cv.skills) {
        cv.skills.forEach(skillGroup => {
            txt += `${skillGroup.name}:\n${skillGroup.keywords.join('; ')}\n\n`;
        });
    }

    txt += `========================================\n`;
    txt += `WORK EXPERIENCE\n`;
    txt += `========================================\n\n`;
    if (cv.experience) {
        cv.experience.forEach(job => {
            const start = job.start ? formatMonthYear(job.start) : 'Present';
            const end = job.end ? formatMonthYear(job.end) : 'Present';
            const contractStr = job.employmentType === 'Contract' ? ' (Contract)' : '';
            txt += `${job.role} - ${job.organization.name}\n`;
            txt += `* ${start} - ${end}${contractStr}\n\n`;
            if (job.highlights && job.highlights.length > 0) {
                job.highlights.forEach(hl => {
                    txt += `- ${hl}\n`;
                });
                txt += '\n';
            }
        });
    }

    txt += `========================================\n`;
    txt += `EDUCATION\n`;
    txt += `========================================\n\n`;
    if (cv.education) {
        cv.education.forEach(ed => {
            const start = ed.start ? ed.start.split('-')[0] : '';
            const end = ed.end ? ed.end.split('-')[0] : 'Present';
            if (ed.degree === 'High School' || ed.area === 'General Education') {
                txt += `${ed.institution} (${start}-${end})\n\n`;
            } else {
                txt += `${ed.institution} - ${ed.degree} - ${ed.area} (${start}-${end})\n\n`;
            }
        });
    }

    txt += `========================================\n`;
    txt += `CREDENTIALS\n`;
    txt += `========================================\n\n`;
    if (cv.credentials) {
        cv.credentials.forEach(cred => {
            txt += `- ${cred.name} (${cred.issuer})\n`;
        });
    }

    fs.writeFileSync(txtPath, txt);
    console.log(`Done! Successfully generated:\n- ${txtPath}`);
}

function formatMonthYear(dateStr) {
    if (!dateStr) return 'PRESENT';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
        return `${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

buildText().catch(console.error);
