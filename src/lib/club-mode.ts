export type ClubMode = 'pricing' | 'diagnostic';

export function getClubMode(): ClubMode {
  const mode = process.env.NEXT_PUBLIC_CLUB_MODE;
  return mode === 'diagnostic' ? 'diagnostic' : 'pricing';
}
