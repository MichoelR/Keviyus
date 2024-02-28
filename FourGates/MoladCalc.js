
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

