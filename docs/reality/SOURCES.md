# Source registry

The executable registry is `src/situations/tonga.js`: each source has its publisher, HTTPS URL, publication date (date-only where the time is unavailable), retrieval date and rights statement. Evidence records add locators and original paraphrases. Source-level review is in [SOURCE-REVIEW.md](SOURCE-REVIEW.md).

| ID | Role | Reuse |
| --- | --- | --- |
| cloudflare-outage | Published network measurement summaries | Links and short original paraphrases; no graph scraping or fabricated raw samples |
| cloudflare-return | Network recovery summary and attributed operator announcement | Links and short original paraphrases |
| itu-response | Emergency communications report and attributed fault-distance caption | Links and short original paraphrases; third-party images excluded |
| nasa-airs | Main event timestamp and later atmospheric instrument acquisition | Links and short original paraphrases; media not bundled |
| diaz-seismic | Primary research quoting the seismic catalog event location | Approximate contextual marker, source retained |
| telegeography | Generalized current cable routes and endpoint context | CC BY-NC-SA 3.0, separate from MIT code; noncommercial; preserve attribution and ShareAlike |

All sources were reviewed on 24 September 2026. Stored retrieval timestamps use midnight as a date-only convention, not a claim about retrieval time of day. The TeleGeography route snapshot itself is dated 24 May 2026. No historical seabed survey, raw network sample series, exact cable fault coordinate, repair-vessel track, or satellite orbital ephemeris is included.

Unverified rights are not commercial clearance. See the bundled dataset's `README.md` and `source.json` in `src/data/local_data/telegeography_submarine_cables/` for its original metadata.
