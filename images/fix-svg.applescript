do shell script "
cd /Volumes/appleM3ext1/codingproject/images
for f in *.svg; do
sed -i '' 's/viewBox=\"0 0 120 40\"/viewBox=\"0 0 120 40\" width=\"120\" height=\"40\"/' \"$f\"
sed -i '' 's/fill=\"white\"/fill=\"none\"/' \"$f\"
done
"