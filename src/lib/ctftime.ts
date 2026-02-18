export async function fetchCtftime(teamId: string) {
  const year = new Date().getFullYear();

  // default fallback values
  const fallback = {
    colombiaRank: '#1 COLOMBIA',
    globalRank: '#131',
    rating: '45.81 pts',
    activeSince: String(year),
  };

  if (!teamId) return fallback;

  try {
    const teamRes = await fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
      headers: { 'User-Agent': 'ch0wn3rs-website' },
    });
    if (!teamRes.ok) return fallback;
    const teamData = await teamRes.json();

    // try to calculate Colombia ranking from top teams for the current year
    let colombiaRank = fallback.colombiaRank;
    try {
      const topRes = await fetch(`https://ctftime.org/api/v1/top/${year}/`, {
        headers: { 'User-Agent': 'ch0wn3rs-website' },
      });
      if (topRes.ok) {
        const topData = await topRes.json();
        const colombianTeams = Object.entries(topData)
          .map(([name, data]: [string, any]) => ({ name, ...data }))
          .filter((t: any) => {
            // some entries keep country under the year key
            const country = t?.[year]?.country ?? t.country ?? t?.country_code ?? undefined;
            return country === 'CO' || country === 'COL' || country === 'Colombia';
          })
          .sort((a: any, b: any) => {
            const aPts = a?.[year]?.points ?? a?.points ?? 0;
            const bPts = b?.[year]?.points ?? b?.points ?? 0;
            return bPts - aPts;
          });

        const position = colombianTeams.findIndex((t: any) =>
          String(t.name).toLowerCase().includes('ch0wn3rs') || String(t?.team_id) === String(teamId)
        );
        if (position !== -1) colombiaRank = `#${position + 1} COLOMBIA`;
      }
    } catch (err) {
      // ignore top teams failure and keep fallback
    }

    const currentYearRating = teamData.rating?.[String(year)] ?? teamData.rating?.[0] ?? {};
    const globalRank = currentYearRating?.rating_place ?? teamData.rating?.[0]?.rating_place ?? 'N/A';
    const ratingPoints = currentYearRating?.rating_points ?? teamData.rating?.[0]?.rating_points ?? null;
    const rating = ratingPoints != null ? `${Number(ratingPoints).toFixed(2)} pts` : 'N/A';

    const activeSince = new Date().getFullYear().toString();

    return {
      colombiaRank,
      globalRank: `#${globalRank}`,
      rating,
      activeSince,
    };
  } catch (err) {
    return fallback;
  }
}
