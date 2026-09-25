# Tonga evidence audit — 24 September 2026

This audit records primary-source checks for the cloud implementation. It is not a claim that its renderer or dataset has passed review.

| Source | Publication | Verified use | Limits |
| --- | --- | --- | --- |
| [NASA/JPL AIRS](https://airs.jpl.nasa.gov/news/184/airs-observations-of-the-tonga-undersea-volcano-eruptions-in-january-2022/) | 28 February 2022 | Main explosion 15 January 04:14 UTC; AIRS acquisition 10:59–16:11 UTC that day; earlier event 13 January 15:20 UTC. | Do not timestamp AIRS atmospheric observations at the explosion instant. Acquisition is hours later. |
| [Cloudflare initial outage](https://blog.cloudflare.com/tonga-internet-outage/) | 19 January 2022 | Degradation around 03:00 UTC; Digicel/Kalianet traffic near zero by 05:30; routing-update spike 05:35. | Published measurement summaries from Cloudflare's vantage, not a national census or downloadable raw samples. |
| [ITU response](https://www.itu.int/hub/2022/02/restoring-connectivity-tonga-internet/) | 10 February 2022 | Reported cable damage and satellite assistance; caption gives international fault about 37 km from Nuku'alofa and domestic about 47 km. | Caption reproduces a third-party diagram. Neither bearing nor distance convention is established. Exact break coordinates and a measured uncertainty interval are unavailable. |
| [Cloudflare recovery](https://blog.cloudflare.com/internet-is-back-in-tonga-after-38-days-of-outage/) | 22 February 2022 | Traffic rises toward earlier levels shortly after midnight UTC; operator announcement at 02:13 UTC names Tongatapu and Eua; repair account describes 92 km replacement. | Recovery onset is approximate. Domestic cable repairs remained incomplete. Ship movement is not provided. |
| [Diaz, Communications Earth & Environment](https://www.nature.com/articles/s43247-022-00616-1) | 16 November 2022 | Results section quotes USGS catalog event at 20.546°S, 175.390°W, 04:14:45 UTC. | Catalog location is an event estimate, not a surveyed vent boundary. Paper also describes earlier activity; main explosion is not eruption onset. |

## Required interpretation

- The 03:00 network degradation precedes the 04:14 main explosion. Preserve that discrepancy visibly. These summaries alone do not identify the initiating cause of the earliest decline.
- Retrospective event time and source publication time are different. A timeline can reconstruct January events using February reports, but must not suggest observers already possessed those reports in January.
- Showing a 37 km circle is an illustrative distance comparison only: the source does not establish radial distance rather than along-cable distance. Never call it a surveyed fault boundary, precise locus, confidence region, or point of failure. Do not place a point where a circle crosses the current cable.
- Satellite fallback is established by ITU's 10 February publication. Exact activation time is unavailable. The [Cloudflare Q1 summary](https://blog.cloudflare.com/q1-2022-internet-disruption-summary/) describes minimal satellite traffic after the eruption but does not substantiate a 20 January activation timestamp.
- February recovery describes the international connection and named islands, not full domestic restoration. Do not turn both cable systems green to imply all service recovered.
- Geography for traffic observations is a display anchor to Tonga, not a measured local coverage polygon. Do not pin ASN or cloud measurements to an invented facility.
- No fabricated numeric traffic series, smooth chart interpolation, exact fault positions, vessel trajectories, satellite orbital positions, or independent-source counts for repeated Cloudflare accounts.

## Rights and geographic reference

`public/reality/tonga-cables.geojson` derives from the bundled TeleGeography snapshot dated 24 May 2026. Label it **CURRENT_REFERENCE** throughout the 2022 reconstruction. The dataset's CC BY-NC-SA 3.0 terms remain separate from the MIT application code. Retain attribution **© TeleGeography — submarinecablemap.com** and the source adapter so a differently licensed dataset can replace it.

This review uses short original factual paraphrases and links. It does not clear embedded third-party imagery for reuse. ITU's header credits Maxar/Getty; its fault diagram has a separate author. Do not copy either into the application on the assumption that ITU's hosting licenses them. NASA imagery, if subsequently included, needs its specific credit and applicable media policy verified independently.
