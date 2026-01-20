export type Conference = 'AFC' | 'NFC';

export type Division =
  | 'AFC East'
  | 'AFC North'
  | 'AFC South'
  | 'AFC West'
  | 'NFC East'
  | 'NFC North'
  | 'NFC South'
  | 'NFC West';

export interface Team {
  id: string;
  name: string;
  city: string;
  conference: Conference;
  division: Division;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export const TEAMS: Team[] = [
  {
    id: 'buffalo-bills',
    name: 'Buffalo Bills',
    city: 'Buffalo',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#00338D',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
  },
  {
    id: 'miami-dolphins',
    name: 'Miami Dolphins',
    city: 'Miami',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#008E97',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
  },
  {
    id: 'new-england-patriots',
    name: 'New England Patriots',
    city: 'New England',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#002244',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
  },
  {
    id: 'new-york-jets',
    name: 'New York Jets',
    city: 'New York',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#125740',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
  },
  {
    id: 'baltimore-ravens',
    name: 'Baltimore Ravens',
    city: 'Baltimore',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#241773',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
  },
  {
    id: 'cincinnati-bengals',
    name: 'Cincinnati Bengals',
    city: 'Cincinnati',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#FB4F14',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
  },
  {
    id: 'cleveland-browns',
    name: 'Cleveland Browns',
    city: 'Cleveland',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#311D00',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
  },
  {
    id: 'pittsburgh-steelers',
    name: 'Pittsburgh Steelers',
    city: 'Pittsburgh',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#FFB612',
    secondaryColor: '#000000',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
  },
  {
    id: 'houston-texans',
    name: 'Houston Texans',
    city: 'Houston',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#03202F',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
  },
  {
    id: 'indianapolis-colts',
    name: 'Indianapolis Colts',
    city: 'Indianapolis',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#002C5F',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
  },
  {
    id: 'jacksonville-jaguars',
    name: 'Jacksonville Jaguars',
    city: 'Jacksonville',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#006778',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
  },
  {
    id: 'tennessee-titans',
    name: 'Tennessee Titans',
    city: 'Tennessee',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#0C2340',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
  },
  {
    id: 'denver-broncos',
    name: 'Denver Broncos',
    city: 'Denver',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#FB4F14',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
  },
  {
    id: 'kansas-city-chiefs',
    name: 'Kansas City Chiefs',
    city: 'Kansas City',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#E31837',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
  },
  {
    id: 'las-vegas-raiders',
    name: 'Las Vegas Raiders',
    city: 'Las Vegas',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png',
  },
  {
    id: 'los-angeles-chargers',
    name: 'Los Angeles Chargers',
    city: 'Los Angeles',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#0080C6',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
  },
  {
    id: 'dallas-cowboys',
    name: 'Dallas Cowboys',
    city: 'Dallas',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#041E42',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
  },
  {
    id: 'new-york-giants',
    name: 'New York Giants',
    city: 'New York',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#0B2265',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
  },
  {
    id: 'philadelphia-eagles',
    name: 'Philadelphia Eagles',
    city: 'Philadelphia',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#004C54',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
  },
  {
    id: 'washington-commanders',
    name: 'Washington Commanders',
    city: 'Washington',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#5A1414',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/was.png',
  },
  {
    id: 'chicago-bears',
    name: 'Chicago Bears',
    city: 'Chicago',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#0B162A',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
  },
  {
    id: 'detroit-lions',
    name: 'Detroit Lions',
    city: 'Detroit',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#0076B6',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
  },
  {
    id: 'green-bay-packers',
    name: 'Green Bay Packers',
    city: 'Green Bay',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#203731',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
  },
  {
    id: 'minnesota-vikings',
    name: 'Minnesota Vikings',
    city: 'Minnesota',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#4F2683',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
  },
  {
    id: 'atlanta-falcons',
    name: 'Atlanta Falcons',
    city: 'Atlanta',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#A71930',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
  },
  {
    id: 'carolina-panthers',
    name: 'Carolina Panthers',
    city: 'Carolina',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#0085CA',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
  },
  {
    id: 'new-orleans-saints',
    name: 'New Orleans Saints',
    city: 'New Orleans',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#D3BC8D',
    secondaryColor: '#000000',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
  },
  {
    id: 'tampa-bay-buccaneers',
    name: 'Tampa Bay Buccaneers',
    city: 'Tampa Bay',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#D50A0A',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
  },
  {
    id: 'arizona-cardinals',
    name: 'Arizona Cardinals',
    city: 'Arizona',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#97233F',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
  },
  {
    id: 'los-angeles-rams',
    name: 'Los Angeles Rams',
    city: 'Los Angeles',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#003594',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
  },
  {
    id: 'san-francisco-49ers',
    name: 'San Francisco 49ers',
    city: 'San Francisco',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#AA0000',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
  },
  {
    id: 'seattle-seahawks',
    name: 'Seattle Seahawks',
    city: 'Seattle',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#002244',
    secondaryColor: '#FFFFFF',
    logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
  },
];

export const TEAM_BY_ID = Object.fromEntries(
  TEAMS.map((team) => [team.id, team]),
) as Record<string, Team>;

const NAME_REPLACEMENTS: Array<[RegExp, string]> = [
  [/los angeles/gi, 'la'],
  [/new york/gi, 'ny'],
  [/new england/gi, 'ne'],
  [/tampa bay/gi, 'tb'],
  [/green bay/gi, 'gb'],
  [/san francisco/gi, 'sf'],
  [/las vegas/gi, 'lv'],
  [/kansas city/gi, 'kc'],
  [/new orleans/gi, 'no'],
];

export function normalizeTeamName(name: string): string {
  let value = name.toLowerCase();
  NAME_REPLACEMENTS.forEach(([pattern, replacement]) => {
    value = value.replace(pattern, replacement);
  });
  return value.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '').trim();
}

const TEAM_BY_NAME = Object.fromEntries(
  TEAMS.map((team) => [team.name.toLowerCase(), team]),
) as Record<string, Team>;

const TEAM_BY_NORMALIZED = TEAMS.reduce<Record<string, Team>>((acc, team) => {
  const aliases = new Set<string>([team.name]);
  const nameParts = team.name.split(' ');
  if (nameParts.length > 1) {
    aliases.add(nameParts.slice(-1).join(' '));
  }
  aliases.forEach((alias) => {
    acc[normalizeTeamName(alias)] = team;
  });
  return acc;
}, {});

export function getTeamById(id: Team['id']): Team | undefined {
  return TEAM_BY_ID[id];
}

export function getTeamByName(name: string): Team | undefined {
  const direct = TEAM_BY_NAME[name.toLowerCase()];
  if (direct) return direct;
  return TEAM_BY_NORMALIZED[normalizeTeamName(name)];
}
