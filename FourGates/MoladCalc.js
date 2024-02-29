
// shift in the molad for: [initial, 19 years, peshutah, m'uberes]
moladshifts = [[2,5,204],[2,16,595],[4,8,876],[5,21,589]];
guachadazat = [3,6,8,11,14,17,19];
// this gives the year type for each year in the 19-year cycle.]
// type 1 = (מפ"פ), type 2 = (מפ"מ), type 3 = (פפ"מ), type 4 = (פמ"פ)
// need to subtract 1 from the year, so yrTyp[0]=1, yrTyp[1]=3,...
// the first one (year 1) is type 1: (מפ"פ). The second is type 3 (פפ"מ), etc.
yrTypArray = [1,3,4,1,3,4,2,4,1,3,4,1,3,4,1,3,4,2,4];

function calcYear(year) { // load the year into multipliers
	let cycles = Math.floor(year/19); // 19-year cycles
	let yrs = year%19; // leftover years
	yrs = (yrs) ? yrs : 19; // 1-19
	let isleap = guachadazat.includes(yrs); // is this year a leap year?
	let yrType = yrTypArray[yrs-1];
	// count up regular and leap years for the previous years in the cycle
	let regular=0,leap=0;
	for (let ii=1; ii<yrs; ii++) { // for years _prior_ to this one
		if (guachadazat.includes(ii)) {leap++}
		else {regular++};
	}
	// okay, we've counted cycles, regulars, leaps - add them all up to get the molad
	let molad = calcMolad(cycles,regular,leap);
	return { "yrTyp": yrType, "molad": molad };
}

function calcMolad(cycles,regular,leap){ // event handler for any one of the multipliers
	let mults=[1,cycles,regular,leap]; // also include 1 "initial shift"
	let out0 = multiplyMatrices(mults,moladshifts); // --> 1x3 triplet
	// now need to reduce by carrying
	let out1 = redTrpl(out0);
	return out1;
}

function multiplyMatrices(mults, moladshifts) { // returns triple: [day, hour, chalakim]
	var result = [0,0,0];
	for (var i = 0; i < mults.length; i++) { // for each multiplier
	    var mult = mults[i], shift = moladshifts[i];
		for (var j = 0; j < 3; j++) { // through the shift triple
			result[j] = result[j] + (mult*shift[j]);
		}
	}
	return result;
}

function redTrpl(out0){ // do carries for triple for the molad calculations
	// 7 days/week, 24 hours/day, 1080 chalakim/hours/day
	// we don't have to worry about the weeks.
	var xx = out0[2], yy = xx%1080, zz = Math.floor(xx/1080); // chalakim
	if (yy<0) {yy=yy+1080; zz=zz-1}; // carry up
	var out1=[]; out1[2] = yy;
	xx = out0[1] + zz, yy = xx%24, zz = Math.floor(xx/24); // hours
	if (yy<0) {yy=yy+24; zz=zz-1};
	out1[1] = yy;
	xx = out0[0] + zz, yy = (xx+6)%7 + 1, zz = Math.floor(xx/7); // days removing weeks - keep Shabbos=7
	if (yy<0) yy=yy+7;
	out1[0] = yy;
	return out1;
}

// some utilities for handling molad triples

function dec2Molad(moladDec) {
  let mm,m0,m1,m2;
  mm=moladDec,m0 = Math.floor(mm),mm=mm-m0;
  m1=Math.floor(mm*24),mm=mm-(m1/24);
  m2=Math.floor(mm*24*1080);
  return renormalizeMolad([m0,m1,m2]);
}

function renormalizeMolad(mm) { // 3 elt array d h ch
/* Works for negatives */
/* 1 day = 24 hr, 1 hr = 1080 chalakim
/* day:0-7, h:0-23, ch:0-1079.
/* Discard all weeks */
  var m0=mm[0],m1=mm[1],m2 = mm[2]; // d h ch
  var q2 = Math.floor(m2/1080),r2 = m2-(q2*1080),m1=m1+q2;
  var q1 = Math.floor(m1/24),r1 = m1-(q1*24),m0=m0+q1;
  var q0 = Math.floor(m0/7),r0 = m0-(q0*7); // discard weeks
  return [r0,r1,r2];
}

function moladAdder(m1,m2) { // adds two molad array, renormalizes
  var msum = [m1[0]+m2[0],m1[1]+m2[1],m1[2]+m2[2]];
  return renormalizeMolad(msum)
}
function moladSubtracter(m1,m2) { // subtracts two molad array, renormalizes
  var mdiff = [m1[0]-m2[0],m1[1]-m2[1],m1[2]-m2[2]];
  return renormalizeMolad(mdiff)
}

function moladDecimalSubtract(molad1,molad2) {
    // assume these are strings like "6d 15h 21ch"
    var ary1 = molad2array(molad1);
    var ary2 = molad2array(molad2);
    var mdec1 = molad2decimal(ary1);
    var mdec2 = molad2decimal(ary2);
    return mdec2-mdec1;
}
function molad2array(str) { // assume string like "6d 15h 21ch"
    let ary1 = str.match(/[0-9]+/g),ary2=[];
    for (let ii=0; ii<3; ii++) {
      ary2[ii] = parseInt(ary1[ii]);
    }
    ary2 = renormalizeMolad(ary2)
    return ary2;
}
function molad2decimal(ary) {
    return +ary[0] + (+ary[1]/24) + (+ary[2]/24/1080);
}
function molad2number(ary,h18f) { // input molad array, turn into canonical form dhhpppp
	// if h18f is set, make sure it's at least 0d 18h (one of the molad transitions)
    ary = renormalizeMolad(ary);
	let m0=ary[0],m1=ary[1],m2=ary[2];
	let str = m0+(String(m1).padStart(2,"0"))+(String(m2).padStart(4,"0")); // pad w 0s
	let num = parseInt(str);
	if (h18f & (num<180000)) { // convert 0d18h to 7d18h
	  num = num + 7000000; // 0d to 7d
	}
	return num;
}
