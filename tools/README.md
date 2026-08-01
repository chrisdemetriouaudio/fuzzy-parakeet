# tools

Build-time and maintenance helpers. Nothing here is served as part of the site.

## cv-source.html

The typeset source for `/enterprise/chris-demetriou-cv.pdf`. It pulls the site's
own tokens from `/assets/css/tokens.css`, so the CV and the website stay in the
same type and colour system.

To regenerate the PDF after editing it, serve the repository root and print the
page to A4 — for example with a headless browser:

    python3 -m http.server 8000
    # then print http://127.0.0.1:8000/tools/cv-source.html to
    # enterprise/chris-demetriou-cv.pdf at A4, backgrounds on, 14mm/15mm margins

## Icon helpers

`make-icons.sh`, `rebuild-icons.sh` and `fix-svg.applescript` are macOS helpers
for the media site's toolkit icons. They were previously kept in `images/`.
