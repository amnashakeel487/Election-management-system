import { useTranslation } from 'react-i18next'

const CONTACTS = [
  {
    id: 'abdullah',
    email: 'abdullahwale@gmail.com',
    nameKey: 'contact.abdullahName' as const,
    roleKey: 'contact.abdullahRole' as const,
    accent: '#2451A3',
    iconBg: 'rgba(36,81,163,0.1)',
  },
  {
    id: 'amna',
    email: 'amnashakeel606@gmail.com',
    nameKey: 'contact.amnaName' as const,
    roleKey: 'contact.amnaRole' as const,
    accent: '#6C3FC5',
    iconBg: 'rgba(108,63,197,0.1)',
  },
] as const

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function LandingContactSection() {
  const { t } = useTranslation('landing')

  const helpTopics = t('contact.helpTopics', { returnObjects: true }) as string[]

  return (
    <section className="contact-section section" id="contact">
      <div className="contact-orb contact-orb--1" aria-hidden />
      <div className="contact-orb contact-orb--2" aria-hidden />
      <div className="section-inner">
        <div className="section-header reveal">
          <div className="section-eyebrow">{t('contact.eyebrow')}</div>
          <h2 className="section-title">
            {t('contact.title')} <span className="accent">{t('contact.titleAccent')}</span>
          </h2>
          <p className="section-sub">{t('contact.sub')}</p>
        </div>

        <div className="contact-card reveal" style={{ transitionDelay: '0.15s' }}>
          <div className="contact-card-glow" aria-hidden />
          <div className="contact-card-header">
            <div className="contact-help-icon">
              <HelpIcon />
            </div>
            <div>
              <h3 className="contact-card-title">{t('contact.cardTitle')}</h3>
              <p className="contact-card-lead">{t('contact.cardLead')}</p>
            </div>
          </div>

          <div className="contact-topics">
            {helpTopics.map((topic) => (
              <span key={topic} className="contact-topic-chip">
                {topic}
              </span>
            ))}
          </div>

          <div className="contact-email-grid">
            {CONTACTS.map((person, i) => (
              <a
                key={person.id}
                href={`mailto:${person.email}?subject=${encodeURIComponent(t('contact.mailSubject'))}`}
                className="contact-email-card reveal"
                style={{ transitionDelay: `${0.2 + i * 0.1}s` }}
              >
                <div className="contact-email-icon" style={{ background: person.iconBg, color: person.accent }}>
                  <MailIcon />
                </div>
                <div className="contact-email-body">
                  <div className="contact-email-name">{t(person.nameKey)}</div>
                  <div className="contact-email-role">{t(person.roleKey)}</div>
                  <div className="contact-email-address">{person.email}</div>
                </div>
                <span className="contact-email-action">{t('contact.sendEmail')}</span>
              </a>
            ))}
          </div>

          <p className="contact-note">{t('contact.note')}</p>
        </div>
      </div>
    </section>
  )
}
