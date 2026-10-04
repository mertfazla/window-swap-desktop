# Publication settings for owner review

These are proposed settings and documentation decisions. Editing this file does not rename the GitHub repository, change its description, or publish the local changes.

## Proposed repository name and description

- Repository name: `window-swap-desktop`
- Documentation title: `Window Swap Desktop`
- Description: `Unofficial Electron desktop prototype for window-view videos. Source only; empty catalog; no installers or releases.`

The current GitHub repository is [mertfazla/windows-swap-unlocked](https://github.com/mertfazla/windows-swap-unlocked). The proposed name removes the suggestion of unlocking restricted access, but still resembles WindowSwap's name. It should not be presented as an official app or as a legally cleared brand. A distinct name such as `ambient-view-desktop` would communicate greater independence; availability and trademark clearance have not been checked.

## Current publication scope

Only the cleaned source is shared. The catalog remains empty. There are no official executable downloads, installers, GitHub Releases, donation links or paid offerings. Public source can still be downloaded, forked and built by visitors. Omitting Releases is not a technical restriction on those actions.

The README begins with the empty-catalog warning. Local development instructions remain because the map, interface and desktop integration can be reviewed without private content. They do not offer a way to recover the historical dataset. Installer-building instructions have been removed from the README.

The relationship statement explains the absence of collaboration or endorsement and of a WindowSwap catalog in the published source. It does not grant permission to reuse third-party content.

## Contact and copyright

The contact address is the maintainer's currently public GitHub profile email: `mertfazlacontact@gmail.com`. It is included for project questions, permissions, and rights/privacy reports. There are no donation links.

No permissive or copyleft open-source license has been added. README and COPYRIGHT.md reserve rights in the maintainer's original material while preserving GitHub's viewing/forking permissions, statutory exceptions and third-party licenses. This is a source-available showcase. The notice does not guarantee that others will not copy it, and does not claim rights in other creators' work.

## Remaining naming work if the proposal is adopted

The application itself still has legacy names and links in `package.json`, `package-lock.json`, `app/layout.tsx` and `app/components/Map.tsx`. This documentation-only change does not rename those application identifiers or remove legacy WindowSwap links.

After the owner reviews the proposal, a separate naming change can align the GitHub repository, local remote URL, package identity, installer product name and interface labels. The installer identity needs deliberate handling if existing local installations must retain upgrade compatibility. No installer or Release is proposed.
