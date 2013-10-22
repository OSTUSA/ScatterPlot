#!/bin/bash
DEST=./scripts/quadChart.js 
SRC=./src/*.js
rm $DEST

echo "Building..."
for f in $SRC
do
	echo $f
	less $f >> $DEST
done
echo "Complete!"
