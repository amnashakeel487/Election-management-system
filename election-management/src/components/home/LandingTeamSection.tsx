import { useTranslation } from 'react-i18next'

const TEAM = [
  {
    id: 'leader',
    name: 'Muhammad Abdullah',
    roleKey: 'team.leaderRole' as const,
    bioKey: 'team.leaderBio' as const,
    portfolio: 'https://muhammadabdullahwali.vercel.app/',
    photoUrl: '/team/muhammad-abdullah.png',
    initials: 'MA',
    gradient: 'linear-gradient(135deg,#1B3A6B,#6C3FC5)',
    featured: true,
  },
  {
    id: 'developer',
    name: 'Amna Shakeel',
    roleKey: 'team.developerRole' as const,
    bioKey: 'team.developerBio' as const,
    portfolio: 'https://amnashakeel-portfolio.vercel.app/',
    photoUrl: null,
    initials: 'AS',
    gradient: 'linear-gradient(135deg,#DB2777,#6C3FC5)',
    featured: false,
  },
] as const

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export function LandingTeamSection() {
  const { t } = useTranslation('landing')

  return (
    <section className="team-section section" id="team">
      <div className="team-orb team-orb--1" aria-hidden />
      <div className="team-orb team-orb--2" aria-hidden />
      <div className="section-inner">
        <div className="section-header reveal">
          <div className="section-eyebrow">{t('team.eyebrow')}</div>
          <h2 className="section-title">
            {t('team.title')} <span className="accent">{t('team.titleAccent')}</span>
          </h2>
          <p className="section-sub" style={{ fontSize: 14, marginTop: 8, maxWidth: 560 }}>
            {t('team.sub')}
          </p>
        </div>

        <div className="team-grid">
          {TEAM.map((member, i) => (
            <article
              key={member.id}
              className={`team-card reveal${member.featured ? ' team-card--featured' : ''}`}
              style={{ transitionDelay: `${0.12 * (i + 1)}s` }}
            >
              {member.featured ? <span className="team-featured-badge">{t('team.leaderBadge')}</span> : null}
              <div className="team-card-inner">
                <div className={`team-avatar-wrap${member.featured ? ' team-avatar-wrap--float' : ''}`}>
                  <div className="team-avatar-ring" aria-hidden />
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="team-avatar-img"
                      width={120}
                      height={120}
                      loading="lazy"
                    />
                  ) : (
                    <div className="team-avatar-fallback" style={{ background: member.gradient }}>
                      {member.initials}
                    </div>
                  )}
                </div>
                <div className="team-card-body">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{t(member.roleKey)}</p>
                  <p className="team-bio">{t(member.bioKey)}</p>
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="team-portfolio-btn"
                  >
                    {t('team.viewPortfolio')}
                    <ExternalIcon />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
