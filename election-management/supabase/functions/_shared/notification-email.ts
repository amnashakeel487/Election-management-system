const appUrl = () =>
  Deno.env.get('APP_URL')?.replace(/\/$/, '') ?? 'https://election-manager-systm-three.vercel.app'

export function wrapEmailHtml(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family: 'Segoe UI', Sora, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="margin-bottom: 24px;">
    <strong style="color: #1B3A6B; font-size: 18px;">FortressVote</strong>
  </div>
  ${body}
  <p style="margin-top: 32px; font-size: 12px; color: #64748b;">— FortressVote Election Platform</p>
</body>
</html>`
}

export function verificationEmailHtml(email: string): { subject: string; html: string } {
  const url = `${appUrl()}/verify-email`
  return {
    subject: 'Verify your FortressVote email',
    html: wrapEmailHtml(`
      <p>Hello,</p>
      <p>Please verify your email address (<strong>${email}</strong>) to activate your FortressVote account.</p>
      <p><a href="${url}" style="display:inline-block;background:#1B3A6B;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Verify email</a></p>
      <p style="font-size:13px;color:#64748b;">If you did not create an account, you can ignore this message.</p>
    `),
  }
}

export function creatorApprovalEmailHtml(
  displayName: string,
  approved: boolean,
  organization?: string | null,
  rejectionReason?: string,
): { subject: string; html: string } {
  if (approved) {
    return {
      subject: 'FortressVote — Your Election Creator application was approved',
      html: wrapEmailHtml(`
        <p>Hello ${displayName},</p>
        <p>Your request to become an <strong>Election Creator</strong> has been <strong>approved</strong>.</p>
        <p><a href="${appUrl()}/creator/dashboard">Open your creator dashboard</a></p>
        ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
      `),
    }
  }
  return {
    subject: 'FortressVote — Update on your Election Creator application',
    html: wrapEmailHtml(`
      <p>Hello ${displayName},</p>
      <p>Your Election Creator application was <strong>not approved</strong> at this time.</p>
      ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
    `),
  }
}

export function secretVoterIdEmailHtml(
  electionTitle: string,
  secretVoterId: string,
): { subject: string; html: string } {
  return {
    subject: `Your Secret Voter ID — ${electionTitle}`,
    html: wrapEmailHtml(`
      <p>You are registered for <strong>${electionTitle}</strong>.</p>
      <p>Your unique Secret Voter ID is:</p>
      <p style="font-family: monospace; font-size: 20px; letter-spacing: 2px; background:#f1f5f9;padding:12px;border-radius:8px;"><strong>${secretVoterId}</strong></p>
      <p>Keep this ID private. You need it to cast your vote.</p>
      <p><a href="${appUrl()}/voter/dashboard">Go to voter dashboard</a></p>
    `),
  }
}

export function electionStartEmailHtml(
  electionTitle: string,
  startDate: string,
  endDate: string,
): { subject: string; html: string } {
  return {
    subject: `Voting is open — ${electionTitle}`,
    html: wrapEmailHtml(`
      <p>Voting has <strong>started</strong> for <strong>${electionTitle}</strong>.</p>
      <p><strong>Closes:</strong> ${new Date(endDate).toLocaleString()}</p>
      <p>Use your Secret Voter ID from your registration email to cast your ballot.</p>
      <p><a href="${appUrl()}/voter/dashboard">Vote now</a></p>
    `),
  }
}

export function electionEndEmailHtml(electionTitle: string): { subject: string; html: string } {
  return {
    subject: `Voting closed — ${electionTitle}`,
    html: wrapEmailHtml(`
      <p>Voting for <strong>${electionTitle}</strong> has <strong>ended</strong>.</p>
      <p>Thank you for participating. Results will be published when certified by the election administrator.</p>
      <p><a href="${appUrl()}/results">View results</a></p>
    `),
  }
}

export function winnerEmailHtml(
  electionTitle: string,
  winnerName: string,
  voteCount: number,
  turnoutPercent: number,
): { subject: string; html: string } {
  return {
    subject: `Final results — ${electionTitle}`,
    html: wrapEmailHtml(`
      <p>Official results are available for <strong>${electionTitle}</strong>.</p>
      <p><strong>Winner:</strong> ${winnerName}</p>
      <p><strong>Votes:</strong> ${voteCount.toLocaleString()} · <strong>Turnout:</strong> ${turnoutPercent.toFixed(1)}%</p>
      <p><a href="${appUrl()}/results">View full results</a></p>
    `),
  }
}

export function waitlistJoinedEmailHtml(
  electionTitle: string,
  position: number,
  electionId: string,
): { subject: string; html: string } {
  return {
    subject: `Waitlist confirmation — ${electionTitle}`,
    html: wrapEmailHtml(`
      <p>You are <strong>#${position}</strong> on the waitlist for <strong>${electionTitle}</strong>.</p>
      <p>We will email you if a registered spot opens before the registration deadline.</p>
      <p><a href="${appUrl()}/elections/${electionId}">View election</a></p>
    `),
  }
}

export function waitlistPromotedEmailHtml(
  electionTitle: string,
  electionId: string,
): { subject: string; html: string } {
  return {
    subject: `You are approved to vote — ${electionTitle}`,
    html: wrapEmailHtml(`
      <p>Good news! A spot opened and you have been <strong>promoted from the waitlist</strong> for <strong>${electionTitle}</strong>.</p>
      <p>You are now a registered voter. Your secret voter ID will be issued when the organizer finalizes the roll.</p>
      <p><a href="${appUrl()}/elections/${electionId}">Open election page</a></p>
    `),
  }
}
