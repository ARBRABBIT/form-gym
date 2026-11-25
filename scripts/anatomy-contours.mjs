/** Surface contours traced against the supplied model in orthographic front/back
 * views (780 × 1296; origin 390,648; 600 px per normalized model unit).
 * These are bilateral surface annotations, not artist-authored muscle meshes.
 * Leave fascia, groin, kneecaps, tendons, hands, neck and feet unassigned.
 */
const contours = {
  front: [
    ['chest', [[397,280],[424,279],[453,275],[476,277],[493,297],[511,316],[534,333],[550,344],[538,359],[525,374],[509,388],[486,397],[463,400],[440,395],[416,385],[398,374]]],
    ['front-shoulders', [[464,260],[492,260],[520,270],[544,290],[564,322],[578,350],[583,369],[562,350],[544,343],[523,330],[503,309],[480,287],[464,278]]],
    ['biceps', [[554,350],[571,348],[591,362],[608,388],[623,419],[636,446],[629,465],[615,475],[597,463],[580,444],[565,418],[550,388],[546,369]]],
    ['forearms', [[632,464],[642,479],[660,505],[676,540],[690,578],[701,610],[696,618],[687,608],[674,591],[655,568],[638,546],[624,518],[617,494],[620,478]]],
    ['abdominals', [[395,402],[410,401],[430,407],[443,421],[439,433],[420,437],[396,434]]],
    ['abdominals', [[395,443],[418,442],[438,448],[439,462],[432,473],[410,476],[395,473]]],
    ['abdominals', [[395,484],[417,482],[435,489],[437,507],[432,525],[415,530],[395,526]]],
    ['abdominals', [[395,544],[416,541],[436,548],[434,574],[424,603],[410,630],[396,639]]],
    ['obliques', [[449,421],[472,416],[497,398],[494,433],[484,464],[479,501],[480,536],[471,553],[452,563],[451,537],[451,505],[452,474]]],
    // Tapered quadriceps envelope follows the hip origin, outer vastus and
    // medial teardrop. It never uses a horizontal thigh-height cutoff.
    ['quads', [[477,566],[483,586],[486,625],[497,670],[509,719],[518,765],[520,810],[514,849],[500,883],[480,909],[459,922],[449,911],[439,890],[431,863],[425,835],[424,809],[430,784],[436,752],[440,714],[440,679],[448,644],[461,605]]],
    ['adductors', [[439,632],[432,664],[427,695],[419,724],[416,754],[420,785],[422,812],[414,787],[408,754],[403,721],[400,688],[405,674],[417,656]]],
    ['tibialis', [[487,958],[507,980],[528,1012],[536,1049],[536,1076],[527,1110],[519,1150],[518,1178],[510,1187],[503,1177],[502,1134],[498,1097],[487,1062],[481,1025],[479,989]]],
  ],
  back: [
    ['traps', [[395,211],[417,222],[445,238],[471,253],[456,269],[437,290],[420,312],[397,334]]],
    ['traps-middle', [[397,340],[419,318],[444,297],[468,283],[481,297],[467,320],[445,345],[422,370],[398,419]]],
    ['rear-shoulders', [[468,260],[495,260],[521,267],[543,281],[561,306],[579,340],[577,354],[554,340],[530,328],[508,306],[485,286],[467,276]]],
    ['triceps', [[527,350],[548,335],[568,344],[587,363],[604,394],[620,429],[630,451],[616,460],[596,447],[577,426],[558,401],[542,378]]],
    ['forearms', [[629,465],[642,479],[660,505],[676,540],[690,578],[701,610],[696,618],[683,605],[668,582],[649,562],[633,538],[620,513],[615,491],[619,476]]],
    ['lats', [[453,374],[477,371],[504,358],[527,370],[518,412],[507,447],[490,470],[468,483],[443,466],[409,432]]],
    ['lowerback', [[399,437],[419,454],[445,477],[469,485],[465,513],[447,553],[420,579],[397,592]]],
    ['glutes', [[398,601],[417,577],[447,555],[466,550],[481,558],[491,591],[499,630],[508,670],[509,696],[491,706],[469,709],[443,704],[420,692],[398,676]]],
    ['hamstrings', [[403,687],[426,702],[453,714],[482,716],[506,705],[518,730],[521,764],[517,808],[509,848],[497,884],[487,921],[481,938],[470,928],[455,904],[440,868],[430,829],[416,777],[408,733]]],
    ['calves', [[479,948],[497,965],[520,987],[533,1023],[535,1049],[525,1072],[512,1083],[497,1075],[488,1059],[482,1073],[469,1077],[459,1065],[457,1038],[461,1005],[468,979]]],
  ],
};

function smooth(points) {
  const result = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i + points.length - 1) % points.length], p1 = points[i];
    const p2 = points[(i + 1) % points.length], p3 = points[(i + 2) % points.length];
    for (let step = 0; step < 6; step++) {
      const t = step / 6;
      result.push([0, 1].map(axis => .5 * (2 * p1[axis] + (-p0[axis] + p2[axis]) * t + (2*p0[axis] - 5*p1[axis] + 4*p2[axis] - p3[axis]) * t*t + (-p0[axis] + 3*p1[axis] - 3*p2[axis] + p3[axis]) * t*t*t)));
    }
  }
  return result;
}
function contains(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const atlas = Object.fromEntries(Object.entries(contours).map(([view, groups]) => [view, groups.map(([muscle, polygon]) => {
  const points = smooth(polygon);
  return { muscle, points, minX: Math.min(...points.map(p=>p[0])), maxX: Math.max(...points.map(p=>p[0])), minY: Math.min(...points.map(p=>p[1])), maxY: Math.max(...points.map(p=>p[1])) };
})]));

export function regionAt(x, y, z, depthCenter = 0) {
  const px = 390 + Math.abs(x) * 600, py = 648 - y * 600;
  const view = z >= depthCenter ? 'front' : 'back';
  for (const region of atlas[view]) {
    if (px < region.minX || px > region.maxX || py < region.minY || py > region.maxY) continue;
    if (contains(region.points, px, py)) return region.muscle;
  }
  return 'neutral';
}

// Use local limb depth rather than a world-space z=0 plane. The arms and legs
// sit behind/in front of the torso; a global split mislabels their front faces.
export function sectionKey(x, y) {
  const side = Math.abs(x);
  const part = y < .04 ? (side > .35 ? 'arm' : 'leg') : side > .22 + Math.max(0, .5-y)*.3 ? 'arm' : 'torso';
  return `${part}:${Math.round(y * 80)}`;
}
