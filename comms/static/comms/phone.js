import { parsePhoneNumber } from 'https://cdn.skypack.dev/libphonenumber-js';

export function isValidPhoneNumber(fullPhoneNumber) {
  // Allow optional leading +, followed by digits only
  if (!/^\+?\d+$/.test(fullPhoneNumber)) {
    return false;
  }

  try {
    const phone = parsePhoneNumber(fullPhoneNumber);
    return phone?.isValid() ?? false;
  } catch (e) {
    return false;
  }
}
