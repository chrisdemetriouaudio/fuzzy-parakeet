#!/bin/bash

make_icon () {
cat > "$1" <<ICON
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40">
<rect width="120" height="40" fill="white"/>
<text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="14" fill="black">$2</text>
</svg>
ICON
}

make_icon protools.svg "Pro Tools"
make_icon logic-pro.svg "Logic Pro"
make_icon adobe-audition.svg "Audition"
make_icon izotope-rx.svg "RX"
make_icon final-cut-pro.svg "Final Cut Pro"
make_icon sound-libraries.svg "Sound Libraries"
make_icon sound-design.svg "Sound Design"

echo "SVG icons rebuilt."
