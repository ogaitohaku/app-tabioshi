/** 2点間の直線距離(km)。[経度, 緯度] */
export function distanceKm([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lng2 - lng1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

/** Googleマップでその場所を開くURL(道順もそこから出せる) */
export const googleMapsPlaceUrl = ([lng, lat]: [number, number]) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export const kmLabel = (km: number) => (km < 1 ? `${Math.round(km * 1000)}m` : km < 10 ? `${km.toFixed(1)}km` : `${Math.round(km)}km`);
