// Ad provider configuration.
//
// To enable Google AdSense:
//  1. Sign up at https://adsense.google.com and get your publisher ID
//     (looks like "ca-pub-1234567890123456").
//  2. Paste it into ADSENSE_CLIENT below.
//  3. Create ad units in the AdSense dashboard and pass their slot IDs to
//     the <AdSlot slot="..." /> components where ads should appear.
//  4. Rebuild (`npm run build`) and push.
//
// While ADSENSE_CLIENT is empty, AdSlot renders a dashed placeholder box in
// dev mode and nothing at all in production builds.
export const ADSENSE_CLIENT = "ca-pub-7061053947327423";

export const ADS_ENABLED = ADSENSE_CLIENT.length > 0;
