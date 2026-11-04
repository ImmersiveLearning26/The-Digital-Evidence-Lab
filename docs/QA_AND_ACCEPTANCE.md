# QA and acceptance

## Automated checks

Run `npm test`. The included domain suite covers the canonical text, lossy replacement counts, image/audio sizes, RGB tolerance, weights, protected-source gate, assignment locks, immutable submission snapshot, stale versions, one-time capture, handover invalidation and full successful event sequence.

The browser smoke-test script is `tests/browser-smoke.mjs`. Install Playwright and its Chromium browser in your local development environment, start the server, then run the script. It exercises normal UI flow, a blocked unsafe connection, save/attach/review, final handover, resume and all 16 screen views. It is a scaffold test, not proof that final media or the user's GLBs work.

## Required manual verification

- At 1366 × 768 and 1920 × 1080, primary controls remain reachable and application content has sensible hierarchy.
- No app launches after task approval; the user initiates app/file opening.
- Windows/app state survives minimise, close/reopen, equipment view and reload.
- Amina notifications do not steal focus or obscure a file dialog. Unread messages survive dismissal.
- Pause during a review, call, A/B comparison and camera move. Resume preserves elapsed position. No duplicates.
- Try wrong encoding, wrong decoding, screenshot text, downscaled image, upscaled image, low sampling rate, coarse quantisation and MP3 master. Feedback must match saved output.
- Verify PPI-only changes leave pixels and size estimate unchanged.
- Verify actual RGB samples and plate detail on the final source image.
- Verify lossless export does not claim to reconstruct information absent from capture.
- Keep a retained extra audio output; total allocation includes it. Chat references do not duplicate bytes.
- Edit an approved output and save; handover becomes invalid until that new version is reviewed.
- Attempt a write to the original/source; it is prevented. No real source data is destroyed.
- Complete with keyboard, captions and text equivalents. Reduced-motion mode remains fully functional.
- Load the actual GLB. Check every name, pivot, clip, port and camera anchor. Missing media/model paths show useful fallback, not a blank loading screen.
- Complete the run with final video, audio and image assets. Check timing, subtitles, Kenyan voice and consistent Amina identity.

## Release exclusions

The original source has not specified all point-level scoring rules. Do not invent them silently. No production grade should be claimed until reviewed. The kit's illustrative waveform and file metadata do not prove real audio/image quality. No public deployment, real Google authentication, live forensic analysis or real evidence handling is included.
