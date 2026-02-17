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
    
    // Fetch year ratings to get 2026 points
    const ratingsResponse = await fetch(`https://ctftime.org/api/v1/teams/${teamId}/ratings/${year}/`, {
      headers: {
        'User-Agent': 'ch0wn3rs-website'
      }
    });
    
    let yearPoints = '45.81'; // Default from CTFtime page
    if (ratingsResponse.ok) {
      const ratingsData = await ratingsResponse.json();
      if (ratingsData && Object.keys(ratingsData).length > 0) {
        const total = Object.values(ratingsData).reduce((sum: number, event: any) => {
          return sum + (parseFloat(event.rating_points) || 0);
        }, 0);
        yearPoints = total.toFixed(2);
      }
    }
    
    // Extract data - use overall rating place (rank 131)
    const globalRank = teamData.rating?.[0]?.rating_place || '131';
    const rating = teamData.rating?.[0]?.rating_points?.toFixed(2) || '45.81';
    
    return new Response(JSON.stringify({
      colombiaRank,
      globalRank: `#${globalRank}`,
      rating: `${rating} pts`,
      yearPoints: `${yearPoints} pts`
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
      yearPoints: 'N/A'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
