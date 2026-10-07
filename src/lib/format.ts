export const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

/** 動画の秒数を 12:34 の形に */
export const timecode = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
