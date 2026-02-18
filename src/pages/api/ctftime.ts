export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get('teamId');
  
  if (!teamId) {
    return new Response(JSON.stringify({ error: 'Team ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const year = 2026; // Año actual
    
    // Fetch team info
    const teamResponse = await fetch(`https://ctftime.org/api/v1/teams/${teamId}/`, {
      headers: {
        'User-Agent': 'ch0wn3rs-website'
      }
    });
    
    if (!teamResponse.ok) {
      throw new Error('Failed to fetch team data');
    }
    
    const teamData = await teamResponse.json();
    
    // Fetch top teams to calculate Colombia ranking
    const topTeamsResponse = await fetch(`https://ctftime.org/api/v1/top/${year}/`, {
      headers: {
        'User-Agent': 'ch0wn3rs-website'
      }
    });
    
    let colombiaRank = '#1 COLOMBIA';
    if (topTeamsResponse.ok) {
      const topTeamsData = await topTeamsResponse.json();
      
      // Filter Colombian teams - the structure has 'team_name' as key and data as value
      const colombianTeams = Object.entries(topTeamsData)
        .map(([name, data]: [string, any]) => ({
          name,
          ...data,
          country: data['2026']?.country || data.country
        }))
        .filter((team: any) => team.country === 'CO')
        .sort((a: any, b: any) => {
          const aPoints = a['2026']?.points || 0;
          const bPoints = b['2026']?.points || 0;
          return bPoints - aPoints;
        });
      
      // Find ch0wn3rs position among Colombian teams
      const position = colombianTeams.findIndex((team: any) => 
        team.name?.toLowerCase().includes('ch0wn3rs') || 
        String(team.team_id) === teamId
      );
      
      if (position !== -1) {
        colombiaRank = `#${position + 1} COLOMBIA`;
      }
    }
    
    // Use current year as the founding year (updates automatically each January 1st)
    const currentDate = new Date();
    const activeSince = currentDate.getFullYear().toString();
    
    // Extract data - use current year rating place and points
    const currentYear = teamData.rating?.[String(year)] || {};
    const globalRank = currentYear.rating_place || teamData.rating?.[0]?.rating_place || '131';
    const rating = currentYear.rating_points?.toFixed(2) || teamData.rating?.[0]?.rating_points?.toFixed(2) || '45.81';
    
    return new Response(JSON.stringify({
      colombiaRank,
      globalRank: `#${globalRank}`,
      rating: `${rating} pts`,
      activeSince: activeSince
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900' // Cache for 15 minutes
      }
    });
    
  } catch (error) {
    console.error('Error fetching CTFtime data:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch data',
      colombiaRank: '#1 COLOMBIA',
      globalRank: 'N/A',
      rating: 'N/A',
      activeSince: 'N/A'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
