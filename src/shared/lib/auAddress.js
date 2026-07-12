// Australian address conventions - per Australia Post Correct Addressing
// Standards (Appendix 1) and AS/NZS 4819:2011:
//   * components stored separately: unit, street (number + name + type kept
//     together, e.g. "14 Smith St"), suburb (never "city"), state code,
//     4-digit postcode
//   * unit joins the street line with a solidus: "2/14 Smith St"
//   * display last line: "Suburb STATE 9999"

export const AU_STATES = [
  { code: 'NSW', label: 'New South Wales' },
  { code: 'VIC', label: 'Victoria' },
  { code: 'QLD', label: 'Queensland' },
  { code: 'WA',  label: 'Western Australia' },
  { code: 'SA',  label: 'South Australia' },
  { code: 'TAS', label: 'Tasmania' },
  { code: 'ACT', label: 'Australian Capital Territory' },
  { code: 'NT',  label: 'Northern Territory' },
];

const STATE_NAME_TO_CODE = AU_STATES.reduce((m, s) => {
  m[s.label.toLowerCase()] = s.code;
  m[s.code.toLowerCase()] = s.code;
  return m;
}, {});

// "New South Wales" | "nsw" | "NSW" → "NSW"; unknown → ''
export function stateToCode(name) {
  if (!name) return '';
  return STATE_NAME_TO_CODE[String(name).trim().toLowerCase()] || '';
}

// Street-delivery + PO-box postcode ranges per state (Australia Post).
// Cross-border exceptions exist (e.g. Jervis Bay uses NSW postcodes), so this
// backs a SOFT warning only - never a hard block.
const POSTCODE_RANGES = {
  NSW: [[1000, 2599], [2619, 2899], [2921, 2999]],
  ACT: [[200, 299], [2600, 2618], [2900, 2920]],
  VIC: [[3000, 3999], [8000, 8999]],
  QLD: [[4000, 4999], [9000, 9999]],
  SA:  [[5000, 5999]],
  WA:  [[6000, 6999]],
  TAS: [[7000, 7999]],
  NT:  [[800, 999]],
};

export function isValidPostcode(postcode) {
  return /^\d{4}$/.test(String(postcode || '').trim());
}

// Returns a human warning string when the postcode looks wrong for the state,
// or null when it's fine / not checkable.
export function postcodeStateWarning(stateCode, postcode) {
  if (!stateCode || !isValidPostcode(postcode)) return null;
  const ranges = POSTCODE_RANGES[stateCode];
  if (!ranges) return null;
  const n = parseInt(postcode, 10);
  const ok = ranges.some(([lo, hi]) => n >= lo && n <= hi);
  return ok ? null : `Postcode ${postcode} is unusual for ${stateCode} - double-check it`;
}

// Parse a Nominatim `address` object into AU components.
// Street keeps number + name together, AU order: "14 Smith St".
export function parseNominatimAddress(addr = {}, displayName = '') {
  const street = [addr.house_number, addr.road].filter(Boolean).join(' ')
    || (displayName ? displayName.split(',')[0] : '');
  const suburb = addr.suburb || addr.city_district || addr.town || addr.village
    || addr.municipality || addr.city || '';
  return {
    street,
    suburb,
    state: stateToCode(addr.state) || stateToCode(addr['ISO3166-2-lvl4']?.split('-')[1]) || '',
    postcode: addr.postcode || '',
  };
}

// "2" + "14 Smith St" → "2/14 Smith St" (solidus is the AusPost-approved
// separator for unit/flat/apartment numbers)
export function composeStreetLine(unit, street) {
  const u = String(unit || '').trim();
  const s = String(street || '').trim();
  if (!s) return u;
  return u ? `${u}/${s}` : s;
}

// One-line display form: "2/14 Smith St, Bondi NSW 2026"
export function formatFullAddress({ unit, address, suburb, state, postcode } = {}) {
  const streetLine = composeStreetLine(unit, address);
  const lastLine = [suburb, state, postcode].filter(Boolean).join(' ');
  return [streetLine, lastLine].filter(Boolean).join(', ');
}
