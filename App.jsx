import { useState, useCallback } from 'react'
import { buildATSHtml } from './atsBuilder.js'
import { useAI } from './useAI.js'
import './App.css'

const STEPS = ['Personal', 'Summary', 'Experience', 'Education', 'Skills']

const EMPTY_CV = {
  firstName: '', lastName: '', jobTitle: '', email: '',
  phone: '', location: '', linkedin: '', summary: '',
  experience: [], education: [], skills: [], languages: '',
}

const EMPTY_EXP = { company: '', role: '', start: '', end: '', desc: '' }
const EMPTY_EDU = { school: '', degree: '', start: '', end: '' }

// ─── SMALL REUSABLE COMPONENTS ────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function AiBtn({ onClick, loading, children }) {
  return (
    <button className={`ai-btn ${loading ? 'loading' : ''}`} onClick={onClick} disabled={loading}>
      {loading
        ? <><span className="spinner" />Writing…</>
        : <><span className="ai-icon">✦</span>{children}</>}
    </button>
  )
}

function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>
}

// ─── CV LIVE PREVIEW ──────────────────────────────────────────────────────────

function CVPreview({ cv }) {
  const fullName = [cv.firstName, cv.lastName].filter(Boolean).join(' ')
  const contacts = [cv.email, cv.phone, cv.location, cv.linkedin].filter(Boolean).join('  ·  ')

  if (!fullName && !cv.jobTitle) {
    return (
      <div className="preview-empty">
        <span className="preview-empty-icon">📄</span>
        Fill in your details and your CV will appear here in real-time.
      </div>
    )
  }

  return (
    <div className="cv-preview fade-up">
      <div className="cv-name">{fullName || 'Your Name'}</div>
      {cv.jobTitle && <div className="cv-role">{cv.jobTitle}</div>}
      {contacts   && <div className="cv-contact">{contacts}</div>}

      {cv.summary && (
        <section className="cv-section">
          <div className="cv-sec-title">Profile</div>
          <p className="cv-body">{cv.summary}</p>
        </section>
      )}

      {cv.experience.length > 0 && (
        <section className="cv-section">
          <div className="cv-sec-title">Experience</div>
          {cv.experience.map((e, i) => (
            <div key={i} className="cv-exp-item">
              <div className="cv-exp-header">
                <span className="cv-exp-co">{e.company}</span>
                <span className="cv-exp-date">{e.start} – {e.end}</span>
              </div>
              <div className="cv-exp-role">{e.role}</div>
              {e.desc && <div className="cv-exp-desc">{e.desc}</div>}
            </div>
          ))}
        </section>
      )}

      {cv.education.length > 0 && (
        <section className="cv-section">
          <div className="cv-sec-title">Education</div>
          {cv.education.map((e, i) => (
            <div key={i} className="cv-exp-item">
              <div className="cv-exp-header">
                <span className="cv-exp-co">{e.school}</span>
                <span className="cv-exp-date">{e.start} – {e.end}</span>
              </div>
              <div className="cv-exp-role">{e.degree}</div>
            </div>
          ))}
        </section>
      )}

      {cv.skills.length > 0 && (
        <section className="cv-section">
          <div className="cv-sec-title">Skills</div>
          <div className="cv-skills-wrap">
            {cv.skills.map((s, i) => <span key={i} className="cv-skill-tag">{s}</span>)}
          </div>
        </section>
      )}

      {cv.languages && (
        <section className="cv-section">
          <div className="cv-sec-title">Languages</div>
          <p className="cv-body">{cv.languages}</p>
        </section>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep]       = useState(1)
  const [cv, setCv]           = useState(EMPTY_CV)
  const [expForm, setExpForm] = useState(EMPTY_EXP)
  const [eduForm, setEduForm] = useState(EMPTY_EDU)
  const [skillInput, setSkillInput] = useState('')
  const [toast, setToast]     = useState('')
  const { call, loading }     = useAI()

  // ── helpers ──
  const set = field => e => setCv(p => ({ ...p, [field]: e.target.value }))

  const showToast = msg => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── AI actions ──
  const aiSummary = async () => {
    const name   = [cv.firstName, cv.lastName].filter(Boolean).join(' ') || 'the candidate'
    const expStr = cv.experience.map(e => `${e.role} at ${e.company}`).join(', ')
    const result = await call(
      `Write a powerful 3-sentence professional CV summary.
Name: ${name}
Target role: ${cv.jobTitle || 'professional'}
Experience: ${expStr || 'not specified'}
Write ONLY the summary text. No quotes, no labels. Achievement-focused and compelling.`,
      'summary'
    )
    if (result) setCv(p => ({ ...p, summary: result }))
  }

  const aiExpDesc = async () => {
    if (!expForm.role && !expForm.company) { showToast('Enter company and role first'); return }
    const result = await call(
      `Write 3 strong CV achievement bullet points.
Role: ${expForm.role || 'professional'}
Company: ${expForm.company || 'a company'}
Format: 3 lines, each starting with a strong past-tense action verb (Led, Built, Increased, Reduced…).
Use specific numbers/percentages where natural. No intro, just the 3 lines.`,
      'expDesc'
    )
    if (result) setExpForm(p => ({ ...p, desc: result }))
  }

  const aiSkills = async () => {
    const role   = cv.jobTitle || expForm.role || 'professional'
    const result = await call(
      `List 12 relevant professional skills for a "${role}" CV.
Format: comma-separated only. No numbering, no explanation. Mix hard technical and soft skills.`,
      'skills'
    )
    if (result) {
      const suggested = result.split(',').map(s => s.replace(/^[-•\d.\s]+/, '').trim()).filter(Boolean).slice(0, 12)
      const added     = suggested.filter(s => !cv.skills.includes(s))
      setCv(p => ({ ...p, skills: [...p.skills, ...added] }))
      showToast(`✓ Added ${added.length} skills`)
    }
  }

  // ── experience ──
  const addExp = () => {
    if (!expForm.company && !expForm.role) { showToast('Enter company or role'); return }
    setCv(p => ({ ...p, experience: [...p.experience, { ...expForm }] }))
    setExpForm(EMPTY_EXP)
    showToast('✓ Experience added')
  }
  const delExp = i => setCv(p => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))

  // ── education ──
  const addEdu = () => {
    if (!eduForm.school) { showToast('Enter school name'); return }
    setCv(p => ({ ...p, education: [...p.education, { ...eduForm }] }))
    setEduForm(EMPTY_EDU)
    showToast('✓ Education added')
  }
  const delEdu = i => setCv(p => ({ ...p, education: p.education.filter((_, j) => j !== i) }))

  // ── skills ──
  const addSkill = () => {
    if (!skillInput.trim()) return
    const news = skillInput.split(',').map(s => s.trim()).filter(Boolean)
    setCv(p => ({ ...p, skills: [...p.skills, ...news.filter(s => !p.skills.includes(s))] }))
    setSkillInput('')
  }
  const delSkill = i => setCv(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))

  // ── download ──
  const downloadCV = () => {
    const html = buildATSHtml(cv)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${[cv.firstName, cv.lastName].filter(Boolean).join('_') || 'My'}_ATS_CV.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('✓ Downloaded! Open → Ctrl+P → Save as PDF')
  }

  // ── render ──
  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">Resume<span className="nav-logo-accent">AI</span></div>
        <div className="nav-badge">✦ ATS-Optimized Builder</div>
      </nav>

      {/* HERO */}
      <header className="hero fade-up">
        <div className="hero-label">✦ Free · No Signup · AI-Powered</div>
        <h1 className="hero-h1">
          Your Dream Job Starts<br />
          with the <em>Perfect Resume</em>
        </h1>
        <p className="hero-sub">
          Fill in your details, let AI write compelling descriptions,<br />
          and download an ATS-optimized CV in minutes.
        </p>
        <div className="hero-stats">
          <div className="stat"><div className="stat-num">3 min</div><div className="stat-lbl">Average time</div></div>
          <div className="stat-div" />
          <div className="stat"><div className="stat-num">AI</div><div className="stat-lbl">Written bullets</div></div>
          <div className="stat-div" />
          <div className="stat"><div className="stat-num">Free</div><div className="stat-lbl">No signup</div></div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="main">

        {/* FORM CARD */}
        <div className="card">
          {/* Progress bar */}
          <div className="progress-bar">
            {STEPS.map((_, i) => (
              <div key={i} className={`prog-step ${i + 1 < step ? 'done' : i + 1 === step ? 'active' : ''}`} />
            ))}
          </div>

          {/* Step tabs */}
          <div className="steps-row" role="tablist">
            {STEPS.map((label, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={step === i + 1}
                className={`step-tab ${step === i + 1 ? 'active' : ''}`}
                onClick={() => setStep(i + 1)}
              >
                <span className="step-num">0{i + 1}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="card-body">

            {/* ── STEP 1: Personal ── */}
            {step === 1 && (
              <div className="form-section fade-up">
                <div className="row-2">
                  <Field label="First Name">
                    <input className="inp" value={cv.firstName} onChange={set('firstName')} placeholder="Ahmed" />
                  </Field>
                  <Field label="Last Name">
                    <input className="inp" value={cv.lastName} onChange={set('lastName')} placeholder="Hassan" />
                  </Field>
                </div>
                <Field label="Job Title / Target Role">
                  <input className="inp" value={cv.jobTitle} onChange={set('jobTitle')} placeholder="e.g. Senior Software Engineer" />
                </Field>
                <div className="row-2">
                  <Field label="Email">
                    <input className="inp" type="email" value={cv.email} onChange={set('email')} placeholder="ahmed@email.com" />
                  </Field>
                  <Field label="Phone">
                    <input className="inp" value={cv.phone} onChange={set('phone')} placeholder="+966 5x xxx xxxx" />
                  </Field>
                </div>
                <div className="row-2">
                  <Field label="Location">
                    <input className="inp" value={cv.location} onChange={set('location')} placeholder="Riyadh, Saudi Arabia" />
                  </Field>
                  <Field label="LinkedIn / Portfolio">
                    <input className="inp" value={cv.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/yourname" />
                  </Field>
                </div>
                <div className="nav-btns">
                  <button className="btn-primary" onClick={() => setStep(2)}>Next: Summary →</button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Summary ── */}
            {step === 2 && (
              <div className="form-section fade-up">
                <Field label="Professional Summary">
                  <textarea className="inp textarea" value={cv.summary} onChange={set('summary')}
                    rows={5} placeholder="A brief overview of your background, skills, and career goals…" />
                  <AiBtn onClick={aiSummary} loading={loading.summary}>AI Write My Summary</AiBtn>
                </Field>
                <div className="nav-btns">
                  <button className="btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn-primary" onClick={() => setStep(3)}>Next: Experience →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Experience ── */}
            {step === 3 && (
              <div className="form-section fade-up">
                {cv.experience.map((e, i) => (
                  <div key={i} className="item-box">
                    <div>
                      <div className="item-title">{e.company} — {e.role}</div>
                      <div className="item-sub">{e.start} – {e.end}</div>
                    </div>
                    <button className="del-btn" onClick={() => delExp(i)} aria-label="Remove">✕</button>
                  </div>
                ))}

                <div className="sub-form">
                  <div className="row-2">
                    <Field label="Company">
                      <input className="inp" value={expForm.company}
                        onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} placeholder="Google" />
                    </Field>
                    <Field label="Your Title">
                      <input className="inp" value={expForm.role}
                        onChange={e => setExpForm(p => ({ ...p, role: e.target.value }))} placeholder="Software Engineer" />
                    </Field>
                  </div>
                  <div className="row-2">
                    <Field label="Start">
                      <input className="inp" value={expForm.start}
                        onChange={e => setExpForm(p => ({ ...p, start: e.target.value }))} placeholder="Jan 2022" />
                    </Field>
                    <Field label="End">
                      <input className="inp" value={expForm.end}
                        onChange={e => setExpForm(p => ({ ...p, end: e.target.value }))} placeholder="Present" />
                    </Field>
                  </div>
                  <Field label="Description / Achievements">
                    <textarea className="inp textarea" value={expForm.desc}
                      onChange={e => setExpForm(p => ({ ...p, desc: e.target.value }))}
                      rows={3} placeholder="Your responsibilities and achievements…" />
                    <AiBtn onClick={aiExpDesc} loading={loading.expDesc}>AI Write Description</AiBtn>
                  </Field>
                  <button className="add-dashed-btn" onClick={addExp}>+ Add This Experience</button>
                </div>

                <div className="nav-btns">
                  <button className="btn-outline" onClick={() => setStep(2)}>← Back</button>
                  <button className="btn-primary" onClick={() => setStep(4)}>Next: Education →</button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Education ── */}
            {step === 4 && (
              <div className="form-section fade-up">
                {cv.education.map((e, i) => (
                  <div key={i} className="item-box">
                    <div>
                      <div className="item-title">{e.school}</div>
                      <div className="item-sub">{e.degree} · {e.start}–{e.end}</div>
                    </div>
                    <button className="del-btn" onClick={() => delEdu(i)} aria-label="Remove">✕</button>
                  </div>
                ))}

                <div className="sub-form">
                  <div className="row-2">
                    <Field label="School / University">
                      <input className="inp" value={eduForm.school}
                        onChange={e => setEduForm(p => ({ ...p, school: e.target.value }))} placeholder="King Saud University" />
                    </Field>
                    <Field label="Degree & Field">
                      <input className="inp" value={eduForm.degree}
                        onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} placeholder="B.Sc. Computer Science" />
                    </Field>
                  </div>
                  <div className="row-2">
                    <Field label="Start Year">
                      <input className="inp" value={eduForm.start}
                        onChange={e => setEduForm(p => ({ ...p, start: e.target.value }))} placeholder="2018" />
                    </Field>
                    <Field label="End Year">
                      <input className="inp" value={eduForm.end}
                        onChange={e => setEduForm(p => ({ ...p, end: e.target.value }))} placeholder="2022" />
                    </Field>
                  </div>
                  <button className="add-dashed-btn" onClick={addEdu}>+ Add This Education</button>
                </div>

                <div className="nav-btns">
                  <button className="btn-outline" onClick={() => setStep(3)}>← Back</button>
                  <button className="btn-primary" onClick={() => setStep(5)}>Next: Skills →</button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Skills ── */}
            {step === 5 && (
              <div className="form-section fade-up">
                <Field label="Skills">
                  <div className="skills-wrap">
                    {cv.skills.map((s, i) => (
                      <span key={i} className="skill-tag">
                        {s}
                        <button className="skill-del" onClick={() => delSkill(i)}>✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="skill-input-row">
                    <input className="inp" value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSkill()}
                      placeholder="Python, Leadership, Excel… (comma-separated)" />
                    <button className="skill-add-btn" onClick={addSkill}>Add</button>
                  </div>
                  <AiBtn onClick={aiSkills} loading={loading.skills}>AI Suggest Skills for My Role</AiBtn>
                </Field>

                <Field label="Languages">
                  <input className="inp" value={cv.languages} onChange={set('languages')}
                    placeholder="Arabic (Native), English (Fluent)" />
                </Field>

                <div className="nav-btns">
                  <button className="btn-outline" onClick={() => setStep(4)}>← Back</button>
                  <button className="btn-download" onClick={downloadCV}>⬇ Download ATS CV</button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* PREVIEW CARD */}
        <aside className="preview-card">
          <div className="preview-header">
            <span className="preview-title">Live Preview</span>
            <span className="ats-badge">● ATS Ready</span>
          </div>
          <CVPreview cv={cv} />
          <div className="preview-footer">
            <div className="ats-note">
              ✦ <strong>ATS Optimized</strong> — Arial · Single column · Semantic headings · Bullet lists · No images
            </div>
            <button className="btn-download-full" onClick={downloadCV}>⬇ Download ATS-Optimized CV</button>
          </div>
        </aside>

      </main>

      <Toast message={toast} />
    </>
  )
}
