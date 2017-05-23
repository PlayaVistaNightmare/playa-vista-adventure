  import { MapView, Constants, Location, Permissions, SQLite } from 'expo';

  const loc = {};
  
  loc.degreesToRadians = degrees => degrees * (Math.PI / 180);

  loc.calculateDistanceInFeetBetweenCoordinates = (lat1, lon1, lat2, lon2) => {
    let earthRadiusFeet = 20903520;

    let dLat = loc.degreesToRadians(lat2 - lat1);
    let dLon = loc.degreesToRadians(lon2 - lon1);

    lat1 = loc.degreesToRadians(lat1);
    lat2 = loc.degreesToRadians(lat2);

    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let distance = earthRadiusFeet * c;
    return distance
  }

  export default loc;