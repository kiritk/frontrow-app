export interface NFLTeam {
  name: string;
  city: string;
  fullName: string;
  logo: any;
}

export const NFL_TEAMS: NFLTeam[] = [
  { name: '49ers', city: 'San Francisco', fullName: 'San Francisco 49ers', logo: require('../../assets/images/nfl/teams/49ers.png') },
  { name: 'Bears', city: 'Chicago', fullName: 'Chicago Bears', logo: require('../../assets/images/nfl/teams/bears.png') },
  { name: 'Bengals', city: 'Cincinnati', fullName: 'Cincinnati Bengals', logo: require('../../assets/images/nfl/teams/bengals.png') },
  { name: 'Bills', city: 'Buffalo', fullName: 'Buffalo Bills', logo: require('../../assets/images/nfl/teams/bills.png') },
  { name: 'Broncos', city: 'Denver', fullName: 'Denver Broncos', logo: require('../../assets/images/nfl/teams/broncos.png') },
  { name: 'Browns', city: 'Cleveland', fullName: 'Cleveland Browns', logo: require('../../assets/images/nfl/teams/browns.png') },
  { name: 'Buccaneers', city: 'Tampa Bay', fullName: 'Tampa Bay Buccaneers', logo: require('../../assets/images/nfl/teams/buccaneers.png') },
  { name: 'Cardinals', city: 'Arizona', fullName: 'Arizona Cardinals', logo: require('../../assets/images/nfl/teams/cardinals.png') },
  { name: 'Chargers', city: 'Los Angeles', fullName: 'Los Angeles Chargers', logo: require('../../assets/images/nfl/teams/chargers.png') },
  { name: 'Chiefs', city: 'Kansas City', fullName: 'Kansas City Chiefs', logo: require('../../assets/images/nfl/teams/chiefs.png') },
  { name: 'Colts', city: 'Indianapolis', fullName: 'Indianapolis Colts', logo: require('../../assets/images/nfl/teams/colts.png') },
  { name: 'Commanders', city: 'Washington', fullName: 'Washington Commanders', logo: require('../../assets/images/nfl/teams/commanders.png') },
  { name: 'Cowboys', city: 'Dallas', fullName: 'Dallas Cowboys', logo: require('../../assets/images/nfl/teams/cowboys.png') },
  { name: 'Dolphins', city: 'Miami', fullName: 'Miami Dolphins', logo: require('../../assets/images/nfl/teams/dolphins.png') },
  { name: 'Eagles', city: 'Philadelphia', fullName: 'Philadelphia Eagles', logo: require('../../assets/images/nfl/teams/eagles.png') },
  { name: 'Falcons', city: 'Atlanta', fullName: 'Atlanta Falcons', logo: require('../../assets/images/nfl/teams/falcons.png') },
  { name: 'Giants', city: 'New York', fullName: 'New York Giants', logo: require('../../assets/images/nfl/teams/giants.png') },
  { name: 'Jaguars', city: 'Jacksonville', fullName: 'Jacksonville Jaguars', logo: require('../../assets/images/nfl/teams/jaguars.png') },
  { name: 'Jets', city: 'New York', fullName: 'New York Jets', logo: require('../../assets/images/nfl/teams/jets.png') },
  { name: 'Lions', city: 'Detroit', fullName: 'Detroit Lions', logo: require('../../assets/images/nfl/teams/lions.png') },
  { name: 'Packers', city: 'Green Bay', fullName: 'Green Bay Packers', logo: require('../../assets/images/nfl/teams/packers.png') },
  { name: 'Panthers', city: 'Carolina', fullName: 'Carolina Panthers', logo: require('../../assets/images/nfl/teams/panthers.png') },
  { name: 'Patriots', city: 'New England', fullName: 'New England Patriots', logo: require('../../assets/images/nfl/teams/patriots.png') },
  { name: 'Raiders', city: 'Las Vegas', fullName: 'Las Vegas Raiders', logo: require('../../assets/images/nfl/teams/raiders.png') },
  { name: 'Rams', city: 'Los Angeles', fullName: 'Los Angeles Rams', logo: require('../../assets/images/nfl/teams/rams.png') },
  { name: 'Ravens', city: 'Baltimore', fullName: 'Baltimore Ravens', logo: require('../../assets/images/nfl/teams/ravens.png') },
  { name: 'Saints', city: 'New Orleans', fullName: 'New Orleans Saints', logo: require('../../assets/images/nfl/teams/saints.png') },
  { name: 'Seahawks', city: 'Seattle', fullName: 'Seattle Seahawks', logo: require('../../assets/images/nfl/teams/seahawks.png') },
  { name: 'Steelers', city: 'Pittsburgh', fullName: 'Pittsburgh Steelers', logo: require('../../assets/images/nfl/teams/steelers.png') },
  { name: 'Texans', city: 'Houston', fullName: 'Houston Texans', logo: require('../../assets/images/nfl/teams/texans.png') },
  { name: 'Titans', city: 'Tennessee', fullName: 'Tennessee Titans', logo: require('../../assets/images/nfl/teams/titans.png') },
  { name: 'Vikings', city: 'Minnesota', fullName: 'Minnesota Vikings', logo: require('../../assets/images/nfl/teams/vikings.png') },
];

export const getTeamByName = (name: string): NFLTeam | undefined => {
  return NFL_TEAMS.find(team => team.name.toLowerCase() === name.toLowerCase());
};
