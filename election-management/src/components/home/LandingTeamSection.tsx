import { useTranslation } from 'react-i18next'

const TEAM = [
  {
    id: 'leader',
    name: 'Muhammad Abdullah',
    email: 'abdullahwale@gmail.com',
    badgeKey: 'team.leaderBadge' as const,
    bioKey: 'team.leaderBio' as const,
    portfolio: 'https://muhammadabdullahwali.vercel.app/',
    photoUrl: '/team/muhammad-abdullah.png',
    initials: 'MA',
    theme: 'gold' as const,
  },
  {
    id: 'developer',
    name: 'Amna Shakeel',
    email: 'amnashakeel606@gmail.com',
    badgeKey: 'team.developerBadge' as const,
    bioKey: 'team.developerBio' as const,
    portfolio: 'https://amnashakeel-portfolio.vercel.app/',
    photoUrl: null,
    initials: 'AS',
    theme: 'blue' as const,
  },
] as const

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

export function LandingTeamSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="team-section section" id="team">
      <div className="team-bg-grid" aria-hidden />
      <div className="team-orb team-orb--1" aria-hidden />
      <div className="team-orb team-orb--2" aria-hidden />

      <div className="section-inner team-section-inner">
        <header className="team-header reveal">
          <span className="team-eyebrow-pill">{t('team.eyebrow')}</span>
          <h2 className="team-heading">
            {t('team.title')} <span className="team-heading-accent">{t('team.titleAccent')}</span>
          </h2>
          <p className="team-sub">{t('team.sub')}</p>
        </header>

        <div className="team-grid">
          {TEAM.map((member, i) => (
            <article
              key={member.id}
              className={`team-card team-card--${member.theme} reveal`}
              style={{ transitionDelay: `${0.15 + i * 0.12}s` }}
            >
              <div className="team-card-accent" aria-hidden />
              <div className="team-card-content">
                <div className={`team-avatar-wrap${member.theme === 'gold' ? ' team-avatar-wrap--float' : ''}`}>
                  <div className="team-avatar-glow" aria-hidden />
                  <div className="team-avatar-ring" aria-hidden />
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="team-avatar-img"
                      width={128}
                      height={128}
                      loading="lazy"
                    />
                  ) : (
                    <div className="team-avatar-fallback" aria-hidden>
                      {member.initials}
                    </div>
                  )}
                </div>

                <span className="team-role-badge">{t(member.badgeKey)}</span>
                <h3 className="team-name">{member.name}</h3>
                <a className="team-email" href={`mailto:${member.email}`}>
                  {member.email}
                </a>
                <p className="team-bio">{t(member.bioKey)}</p>
                <a
                  href={member.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="team-portfolio-btn"
                >
                  <GlobeIcon />
                  {t('team.viewPortfolio')}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
