const fs = require('fs');
const path = require('path');

async function buildMarkdown() {
    console.log('Generating Markdown from JSON...');
    const cv = JSON.parse(fs.readFileSync('app-profile.json', 'utf8'));
const firstName = cv.basics?.name?.given?.replace(/\s+/g, '') || 'FirstName';
const lastName = cv.basics?.name?.family?.replace(/\s+/g, '') || 'LastName';
const prefix = `${firstName}${lastName}_CV`;

    // Format Month/Year string
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthYear = `${monthNames[now.getMonth()]}${now.getFullYear()}`;
    const outputDir = `md-output/${monthYear}`;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let version = 1;
    if (process.env.GITHUB_RUN_NUMBER) {
        version = parseInt(process.env.GITHUB_RUN_NUMBER);
    } else {
        while (fs.existsSync(`${outputDir}/${prefix}_${monthYear}_v${version}.md`)) {
            version++;
        }
    }
    const mdPath = path.join(outputDir, `${prefix}_${monthYear}_v${version}.md`);

    let md = `# ${cv.basics.name.given} ${cv.basics.name.family}\n\n`;
    md += `**${cv.basics.headline}**\n\n`;
    md += `📧 ${cv.basics.contact.email} | 📱 ${cv.basics.contact.phone} | 🔗 [LinkedIn](${cv.basics.contact.social[0].url})\n\n`;
    md += `## Summary\n\n${cv.basics.summary}\n\n`;

    md += `## Key Skills\n\n`;
    if (cv.skills) {
        cv.skills.forEach(skillGroup => {
            md += `**${skillGroup.name}**: ${skillGroup.keywords.join('; ')}\n\n`;
        });
    }

    md += `## Work Experience\n\n`;
    if (cv.experience) {
        cv.experience.forEach(job => {
            const start = job.start ? formatMonthYear(job.start) : 'Present';
            const end = job.end ? formatMonthYear(job.end) : 'Present';
            const contractStr = job.employmentType === 'Contract' ? ' (Contract)' : '';
            md += `### ${job.role} - ${job.organization.name}\n`;
            md += `*${start} - ${end}${contractStr}*\n\n`;
            if (job.highlights && job.highlights.length > 0) {
                job.highlights.forEach(hl => {
                    md += `- ${hl}\n`;
                });
                md += '\n';
            }
        });
    }

    md += `## Education\n\n`;
    if (cv.education) {
        cv.education.forEach(ed => {
            const start = ed.start ? ed.start.split('-')[0] : '';
            const end = ed.end ? ed.end.split('-')[0] : 'Present';
            if (ed.degree === 'High School' || ed.area === 'General Education') {
                md += `**${ed.institution}** (${start}-${end})\n\n`;
            } else {
                md += `**${ed.institution}** - ${ed.degree} - ${ed.area} (${start}-${end})\n\n`;
            }
        });
    }

    md += `## Credentials\n\n`;
    if (cv.credentials) {
        cv.credentials.forEach(cred => {
            md += `- ${cred.name} (${cred.issuer})\n`;
        });
    }

    fs.writeFileSync(mdPath, md);
    console.log(`Done! Successfully generated:\n- ${mdPath}`);
}

function formatMonthYear(dateStr) {
    if (!dateStr) return 'PRESENT';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
        return `${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

buildMarkdown().catch(console.error);
