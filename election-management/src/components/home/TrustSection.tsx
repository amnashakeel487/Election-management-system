import { LANDING_ASSETS } from '@/constants/designAssets'

const trustFeatures = [
  {
    icon: 'security',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: 'Immutable Ledger',
    description:
      'Every vote is recorded on a private, decentralized blockchain that prevents any form of tampering or after-the-fact modification.',
  },
  {
    icon: 'fingerprint',
    iconBg: 'bg-tertiary/10',
    iconColor: 'text-tertiary',
    title: 'Biometric Identity Verification',
    description:
      'We integrate with state-issued digital IDs and hardware-level biometrics to ensure one-person-one-vote without compromising privacy.',
  },
  {
    icon: 'visibility',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    title: 'Universal Auditability',
    description:
      'Voters receive an encrypted receipt allowing them to verify their vote was counted correctly while maintaining ballot secrecy.',
  },
] as const

export function TrustSection() {
  return (
    <section className="bg-surface-container-lowest px-margin py-2xl">
      <div className="grid grid-cols-1 items-center gap-2xl lg:grid-cols-2">
        <div>
          <h2 className="mb-6 font-headline-lg text-headline-lg text-on-surface">
            Designed for Administrative Absolute Integrity
          </h2>
          <div className="space-y-6">
            {trustFeatures.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className={`h-fit rounded-xl p-3 ${feature.iconBg}`}>
                  <span className={`material-symbols-outlined ${feature.iconColor}`}>{feature.icon}</span>
                </div>
                <div>
                  <h4 className="font-headline-md text-headline-md text-on-surface">{feature.title}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="group relative aspect-video overflow-hidden rounded-[32px] shadow-2xl shadow-black/60">
          <img
            alt="System Security Dashboard"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            src={LANDING_ASSETS.trustDashboard}
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 to-transparent p-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <span className="material-symbols-outlined text-on-primary">play_arrow</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface">Watch: How it Works</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
