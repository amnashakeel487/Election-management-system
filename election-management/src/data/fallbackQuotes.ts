export interface FallbackQuote {
  text: string
  author: string
}

export const FALLBACK_QUOTES: FallbackQuote[] = [
  {
    text: 'Democracy is not merely a form of government; it is a mode of associated living, a mode of conjoint communicated experience.',
    author: 'B. R. Ambedkar',
  },
  {
    text: 'The ballot is stronger than the bullet.',
    author: 'Abraham Lincoln',
  },
  {
    text: 'Elections belong to the people. It is their decision. If they decide to turn their back on the fire and burn their behinds, then they will just have to sit on their blisters.',
    author: 'Abraham Lincoln',
  },
  {
    text: 'Voting is the expression of our commitment to ourselves, one another, this country, and this world.',
    author: 'Sharon Salzberg',
  },
  {
    text: 'The vote is the most powerful nonviolent tool we have in a democratic society.',
    author: 'John Lewis',
  },
  {
    text: 'Democracy cannot succeed unless those who express their choice are prepared to choose wisely.',
    author: 'Franklin D. Roosevelt',
  },
  {
    text: 'A nation of sheep begets a government of wolves.',
    author: 'Edward R. Murrow',
  },
  {
    text: 'The ignorance of one voter in a democracy impairs the security of all.',
    author: 'John F. Kennedy',
  },
  {
    text: 'Talk is cheap, voting is free; take it to the polls.',
    author: 'Nanette L. Avery',
  },
  {
    text: 'Democracy is based upon the conviction there are extraordinary possibilities in ordinary people.',
    author: 'Harry Emerson Fosdick',
  },
  {
    text: 'The health of a democratic society may be measured by the quality of functions performed by private citizens.',
    author: 'Alexis de Tocqueville',
  },
  {
    text: 'Every election is determined by the people who show up.',
    author: 'Larry J. Sabato',
  },
  {
    text: 'The vote is precious. It is almost sacred. It is the most powerful nonviolent tool we have.',
    author: 'John Lewis',
  },
  {
    text: 'In a democracy, the highest office is the office of citizen.',
    author: 'Louis Brandeis',
  },
  {
    text: 'Participation in elections is not just a right—it is how we shape the future we share.',
    author: 'FortressVote',
  },
  {
    text: 'Secure elections protect the voice of every citizen and the legitimacy of every outcome.',
    author: 'FortressVote',
  },
  {
    text: 'When we vote, we honor those who fought for the right and accept responsibility for those who follow.',
    author: 'FortressVote',
  },
]

export function pickRandomFallbackQuote(): FallbackQuote {
  const index = Math.floor(Math.random() * FALLBACK_QUOTES.length)
  return FALLBACK_QUOTES[index] ?? FALLBACK_QUOTES[0]
}
