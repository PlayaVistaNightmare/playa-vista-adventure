  import { MapView, Constants, Location, Permissions, SQLite } from 'expo';

  const loc = {};
  
  loc.degreesToRadians = degrees => degrees * (Math.PI / 180);

  loc.calculateDistanceInFeetBetweenCoordinates = (lat1, lon1, lat2, lon2) => {
    let earthRadiusFeet = 20903520;
    // let earthRadiusMeters = 6371e3;
    let dLat = loc.degreesToRadians(lat2 - lat1);
    let dLon = loc.degreesToRadians(lon2 - lon1);

    rad1 = loc.degreesToRadians(lat1);
    rad2 = loc.degreesToRadians(lat2);

    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad1) * Math.cos(rad2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = earthRadiusFeet * c;
    // let distance = earthRadiusMeters * c;
    return distance
  }

  export default loc;