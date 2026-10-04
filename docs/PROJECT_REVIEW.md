# Project review — 4 October 2026

The proposed documentation name is **Window Swap Desktop** (`window-swap-desktop`). The GitHub repository currently remains `mertfazla/windows-swap-unlocked`; the naming proposal and pending application identifiers are recorded in [publication notes](PUBLICATION_NOTES.md).

## What the project does

This is an Electron Windows desktop shell around a statically exported Next.js app. It plots window-view video records on a Leaflet world map, groups nearby markers, plays remote Vimeo videos, builds a route to the nearest unvisited video, offers loop/previous/next controls and an upcoming playlist, and stores visited IDs in localStorage. The discovery strip uses prerecorded videos, not live camera feeds.

The published catalog is empty: running the current source shows the map and interface without video markers or playable catalog entries. Local development remains useful for reviewing that code and desktop integration. Ambient viewing, virtual travel and geographic video discovery describe implemented capabilities that require a separately authorized catalog.

## Technologies

| Area | Implementation |
| --- | --- |
| Desktop | Electron, electron-serve, electron-builder |
| Interface | Next.js App Router, React, TypeScript, CSS |
| Map | Leaflet, markercluster; Esri World Imagery, OpenStreetMap fallback |
| Playback | Vimeo embeds and Vimeo Player API |
| Data | Static catalog JSON; localStorage visited IDs; in-memory playlist history |
| Tooling | npm, concurrently, wait-on, TypeScript compiler |

There is no custom API server, database, account system or authentication layer. Internet is required for external assets and playback.

## Privacy and publication scope

The public source contains an empty catalog and no contributor personal information or credentials. It does not automatically collect or refresh the WindowSwap catalog. Private data, backups and generated application packages are outside the publication scope.

Any content added to this client application must be authorized and suitable for public sharing. Bundling information in an application does not make it confidential. Do not include personal information, private locations, credentials or private video links.

A publication guard checks prohibited tracked paths, catalog fields and relevant committed history before builds. It is a safeguard, not a complete privacy or security audit, and cannot establish permission to use third-party content.

## Relationship and content permissions

This is an independently maintained prototype, not an official WindowSwap desktop application. There is no collaboration, endorsement or sponsorship by WindowSwap. No ownership of its service, contributors' videos or third-party data is claimed.

Legacy WindowSwap links and application labels remain in source. The proposed name removes "unlocked" but can still suggest an association; the affiliation statement is not trademark clearance. Any future content distribution would require a separate review of content permissions, provider terms, branding and applicable privacy obligations. No such distribution is planned under the current source-only scope.

## Repository status and copyright

The repository is shared for source-code review and portfolio purposes with an empty catalog. There are no official installers, executable downloads, GitHub Releases, donation links or paid offerings. Public source can be downloaded, forked and built by visitors; omitting Releases does not technically prevent that.

The README provides the maintainer's public contact address and links to [the copyright notice](../COPYRIGHT.md). No project-wide open-source or general reuse license has been granted. The notice covers only the maintainer's original material, preserves GitHub's viewing/forking rights and statutory exceptions, and does not supersede third-party licenses.

## Verification and limits

The earlier technical review included TypeScript and static-export build checks, publication checks and dependency advisory review. These checks are time-specific and do not establish comprehensive security or legal clearance. No packaged desktop playback test or new installer distribution was performed.

Remote scripts are still loaded at runtime, and there is no comprehensive automated UI test suite. Any future product distribution would need an authorized catalog, appropriate distribution permissions, final branding, third-party notices, provider usage review and a desktop playback/security test. The current scope remains a source-code showcase with an empty catalog.
