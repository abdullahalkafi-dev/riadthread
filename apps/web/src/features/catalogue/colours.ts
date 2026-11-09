/** Display colour for each colour family used by the "Colour" filter. */
export const FAMILY_HEX: Record<string, string> = {
  Green: '#0f4a36',
  Blue: '#1f3a8a',
  Neutral: '#d9cfbd',
  Black: '#26262a',
  Purple: '#4b1f4f',
  Pink: '#d8b4a6',
  Red: '#8a1c2b',
  Brown: '#6b4a32',
  Gold: '#cfae6a',
};

export const familyHex = (family: string) => FAMILY_HEX[family] ?? '#c4ad8a';
