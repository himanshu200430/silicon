const fs = require('fs');
const { decode } = require('@msgpack/msgpack');

const buf = fs.readFileSync('public/ar-targets/rare.mind');
const data = decode(buf);

console.log('Total items in rare.mind dataList:', data.dataList.length);
data.dataList.forEach((item, idx) => {
  console.log(`Index ${idx}:`, {
    width: item.targetImage?.width,
    height: item.targetImage?.height,
    hasTrackingData: !!item.trackingData,
    hasMatchingData: !!item.matchingData
  });
});
