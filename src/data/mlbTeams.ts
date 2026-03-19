export interface MLBTeam {
  name: string;
  city: string;
  fullName: string;
  stadium: string;
  primaryColor: string;
  latitude: number;
  longitude: number;
  logo: any;
  stadiumImage: any;
}

export const MLB_TEAMS: MLBTeam[] = [
  { name: 'Angels', city: 'Los Angeles', fullName: 'Los Angeles Angels', stadium: 'Angel Stadium', primaryColor: '#BA0021', latitude: 33.8003, longitude: -117.8827, logo: require('../../assets/images/mlb/teams/angels.png'), stadiumImage: require('../../assets/images/mlb/stadiums/angels.jpg') },
  { name: 'Astros', city: 'Houston', fullName: 'Houston Astros', stadium: 'Minute Maid Park', primaryColor: '#EB6E1F', latitude: 29.7573, longitude: -95.3555, logo: require('../../assets/images/mlb/teams/astros.png'), stadiumImage: require('../../assets/images/mlb/stadiums/astros.jpg') },
  { name: 'Athletics', city: 'Oakland', fullName: 'Oakland Athletics', stadium: 'Oakland Coliseum', primaryColor: '#003831', latitude: 37.7516, longitude: -122.2005, logo: require('../../assets/images/mlb/teams/athletics.png'), stadiumImage: require('../../assets/images/mlb/stadiums/athletics.jpg') },
  { name: 'Blue Jays', city: 'Toronto', fullName: 'Toronto Blue Jays', stadium: 'Rogers Centre', primaryColor: '#134A8E', latitude: 43.6414, longitude: -79.3894, logo: require('../../assets/images/mlb/teams/bluejays.png'), stadiumImage: require('../../assets/images/mlb/stadiums/bluejays.jpg') },
  { name: 'Braves', city: 'Atlanta', fullName: 'Atlanta Braves', stadium: 'Truist Park', primaryColor: '#CE1141', latitude: 33.8907, longitude: -84.4677, logo: require('../../assets/images/mlb/teams/braves.png'), stadiumImage: require('../../assets/images/mlb/stadiums/braves.jpg') },
  { name: 'Brewers', city: 'Milwaukee', fullName: 'Milwaukee Brewers', stadium: 'American Family Field', primaryColor: '#12284B', latitude: 43.0280, longitude: -87.9712, logo: require('../../assets/images/mlb/teams/brewers.png'), stadiumImage: require('../../assets/images/mlb/stadiums/brewers.jpg') },
  { name: 'Cardinals', city: 'St. Louis', fullName: 'St. Louis Cardinals', stadium: 'Busch Stadium', primaryColor: '#C41E3A', latitude: 38.6226, longitude: -90.1928, logo: require('../../assets/images/mlb/teams/cardinals.png'), stadiumImage: require('../../assets/images/mlb/stadiums/cardinals.jpg') },
  { name: 'Cubs', city: 'Chicago', fullName: 'Chicago Cubs', stadium: 'Wrigley Field', primaryColor: '#0E3386', latitude: 41.9484, longitude: -87.6553, logo: require('../../assets/images/mlb/teams/cubs.png'), stadiumImage: require('../../assets/images/mlb/stadiums/cubs.jpg') },
  { name: 'Diamondbacks', city: 'Arizona', fullName: 'Arizona Diamondbacks', stadium: 'Chase Field', primaryColor: '#A71930', latitude: 33.4455, longitude: -112.0667, logo: require('../../assets/images/mlb/teams/diamondbacks.png'), stadiumImage: require('../../assets/images/mlb/stadiums/diamondbacks.jpg') },
  { name: 'Dodgers', city: 'Los Angeles', fullName: 'Los Angeles Dodgers', stadium: 'Dodger Stadium', primaryColor: '#005A9C', latitude: 34.0739, longitude: -118.2400, logo: require('../../assets/images/mlb/teams/dodgers.png'), stadiumImage: require('../../assets/images/mlb/stadiums/dodgers.jpg') },
  { name: 'Giants', city: 'San Francisco', fullName: 'San Francisco Giants', stadium: 'Oracle Park', primaryColor: '#FD5A1E', latitude: 37.7786, longitude: -122.3893, logo: require('../../assets/images/mlb/teams/giants.png'), stadiumImage: require('../../assets/images/mlb/stadiums/giants.jpg') },
  { name: 'Guardians', city: 'Cleveland', fullName: 'Cleveland Guardians', stadium: 'Progressive Field', primaryColor: '#00385D', latitude: 41.4962, longitude: -81.6852, logo: require('../../assets/images/mlb/teams/guardians.png'), stadiumImage: require('../../assets/images/mlb/stadiums/guardians.jpg') },
  { name: 'Mariners', city: 'Seattle', fullName: 'Seattle Mariners', stadium: 'T-Mobile Park', primaryColor: '#0C2C56', latitude: 47.5914, longitude: -122.3325, logo: require('../../assets/images/mlb/teams/mariners.png'), stadiumImage: require('../../assets/images/mlb/stadiums/mariners.jpg') },
  { name: 'Marlins', city: 'Miami', fullName: 'Miami Marlins', stadium: 'LoanDepot Park', primaryColor: '#00A3E0', latitude: 25.7781, longitude: -80.2196, logo: require('../../assets/images/mlb/teams/marlins.png'), stadiumImage: require('../../assets/images/mlb/stadiums/marlins.jpg') },
  { name: 'Mets', city: 'New York', fullName: 'New York Mets', stadium: 'Citi Field', primaryColor: '#002D72', latitude: 40.7571, longitude: -73.8458, logo: require('../../assets/images/mlb/teams/mets.png'), stadiumImage: require('../../assets/images/mlb/stadiums/mets.jpg') },
  { name: 'Nationals', city: 'Washington', fullName: 'Washington Nationals', stadium: 'Nationals Park', primaryColor: '#AB0003', latitude: 38.8730, longitude: -77.0074, logo: require('../../assets/images/mlb/teams/nationals.png'), stadiumImage: require('../../assets/images/mlb/stadiums/nationals.jpg') },
  { name: 'Orioles', city: 'Baltimore', fullName: 'Baltimore Orioles', stadium: 'Camden Yards', primaryColor: '#DF4601', latitude: 39.2838, longitude: -76.6217, logo: require('../../assets/images/mlb/teams/orioles.png'), stadiumImage: require('../../assets/images/mlb/stadiums/orioles.jpg') },
  { name: 'Padres', city: 'San Diego', fullName: 'San Diego Padres', stadium: 'Petco Park', primaryColor: '#2F241D', latitude: 32.7076, longitude: -117.1570, logo: require('../../assets/images/mlb/teams/padres.png'), stadiumImage: require('../../assets/images/mlb/stadiums/padres.jpg') },
  { name: 'Phillies', city: 'Philadelphia', fullName: 'Philadelphia Phillies', stadium: 'Citizens Bank Park', primaryColor: '#E81828', latitude: 39.9061, longitude: -75.1665, logo: require('../../assets/images/mlb/teams/phillies.png'), stadiumImage: require('../../assets/images/mlb/stadiums/phillies.jpg') },
  { name: 'Pirates', city: 'Pittsburgh', fullName: 'Pittsburgh Pirates', stadium: 'PNC Park', primaryColor: '#27251F', latitude: 40.4469, longitude: -80.0057, logo: require('../../assets/images/mlb/teams/pirates.png'), stadiumImage: require('../../assets/images/mlb/stadiums/pirates.jpg') },
  { name: 'Rangers', city: 'Texas', fullName: 'Texas Rangers', stadium: 'Globe Life Field', primaryColor: '#003278', latitude: 32.7512, longitude: -97.0832, logo: require('../../assets/images/mlb/teams/rangers.png'), stadiumImage: require('../../assets/images/mlb/stadiums/rangers.jpg') },
  { name: 'Rays', city: 'Tampa Bay', fullName: 'Tampa Bay Rays', stadium: 'Tropicana Field', primaryColor: '#092C5C', latitude: 27.7682, longitude: -82.6534, logo: require('../../assets/images/mlb/teams/rays.png'), stadiumImage: require('../../assets/images/mlb/stadiums/rays.jpg') },
  { name: 'Red Sox', city: 'Boston', fullName: 'Boston Red Sox', stadium: 'Fenway Park', primaryColor: '#BD3039', latitude: 42.3467, longitude: -71.0972, logo: require('../../assets/images/mlb/teams/redsox.png'), stadiumImage: require('../../assets/images/mlb/stadiums/redsox.jpg') },
  { name: 'Reds', city: 'Cincinnati', fullName: 'Cincinnati Reds', stadium: 'Great American Ball Park', primaryColor: '#C6011F', latitude: 39.0979, longitude: -84.5082, logo: require('../../assets/images/mlb/teams/reds.png'), stadiumImage: require('../../assets/images/mlb/stadiums/reds.jpg') },
  { name: 'Rockies', city: 'Colorado', fullName: 'Colorado Rockies', stadium: 'Coors Field', primaryColor: '#33006F', latitude: 39.7559, longitude: -104.9942, logo: require('../../assets/images/mlb/teams/rockies.png'), stadiumImage: require('../../assets/images/mlb/stadiums/rockies.jpg') },
  { name: 'Royals', city: 'Kansas City', fullName: 'Kansas City Royals', stadium: 'Kauffman Stadium', primaryColor: '#004687', latitude: 39.0517, longitude: -94.4803, logo: require('../../assets/images/mlb/teams/royals.png'), stadiumImage: require('../../assets/images/mlb/stadiums/royals.jpg') },
  { name: 'Tigers', city: 'Detroit', fullName: 'Detroit Tigers', stadium: 'Comerica Park', primaryColor: '#0C2340', latitude: 42.3390, longitude: -83.0485, logo: require('../../assets/images/mlb/teams/tigers.png'), stadiumImage: require('../../assets/images/mlb/stadiums/tigers.jpg') },
  { name: 'Twins', city: 'Minnesota', fullName: 'Minnesota Twins', stadium: 'Target Field', primaryColor: '#002B5C', latitude: 44.9817, longitude: -93.2776, logo: require('../../assets/images/mlb/teams/twins.png'), stadiumImage: require('../../assets/images/mlb/stadiums/twins.jpg') },
  { name: 'White Sox', city: 'Chicago', fullName: 'Chicago White Sox', stadium: 'Guaranteed Rate Field', primaryColor: '#27251F', latitude: 41.8299, longitude: -87.6338, logo: require('../../assets/images/mlb/teams/whitesox.png'), stadiumImage: require('../../assets/images/mlb/stadiums/whitesox.jpg') },
  { name: 'Yankees', city: 'New York', fullName: 'New York Yankees', stadium: 'Yankee Stadium', primaryColor: '#003087', latitude: 40.8296, longitude: -73.9262, logo: require('../../assets/images/mlb/teams/yankees.png'), stadiumImage: require('../../assets/images/mlb/stadiums/yankees.jpg') },
];

export const getMLBTeamByName = (name: string): MLBTeam | undefined => {
  return MLB_TEAMS.find(team => team.name.toLowerCase() === name.toLowerCase());
};
