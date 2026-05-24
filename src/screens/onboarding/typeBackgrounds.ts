import type { ImageSourcePropType } from 'react-native';

export type EventTypeKey = 'concert' | 'sports' | 'theater' | 'comedy' | 'landmark' | 'other';
export type SportTypeKey = 'nfl' | 'mlb' | 'nba' | 'soccer' | 'tennis' | 'other';

export function getOnboardingBgImage(
  eventType: EventTypeKey,
  sportType?: SportTypeKey | null,
  homeStadiumImage?: ImageSourcePropType | null,
): ImageSourcePropType {
  if (eventType === 'sports') {
    if (homeStadiumImage && (sportType === 'nfl' || sportType === 'mlb')) {
      return homeStadiumImage;
    }
    switch (sportType) {
      case 'nba': return require('../../../assets/images/basketball_bg.jpg');
      case 'soccer': return require('../../../assets/images/soccer_bg.jpg');
      case 'tennis': return require('../../../assets/images/tennis_bg.jpg');
      default: return require('../../../assets/images/other_sports_bg.jpg');
    }
  }
  switch (eventType) {
    case 'concert': return require('../../../assets/images/concert_bg.png');
    case 'theater': return require('../../../assets/images/theater_bg.jpg');
    case 'comedy': return require('../../../assets/images/comedy_bg.jpg');
    case 'landmark': return require('../../../assets/images/landmark_bg.jpg');
    case 'other': return require('../../../assets/images/other_bg.jpg');
  }
}
