/**
 * buildATSHtml — generates an ATS-optimized HTML resume
 *
 * ATS rules applied:
 *  1. Single-column layout — no multi-column / flexbox layout tricks
 *  2. Arial only — web fonts are never loaded by ATS parsers
 *  3. Semantic h1 / h2 — ATS identifies name (h1) and sections (h2) natively
 *  4. <ul><li> bullets — best keyword-extraction surface for ATS
 *  5. Float:right for dates — safe for ATS; flexbox layout is not
 *  6. No images, icons, decorative borders, or CSS content: tricks
 *  7. Standard section labels: "Work Experience", "Education", "Skills", etc.
 *  8. Contact block in plain <p> at top — ATS scans here first
 *  9. Skills as bullet-separated plain text paragraph — max keyword hits
 * 10. Clean clearfix — no layout artifacts in parsed text
 */
export function buildATSHtml(cv) {
  const fullName = [cv.firstName, cv.lastName].filter(Boolean).join(' ') || 'Your Name'
  const contacts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  |  ')

  const expHTML = cv.experience.map(e => {
    const lines = (e.desc || '')
      .split('\n')
      .map(l => l.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
    const bullets = lines.length
      ? `<ul>${lines.map(l => `<li>${escHtml(l)}</li>`).join('')}</ul>`
      : ''
    return `
    <div class="job">
      <div class="jh clearfix">
        <span class="jt">${escHtml(e.role)}</span>
        <span class="jd">${escHtml(e.start)} – ${escHtml(e.end)}</span>
      </div>
      <div class="jc">${escHtml(e.company)}</div>
      ${bullets}
    </div>`
  }).join('')

  const eduHTML = cv.education.map(e => `
    <div class="job">
      <div class="jh clearfix">
        <span class="jt">${escHtml(e.degree)}</span>
        <span class="jd">${escHtml(e.start)} – ${escHtml(e.end)}</span>
      </div>
      <div class="jc">${escHtml(e.school)}</div>
    </div>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(fullName)} – CV</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #000;
      background: #fff;
      padding: 40px 52px;
      max-width: 760px;
      margin: 0 auto;
    }
    h1 {
      font-size: 22pt;
      font-weight: bold;
      margin-bottom: 3px;
      letter-spacing: -0.3px;
    }
    .headline {
      font-size: 11pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 7px;
    }
    .contact {
      font-size: 10pt;
      color: #333;
      border-bottom: 1.5px solid #000;
      padding-bottom: 9px;
      margin-bottom: 16px;
      line-height: 1.5;
    }
    h2 {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3px;
      margin: 18px 0 9px;
      color: #000;
    }
    .summary {
      font-size: 10.5pt;
      color: #222;
      line-height: 1.65;
      margin-bottom: 4px;
    }
    .job { margin-bottom: 14px; }
    .jh { overflow: hidden; margin-bottom: 2px; }
    .clearfix::after { content: ''; display: table; clear: both; }
    .jt { font-size: 11pt; font-weight: bold; color: #000; }
    .jd { float: right; font-size: 10pt; color: #555; }
    .jc { font-size: 10.5pt; color: #333; margin-bottom: 4px; }
    ul  { margin: 4px 0 0 20px; padding: 0; }
    li  { font-size: 10.5pt; color: #222; line-height: 1.6; margin-bottom: 2px; }
    .skills-p { font-size: 10.5pt; color: #222; line-height: 1.7; }
    @page  { margin: 0.55in; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escHtml(fullName)}</h1>
  ${cv.jobTitle ? `<p class="headline">${escHtml(cv.jobTitle)}</p>` : ''}
  <p class="contact">${escHtml(contacts) || '&nbsp;'}</p>

  ${cv.summary ? `<h2>Professional Summary</h2><p class="summary">${escHtml(cv.summary)}</p>` : ''}
  ${cv.experience.length ? `<h2>Work Experience</h2>${expHTML}` : ''}
  ${cv.education.length  ? `<h2>Education</h2>${eduHTML}` : ''}
  ${cv.skills.length     ? `<h2>Skills</h2><p class="skills-p">${cv.skills.map(escHtml).join(' &bull; ')}</p>` : ''}
  ${cv.languages         ? `<h2>Languages</h2><p class="skills-p">${escHtml(cv.languages)}</p>` : ''}
</body>
</html>`
}

function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
