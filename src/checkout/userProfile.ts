/**
 * Prototype TID / profile preferences for ship-to defaults.
 * In production this would sync with the user profile API.
 */

let defaultShipToId = 'ca-warehouse';

export const currentUser = {
  get defaultShipToId() {
    return defaultShipToId;
  },
};

export function setDefaultShipToId(id: string) {
  defaultShipToId = id;
}
