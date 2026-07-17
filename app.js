document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showSkills') === 'false') {
        window.showSkills = false;
    }
    try {
        const response = await fetch('app-profile.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderCV(data);

        // Web Controls Logic
        document.getElementById('print-btn').addEventListener('click', () => {
            window.print();
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let targetTheme = 'light';
            
            if (currentTheme === 'light') {
                targetTheme = 'dark';
            } else if (currentTheme === 'dark') {
                targetTheme = 'light';
            } else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    targetTheme = 'light';
                } else {
                    targetTheme = 'dark';
                }
            }
            document.documentElement.setAttribute('data-theme', targetTheme);
        });

    } catch (error) {
        console.error("Error loading CV data:", error);
        document.getElementById('app').innerHTML = `<p style="padding:2rem;">Error Loading Profile</p>`;
    }
});

function renderCV(data) {
    const app = document.getElementById('app');
    const { basics, experience, education, skills, credentials } = data;
    document.title = `${basics.name.given} ${basics.name.family} - CV`;

    // Build Header
    const header = `
        <header role="presentation">
            <h1 role="heading" aria-level="1">${basics.name.given} ${basics.name.family}</h1>
        </header>
    `;

    // Build Summary
    const summary = `
        <section class="summary" role="presentation">
            <p>${basics.summary}</p>
        </section>
    `;

    // Build Skills
    let skillsHtml = '';
    if (window.showSkills !== false && skills && skills.length > 0) {
        if (skills[0].keywords) {
            // Categorised Skills Layout
            const categoriesHtml = skills.map(category => `
                <div class="skill-category" role="presentation">
                    <h4 role="heading" aria-level="4">${category.name}</h4>
                    <ul class="skills-list">
                        ${category.keywords.map(kw => `<li>${kw}</li>`).join('')}
                    </ul>
                </div>
            `).join('');

            skillsHtml = `
                <section id="skills-section" role="presentation">
                    <h3 class="section-title" role="heading" aria-level="3">Key Skills</h3>
                    <div class="skills-grid" role="presentation">
                        ${categoriesHtml}
                    </div>
                </section>
            `;
        } else {
            // Fallback for flat list
            const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));
            skillsHtml = `
                <section id="skills-section" role="presentation">
                    <h3 class="section-title" role="heading" aria-level="3">Key Skills</h3>
                    <ul class="skills-list" style="column-count: 3; column-gap: 2rem;">
                        ${sortedSkills.map(s => `<li>${s.name}</li>`).join('')}
                    </ul>
                </section>
            `;
        }
    }

    // Build Experience & Timeline
    let experienceHtml = `
        <section role="presentation">
            <h3 class="section-title" role="heading" aria-level="3">Work Experience</h3>
    `;
    let timelineHtml = '<nav class="timeline-nav" id="timeline-nav" aria-label="Career Timeline">';

    if (window.showSkills !== false && skills && skills.length > 0) {
        timelineHtml += `<a href="#skills-section">
            <span class="timeline-details">Key Skills</span>
            <span class="timeline-year">⭐</span>
        </a>`;
    }

    experience.forEach((job, index) => {
        const start = formatMonthYear(job.start);
        const end = job.end ? formatMonthYear(job.end) : 'Present';
        const contractStr = job.employmentType === 'Contract' ? ' (Contract)' : '';
        
        let isCompact = '';
        if (index > 4 || job.role.includes('Career Break')) {
            isCompact = ' compact-job';
        }

        let highlightsHtml = '';
        if (job.highlights && job.highlights.length > 0) {
            highlightsHtml = `<ul class="job-highlights">
                ${job.highlights.map(hl => `<li>${hl}</li>`).join('')}
            </ul>`;
        }

        let techHtml = '';
        if (job.technologies && job.technologies.length > 0) {
            techHtml = `<div class="job-tech">
                <ul><li>Technology environment: ${job.technologies.join(', ')}</li></ul>
            </div>`;
        }

        if (job.start && job.start < '2006-06') {
            isCompact = ' compact-job';
        }
        const jobId = `job-${index}`;
        const startYear = job.start ? job.start.split('-')[0] : 'Present';
        const fullDateStr = `${start} - ${end}${contractStr}`;

        timelineHtml += `<a href="#${jobId}">
            <span class="timeline-details">${job.role} @ ${job.organization.name} (${fullDateStr})</span>
            <span class="timeline-year">${startYear}</span>
        </a>`;

        experienceHtml += `
            <article id="${jobId}" class="experience-item${isCompact}">
                <header class="job-header" role="presentation">
                    <h4 class="job-title-company" role="heading" aria-level="4">
                        <span class="job-company" role="presentation">${job.organization.name}</span> - <span class="job-title" role="presentation">${job.role}</span>
                    </h4>
                    <p class="job-date">${start} - ${end}${contractStr}</p>
                </header>
                ${highlightsHtml}
                ${techHtml}
            </article>
        `;
    });

    experienceHtml += `
        </section>
    `;

    if (credentials && credentials.length > 0) {
        timelineHtml += `<a href="#certifications-section">
            <span class="timeline-details">Certifications</span>
            <span class="timeline-year">🏆</span>
        </a>`;
    }

    if (education && education.length > 0) {
        timelineHtml += `<a href="#education-section">
            <span class="timeline-details">Education</span>
            <span class="timeline-year">📚</span>
        </a>`;
    }

    timelineHtml += '</nav>';

    // Build Credentials
    let credentialsHtml = '';
    if (credentials && credentials.length > 0) {
        credentialsHtml = `
            <section id="certifications-section" role="presentation">
                <h3 class="section-title" role="heading" aria-level="3">Certification / Voluntary</h3>
                <div class="education-item" role="presentation">
                    <ul>
                        ${credentials.map(c => `<li>"${c.name}" - ${c.issuer}</li>`).join('')}
                    </ul>
                </div>
            </section>
        `;
    }

    // Build Education
    let educationHtml = '';
    if (education && education.length > 0) {
        educationHtml = `
            <section id="education-section" role="presentation">
                <h3 class="section-title" role="heading" aria-level="3">Education</h3>
                ${education.map(ed => {
                    const start = ed.start ? ed.start.split('-')[0] : '';
                    const end = ed.end ? ed.end.split('-')[0] : 'Present';
                    const details = (ed.degree === 'High School' || ed.area === 'General Education')
                        ? `(${start}-${end})`
                        : `- ${ed.degree} - ${ed.area} (${start}-${end})`;
                    return `
                    <div class="education-item" role="presentation">
                        <p><strong role="heading" aria-level="4">${ed.institution}</strong> ${details}</p>
                    </div>
                `;}).join('')}
            </section>
        `;
    }

    // Build Footer
    const linkedinUrl = basics.contact.social && basics.contact.social.length > 0 ? basics.contact.social[0].url : '';
    const footer = `
        <footer style="justify-content: center; display: flex; width: 100%; font-size: 0.85rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); margin-top: 0.5rem;" role="presentation">
            <div role="presentation"><a href="${linkedinUrl}" target="_blank">${linkedinUrl.replace('https://', '')}</a> | ${basics.name.given} ${basics.name.family} | <a href="tel:${basics.contact.phone.replace(/\s+/g, '')}">${basics.contact.phone}</a> | <a href="mailto:${basics.contact.email}">${basics.contact.email}</a></div>
        </footer>
    `;

    // Combine and render
    app.innerHTML = `
        <div class="web-controls">
            <button id="print-btn" class="web-btn" title="Download / Print PDF" aria-label="Print PDF">🖨️</button>
            <button id="theme-toggle" class="web-btn" title="Toggle Dark Mode" aria-label="Toggle Dark Mode">🌗</button>
        </div>
        <button id="scroll-to-top" class="scroll-top-btn" aria-label="Scroll to top" title="Scroll to top">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
        ${timelineHtml}
        <table role="presentation" style="width: 100%; border-collapse: collapse; border: none;">
            <tbody role="presentation">
                <tr role="presentation">
                    <td role="presentation" style="padding: 0; border: none;">
                        <main class="container" role="presentation">
                            ${header}
                            ${summary}
                            ${skillsHtml}
                            ${experienceHtml}
                            ${credentialsHtml}
                            ${educationHtml}
                        </main>
                    </td>
                </tr>
            </tbody>
            <tfoot role="presentation">
                <tr role="presentation">
                    <td role="presentation" style="padding: 0; border: none;">
                        <div class="footer-space" role="presentation">
                            ${footer}
                        </div>
                    </td>
                </tr>
            </tfoot>
        </table>
    `;

    // Scroll to top logic
    const scrollBtn = document.getElementById('scroll-to-top');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function formatMonthYear(dateStr) {
    if (!dateStr) return 'PRESENT';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
        return `${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}
