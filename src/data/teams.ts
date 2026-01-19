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
  },
  {
    id: 'miami-dolphins',
    name: 'Miami Dolphins',
    city: 'Miami',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#008E97',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'new-england-patriots',
    name: 'New England Patriots',
    city: 'New England',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#002244',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'new-york-jets',
    name: 'New York Jets',
    city: 'New York',
    conference: 'AFC',
    division: 'AFC East',
    primaryColor: '#125740',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'baltimore-ravens',
    name: 'Baltimore Ravens',
    city: 'Baltimore',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#241773',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'cincinnati-bengals',
    name: 'Cincinnati Bengals',
    city: 'Cincinnati',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#FB4F14',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'cleveland-browns',
    name: 'Cleveland Browns',
    city: 'Cleveland',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#311D00',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'pittsburgh-steelers',
    name: 'Pittsburgh Steelers',
    city: 'Pittsburgh',
    conference: 'AFC',
    division: 'AFC North',
    primaryColor: '#FFB612',
    secondaryColor: '#000000',
  },
  {
    id: 'houston-texans',
    name: 'Houston Texans',
    city: 'Houston',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#03202F',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'indianapolis-colts',
    name: 'Indianapolis Colts',
    city: 'Indianapolis',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#002C5F',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'jacksonville-jaguars',
    name: 'Jacksonville Jaguars',
    city: 'Jacksonville',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#006778',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'tennessee-titans',
    name: 'Tennessee Titans',
    city: 'Tennessee',
    conference: 'AFC',
    division: 'AFC South',
    primaryColor: '#0C2340',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'denver-broncos',
    name: 'Denver Broncos',
    city: 'Denver',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#FB4F14',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'kansas-city-chiefs',
    name: 'Kansas City Chiefs',
    city: 'Kansas City',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#E31837',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'las-vegas-raiders',
    name: 'Las Vegas Raiders',
    city: 'Las Vegas',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'los-angeles-chargers',
    name: 'Los Angeles Chargers',
    city: 'Los Angeles',
    conference: 'AFC',
    division: 'AFC West',
    primaryColor: '#0080C6',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'dallas-cowboys',
    name: 'Dallas Cowboys',
    city: 'Dallas',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#041E42',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'new-york-giants',
    name: 'New York Giants',
    city: 'New York',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#0B2265',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'philadelphia-eagles',
    name: 'Philadelphia Eagles',
    city: 'Philadelphia',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#004C54',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'washington-commanders',
    name: 'Washington Commanders',
    city: 'Washington',
    conference: 'NFC',
    division: 'NFC East',
    primaryColor: '#5A1414',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'chicago-bears',
    name: 'Chicago Bears',
    city: 'Chicago',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#0B162A',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'detroit-lions',
    name: 'Detroit Lions',
    city: 'Detroit',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#0076B6',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'green-bay-packers',
    name: 'Green Bay Packers',
    city: 'Green Bay',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#203731',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'minnesota-vikings',
    name: 'Minnesota Vikings',
    city: 'Minnesota',
    conference: 'NFC',
    division: 'NFC North',
    primaryColor: '#4F2683',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'atlanta-falcons',
    name: 'Atlanta Falcons',
    city: 'Atlanta',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#A71930',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'carolina-panthers',
    name: 'Carolina Panthers',
    city: 'Carolina',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#0085CA',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'new-orleans-saints',
    name: 'New Orleans Saints',
    city: 'New Orleans',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#D3BC8D',
    secondaryColor: '#000000',
  },
  {
    id: 'tampa-bay-buccaneers',
    name: 'Tampa Bay Buccaneers',
    city: 'Tampa Bay',
    conference: 'NFC',
    division: 'NFC South',
    primaryColor: '#D50A0A',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'arizona-cardinals',
    name: 'Arizona Cardinals',
    city: 'Arizona',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#97233F',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'los-angeles-rams',
    name: 'Los Angeles Rams',
    city: 'Los Angeles',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#003594',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'san-francisco-49ers',
    name: 'San Francisco 49ers',
    city: 'San Francisco',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#AA0000',
    secondaryColor: '#FFFFFF',
  },
  {
    id: 'seattle-seahawks',
    name: 'Seattle Seahawks',
    city: 'Seattle',
    conference: 'NFC',
    division: 'NFC West',
    primaryColor: '#002244',
    secondaryColor: '#FFFFFF',
  },
];

export const TEAM_BY_ID = Object.fromEntries(
  TEAMS.map((team) => [team.id, team]),
) as Record<string, Team>;

const TEAM_BY_NAME = Object.fromEntries(
  TEAMS.map((team) => [team.name.toLowerCase(), team]),
) as Record<string, Team>;

export function getTeamById(id: Team['id']): Team | undefined {
  return TEAM_BY_ID[id];
}

export function getTeamByName(name: string): Team | undefined {
  return TEAM_BY_NAME[name.toLowerCase()];
}
