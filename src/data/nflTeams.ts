export interface NFLTeam {
  name: string;
  city: string;
  fullName: string;
  stadium: string;
  logo: any;
  stadiumImage: any;
}

export const NFL_TEAMS: NFLTeam[] = [
  { name: '49ers', city: 'San Francisco', fullName: 'San Francisco 49ers', stadium: 'Levi\'s Stadium', logo: require('../../assets/images/nfl/teams/49ers.png'), stadiumImage: require('../../assets/images/nfl/stadiums/49ers.jpg') },
  { name: 'Bears', city: 'Chicago', fullName: 'Chicago Bears', stadium: 'Soldier Field', logo: require('../../assets/images/nfl/teams/bears.png'), stadiumImage: require('../../assets/images/nfl/stadiums/bears.jpg') },
  { name: 'Bengals', city: 'Cincinnati', fullName: 'Cincinnati Bengals', stadium: 'Paycor Stadium', logo: require('../../assets/images/nfl/teams/bengals.png'), stadiumImage: require('../../assets/images/nfl/stadiums/bengals.jpg') },
  { name: 'Bills', city: 'Buffalo', fullName: 'Buffalo Bills', stadium: 'Highmark Stadium', logo: require('../../assets/images/nfl/teams/bills.png'), stadiumImage: require('../../assets/images/nfl/stadiums/bills.jpg') },
  { name: 'Broncos', city: 'Denver', fullName: 'Denver Broncos', stadium: 'Empower Field at Mile High', logo: require('../../assets/images/nfl/teams/broncos.png'), stadiumImage: require('../../assets/images/nfl/stadiums/broncos.jpg') },
  { name: 'Browns', city: 'Cleveland', fullName: 'Cleveland Browns', stadium: 'Cleveland Browns Stadium', logo: require('../../assets/images/nfl/teams/browns.png'), stadiumImage: require('../../assets/images/nfl/stadiums/browns.jpeg') },
  { name: 'Buccaneers', city: 'Tampa Bay', fullName: 'Tampa Bay Buccaneers', stadium: 'Raymond James Stadium', logo: require('../../assets/images/nfl/teams/buccaneers.png'), stadiumImage: require('../../assets/images/nfl/stadiums/buccaneers.jpg') },
  { name: 'Cardinals', city: 'Arizona', fullName: 'Arizona Cardinals', stadium: 'State Farm Stadium', logo: require('../../assets/images/nfl/teams/cardinals.png'), stadiumImage: require('../../assets/images/nfl/stadiums/cardinals.jpg') },
  { name: 'Chargers', city: 'Los Angeles', fullName: 'Los Angeles Chargers', stadium: 'SoFi Stadium', logo: require('../../assets/images/nfl/teams/chargers.png'), stadiumImage: require('../../assets/images/nfl/stadiums/chargers.jpg') },
  { name: 'Chiefs', city: 'Kansas City', fullName: 'Kansas City Chiefs', stadium: 'GEHA Field at Arrowhead Stadium', logo: require('../../assets/images/nfl/teams/chiefs.png'), stadiumImage: require('../../assets/images/nfl/stadiums/chiefs.jpg') },
  { name: 'Colts', city: 'Indianapolis', fullName: 'Indianapolis Colts', stadium: 'Lucas Oil Stadium', logo: require('../../assets/images/nfl/teams/colts.png'), stadiumImage: require('../../assets/images/nfl/stadiums/colts.jpg') },
  { name: 'Commanders', city: 'Washington', fullName: 'Washington Commanders', stadium: 'Northwest Stadium', logo: require('../../assets/images/nfl/teams/commanders.png'), stadiumImage: require('../../assets/images/nfl/stadiums/commanders.jpg') },
  { name: 'Cowboys', city: 'Dallas', fullName: 'Dallas Cowboys', stadium: 'AT&T Stadium', logo: require('../../assets/images/nfl/teams/cowboys.png'), stadiumImage: require('../../assets/images/nfl/stadiums/cowboys.jpg') },
  { name: 'Dolphins', city: 'Miami', fullName: 'Miami Dolphins', stadium: 'Hard Rock Stadium', logo: require('../../assets/images/nfl/teams/dolphins.png'), stadiumImage: require('../../assets/images/nfl/stadiums/dolphins.jpg') },
  { name: 'Eagles', city: 'Philadelphia', fullName: 'Philadelphia Eagles', stadium: 'Lincoln Financial Field', logo: require('../../assets/images/nfl/teams/eagles.png'), stadiumImage: require('../../assets/images/nfl/stadiums/eagles.jpg') },
  { name: 'Falcons', city: 'Atlanta', fullName: 'Atlanta Falcons', stadium: 'Mercedes-Benz Stadium', logo: require('../../assets/images/nfl/teams/falcons.png'), stadiumImage: require('../../assets/images/nfl/stadiums/falcons.jpg') },
  { name: 'Giants', city: 'New York', fullName: 'New York Giants', stadium: 'MetLife Stadium', logo: require('../../assets/images/nfl/teams/giants.png'), stadiumImage: require('../../assets/images/nfl/stadiums/giants.jpg') },
  { name: 'Jaguars', city: 'Jacksonville', fullName: 'Jacksonville Jaguars', stadium: 'EverBank Stadium', logo: require('../../assets/images/nfl/teams/jaguars.png'), stadiumImage: require('../../assets/images/nfl/stadiums/jaguars.jpg') },
  { name: 'Jets', city: 'New York', fullName: 'New York Jets', stadium: 'MetLife Stadium', logo: require('../../assets/images/nfl/teams/jets.png'), stadiumImage: require('../../assets/images/nfl/stadiums/jets.jpg') },
  { name: 'Lions', city: 'Detroit', fullName: 'Detroit Lions', stadium: 'Ford Field', logo: require('../../assets/images/nfl/teams/lions.png'), stadiumImage: require('../../assets/images/nfl/stadiums/lions.jpg') },
  { name: 'Packers', city: 'Green Bay', fullName: 'Green Bay Packers', stadium: 'Lambeau Field', logo: require('../../assets/images/nfl/teams/packers.png'), stadiumImage: require('../../assets/images/nfl/stadiums/packers.jpg') },
  { name: 'Panthers', city: 'Carolina', fullName: 'Carolina Panthers', stadium: 'Bank of America Stadium', logo: require('../../assets/images/nfl/teams/panthers.png'), stadiumImage: require('../../assets/images/nfl/stadiums/panthers.jpg') },
  { name: 'Patriots', city: 'New England', fullName: 'New England Patriots', stadium: 'Gillette Stadium', logo: require('../../assets/images/nfl/teams/patriots.png'), stadiumImage: require('../../assets/images/nfl/stadiums/patriots.jpg') },
  { name: 'Raiders', city: 'Las Vegas', fullName: 'Las Vegas Raiders', stadium: 'Allegiant Stadium', logo: require('../../assets/images/nfl/teams/raiders.png'), stadiumImage: require('../../assets/images/nfl/stadiums/raiders.jpg') },
  { name: 'Rams', city: 'Los Angeles', fullName: 'Los Angeles Rams', stadium: 'SoFi Stadium', logo: require('../../assets/images/nfl/teams/rams.png'), stadiumImage: require('../../assets/images/nfl/stadiums/rams.jpg') },
  { name: 'Ravens', city: 'Baltimore', fullName: 'Baltimore Ravens', stadium: 'M&T Bank Stadium', logo: require('../../assets/images/nfl/teams/ravens.png'), stadiumImage: require('../../assets/images/nfl/stadiums/ravens.jpg') },
  { name: 'Saints', city: 'New Orleans', fullName: 'New Orleans Saints', stadium: 'Caesars Superdome', logo: require('../../assets/images/nfl/teams/saints.png'), stadiumImage: require('../../assets/images/nfl/stadiums/saints.jpg') },
  { name: 'Seahawks', city: 'Seattle', fullName: 'Seattle Seahawks', stadium: 'Lumen Field', logo: require('../../assets/images/nfl/teams/seahawks.png'), stadiumImage: require('../../assets/images/nfl/stadiums/seahawks.jpg') },
  { name: 'Steelers', city: 'Pittsburgh', fullName: 'Pittsburgh Steelers', stadium: 'Acrisure Stadium', logo: require('../../assets/images/nfl/teams/steelers.png'), stadiumImage: require('../../assets/images/nfl/stadiums/steelers.jpg') },
  { name: 'Texans', city: 'Houston', fullName: 'Houston Texans', stadium: 'NRG Stadium', logo: require('../../assets/images/nfl/teams/texans.png'), stadiumImage: require('../../assets/images/nfl/stadiums/texans.jpg') },
  { name: 'Titans', city: 'Tennessee', fullName: 'Tennessee Titans', stadium: 'Nissan Stadium', logo: require('../../assets/images/nfl/teams/titans.png'), stadiumImage: require('../../assets/images/nfl/stadiums/titans.jpg') },
  { name: 'Vikings', city: 'Minnesota', fullName: 'Minnesota Vikings', stadium: 'U.S. Bank Stadium', logo: require('../../assets/images/nfl/teams/vikings.png'), stadiumImage: require('../../assets/images/nfl/stadiums/vikings.jpg') },
];

export const getTeamByName = (name: string): NFLTeam | undefined => {
  return NFL_TEAMS.find(team => team.name.toLowerCase() === name.toLowerCase());
};
