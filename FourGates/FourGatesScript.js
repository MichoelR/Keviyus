/* scripts for FourGates app */

const yearShifts=[[4,8,876],[5,21,589]]; // regular year ד"ח תתע"ו, leap year הכ"א קתפ"ט

/* each of the yearType columns are for last year, this year, next year. 0=regular, 1=leap year */
const yearTypes = [[1,0,0],[1,0,1],[0,0,1],[0,1,0]];

/* initially add a bunch of list items to each ruler */
$("ol").each( function (index) { // append a bunch of list elements
  var limax = (index==2) ? 187 : 169; // this is "this year's"
  for (let ii=0; ii<limax; ii++) {
    var txt = ((index==2)&&(ii<18)) ?
      "<li class='topOfRule'></li>" :
      ( (ii % 24)==18 ) ?
        "<li class='li18h'></li>" :
        "<li></li>";
    $(this).append(txt);
  }
});

// make Year Type clickable, adjusts other molad times to match
$(".yearType").on("click", function() {
  let divtop = $(this).offset().top, divleft=$(this).offset().left;
  yrTyp = $(this).attr("yrTyp"); // global variable
  mvVArrow(yrTyp,divtop,divleft);
  let molad2 = molads[1]; // didn't change
  mvOtherPtrs(molad2); // move the other three pointers, which may change
  setYrLen(yrTyp); // reset year length headers above the rulers
  chkCalendar(molad2); // reset chosen calendar
  clearRHbar(); // if they had been set
});

  // make molad times on the chart clickable - adjust molads and yrTyp, move pointers
$(".moladDiv").on("click", function() {
  let pickYrTyp = $(this).attr("pickYrTyp"); // some of them need certain yrTyps to work
  let moladTxt = $(this).text();
  let title = $(this).attr("title");
  let moladn = $(this).attr("moladn");
  $(".yearType").eq(pickYrTyp-1).trigger("click"); // choose that column
  // okay, let's set the molad
  let molad2 = molad2array(moladTxt);
  mvPtr(molad2,2,0,1); // adjust pointer for second ruler
  mvOtherPtrs(molad2,1);
  mvHArr(); // move horizontal arrow to match
  setCalendar(moladn);
  showStory(moladTxt,title);
  setRH(moladn); // set the vertical day-of-RH markers, show their changes
});

$("#showCol").on("mouseover",function(){
	flashclass("moladCol",1);
});

$(".moladCI").on("input",function(){ // update all pointers and counters on input
  let molad2 = [], limits = [7,24,1080];
  let fixf = false;
  for (let jj=0; jj<3 ; jj++){
    let mval = parseFloat($("#molad_2_"+jj).val());
    if (mval >= limits[jj]) fixf = true; // will need to renormalize
    if (mval < 0) fixf = true;
    molad2[jj]=mval;
  }
  if (fixf) molad2 = renormalizeMolad(molad2); // something was out of limit
  mvPtr(molad2,2,!fixf); // adjust pointer for second ruler, and counter if needed
  mvOtherPtrs(molad2);
  mvHArr(); // move horizontal arrow to match
  chkCalendar(molad2); // reset calendar chosen
  clearRHbar(); // if they had been set

});

function setYrLen(yrTyp) { // set year length headers above rulers
  const yearType = yearTypes[yrTyp-1]; // regular or leap year, 0 or 1
  for (let ii=0; ii<3; ii++) {
	let typeNm = (yearType[ii]) ? "←מעוברת→" : "←פשוטה→";
    $("#yrLen_"+(ii+1)).text(typeNm);
  }
}

function mvOtherPtrs(molad2,flashf) { // only pointer 2 is draggable. Move the rest.
//  Same with molad counter at bottom: only #2 is editable, move the rest too.
  //let moladDec = getMolad(newtop,2);
  //let molad = dec2Molad(moladDec);
  // if flashf, check for 18h and flash it
  for (let ii of [1,3,4]) { // the other ones
    mvPtr(molad2,ii,0,flashf);
  } 
}

function chkCalendar(molad2) { // find and then mark correct calendar, based on molad
  let moladnum = molad2number(molad2,1); // convert to canonical form
  // yrTyp is global for the current column.
  let moladn = findMoladn(moladnum,yrTyp);
  setCalendar(moladn); // mark correct calendar
}
function findMoladn(moladnum,yearType) {
  //  the molad transition that is just before (or equal to) the current molad
  // Not every transition is relevant for a particular year type.
  for (let ii=13; ii>=0; ii--) { // we'll pick the first one that matches
    // find in hash table
    if (moladI[ii]>moladnum) continue; // not there yet
	let moladn = ii;
	let cols = tblMoladList[moladn].cols; // list of columns for which this molad is a transition
	if (cols.includes(yearType-1)) { // found!
      return moladn;
	}
  }
  // okay, not found: moladnum is less than all of them
}
function setCalendar(moladn) { // mark correct calendar for the molad button chosen
  // first find corresponding calendar, which also depends on the global var yrTyp.
  let caln = tblMoladList[moladn].calns[yrTyp-1];
  if (caln !== calendarn) { // otherwise, nothing to do. calendarn was previously set
    $("[caln="+calendarn+"]").removeClass("showBrd"); // previous calendar
    $("[caln="+caln+"]").addClass("showBrd"); // show border on that calendar
    calendarn = caln; // set global value
  }
}

function mvPtr(molad2,ii,noctrf,flashf) { // other rulers 1 3 or 4, move here to match appropriately
  // yrTyp is global, current year type 1-4
  // molad2 is input, the molad from ruler2. We need to translate it for the others
  // ruler 1 is separated from the pointer (ruler 2) by last year, back.
  // ruler 3 is separated from the pointer by this year, forward.
  // ruler 4 is separated from the pointer by this year and next year, forward.
  // if noctrf is set, don't adjust the molad counter
  //  (this is when it's initiated by the counter!)
  // ruler 2 is special because it starts and ends at 0d 18h.
  // If flashf, check for 18h and flash li18h element.
  const index = [0,1,1,1][ii-1]; // if ii=4, start with 3's year. Then we'll add 4's.
  const otheryrTyp = yearTypes[yrTyp-1][index]; // regular or leap year, 0 or 1
  const otheryrTyp2 = (ii==4) ? yearTypes[yrTyp-1][2] : 0; // ruler 4 is two years removed
  const otheryrShift = yearShifts[otheryrTyp];
  const otheryrShift2 = (ii==4) ? yearShifts[otheryrTyp2] : 0;
  let otherMolad = molad2; // in case ii=2
  if (ii==1) otherMolad = moladSubtracter(molad2,otheryrShift);
  if (ii>2) otherMolad = moladAdder(molad2,otheryrShift);
  if (ii==4) otherMolad = moladAdder(otherMolad,otheryrShift2); // two separate years
  if (flashf) {check18(otherMolad,ii)}; // animation
  setMolad(otherMolad,ii,noctrf); // change counter and global molads entry
  setPlace(molad2decimal(otherMolad),ii); // move pointer to correct location
}

function setMolad(molad,ii,noctrf) { // set global molad var and visible molad counter
  // if noctrf, don't adjust the counter -
  //   (for instance, if a change in the counter initiated this)
  molads[ii-1]=molad;
  if (noctrf) return;
  if (ii==2) {
    for (let jj=0; jj<3 ; jj++){
      $("#molad_2_"+jj).val(molad[jj]);
    }
  }
  else {
    let txt = molad[0]+"d "+molad[1]+"h "+molad[2]+"ch";
    $("#molad_"+ii).text(txt);
  }
}

function check18(molad,ii) { // if molad is 18h 0ch, flash that element on ruler
// This is important, because that is the element that is causing
//  the calendar to switch.
  if ((molad[1]==18)&&(molad[2]==0)) {
    let day = molad[0];
    let elt18 = $("#rule"+ii+" .li18h")[day];
	flashelt(elt18,2);
	let ptr = $("#ptr_"+ii+" span")[0]; // also wiggle pointer
	flashelt(ptr,3);
  }
}

function mvHArr() {
  let ptrPos = $("#ptr_2").offset().top;
  $("#HArr").offset({top: ptrPos-1.5});
  sizeVArrow(ptrPos); // also resize vertical arrow to match
}

function mvVArrow(yrTyp,divtop,divleft) {
  $("#VArr").offset({top:divtop+30, left: divleft+20});
  sizeHArrow(divleft); // also resize horizontal arrow, to match
}

function sizeVArrow(ptrPos) {
  let arrowTop = $("#VArr").offset().top;
  $(".varrow").css("height",(ptrPos-arrowTop-12));  
}

function sizeHArrow(divleft) {
  let arrowLeft = $("#HArr").offset().left;
  $(".harrow").css("width",divleft-arrowLeft+9);
}

function clearRHbar() { // get rid of all RH bars
  // We _only_ show them if you click on a molad transition.
  $(".RH").hide();
  $(".RH2").css("border","none"); // in case the previous RH day(s) were circled
}
function changeRHbar(col,ii,day) { // all changes to RH bar for different day
  day = day%7; // remainder, 0-6
  let daynm = (day==0) ? "ש" : day; // use ש for Shabbos, otherwise the number
  let rhSel = "#RH_"+col+"_"+ii;
  let color = ["blue","lightgreen","red"][ii];
  $(rhSel).show(); // in case it was hidden
  mvRHbar(rhSel,day); // reposition
  let rhtxt = (ii==0) ? 'ר"ה' : "";
  $(rhSel+" .RHtxt").text(rhtxt);
  $(rhSel+" .RH2").text(daynm);
  $(rhSel).css("borderColor",color);
  $(rhSel).css("color",color);
  let mgl = (ii==0) ? 0 : 4;
  $(rhSel).css("marginLeft",mgl+"px");
  let pdr = (ii==0) ? 0 : (day==0) ? 1 : 2.5;
  $(rhSel).css("paddingRight",pdr+"px");
  let brw = (ii==0) ? 3 : 1.5; // make final one thicker
  $(rhSel).css("borderRightWidth",brw+"px");
  if (ii==0) $(rhSel+" .RH2").css("border","blue solid 1px"); // final result for RH day
}

function mvRHbar(rhSel,day) { // reposition to different day
  let rh = rulerHeight[0]; // they're all the same
  let rt = $("#rule1").offset().top;
  $(rhSel).offset({top:(rt+(rh/7*day))}); // move one-seventh height * several times
}

function sizeRHbar(col,ii) { // set size - should only need to be done once
  let rh = rulerHeight[0]; // they're all the same
  $("#RH_"+col+"_"+ii).css("height",rh/7);
}

function setRH(moladn) { // show vertical day-of-RH markers for that transition, show the changes
  // this may include several columns, and each may have up to three markers:
  // initial day of RH, moved to, (maybe) moved to again
  let rhs = tblMoladList[moladn].rhs;
  $.each( rhs, function (col, rhArray) { // each key is a column number, each rhArray
    // is a set of up to three days that we should show
	let rhln = rhArray.length;
	for (let ii=0; ii<rhln; ii++) {
	  changeRHbar(col,ii,rhArray[rhln-ii-1])
	}
  })
}

function showStory(moladTxt,title) {
$("#storyTransition").text("Transition at");
$("#storyMolad").text("["+moladTxt+"]");
  $("#storyTxt").text(title);
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

function moladAdder(m1,m2) { // adds two molad array, renormalizes
  var msum = [m1[0]+m2[0],m1[1]+m2[1],m1[2]+m2[2]];
  return renormalizeMolad(msum)
}
function moladSubtracter(m1,m2) { // subtracts two molad array, renormalizes
  var mdiff = [m1[0]-m2[0],m1[1]-m2[1],m1[2]-m2[2]];
  return renormalizeMolad(mdiff)
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

function getMoladDec() { // finds decimal molad from position of pointer, 0-7
 // may input as string like "105.25px"
 // Movable pointer is on  the second ruler - for this year's molad
  let newtop = $("#ptr_2").offset().top - 1;
  let moladDec = ((newtop-ptrTop)*7/ptrHeight) + .75;
  //else {moladDec = (parseFloat(newtop)-rulerTop[ii-1])/rulerHeight[ii-1]*7;}
  /*use 7.75 for middle ruler because it actually goes from 0d to 7d 18h. */
  return moladDec;
}

function setPlace(moladDec,ii) { // finds new place on one of the rulers, from its decimal molad
  // for ruler 2, the scale actually runs from 0.75 to 7.75, and uses
  //   offset ptrTop and ptrHeight instead of ruler points, for accuracy.
  if (ii==2) {
    let md1 = moladDec - .75;
    md1 = (md1<0) ? (md1+7) : md1;
    let newOffsetTop = (md1/7*ptrHeight) + ptrTop;
    $("#ptr_2").offset({top: newOffsetTop});
  }
  else {
    let newtop = (moladDec/7*rulerHeight[ii-1]) + rulerTop[ii-1];
    $("#ptr_"+ii).css("top",newtop);
  }
}

function dec2Molad(moladDec) {
  let mm,m0,m1,m2;
  mm=moladDec,m0 = Math.floor(mm),mm=mm-m0;
  m1=Math.floor(mm*24),mm=mm-(m1/24);
  m2=Math.floor(mm*24*1080);
  return renormalizeMolad([m0,m1,m2]);
}

/* some global variables */
let rulerTop=[],rulerHeight=[],rulerBottom=[];
for (let ii=1; ii<5; ii++) {
    rulerTop[ii-1] = $("#rule"+ii).position().top; // should be 0, contained in parent div
    rulerHeight[ii-1] = $("#rule"+ii).height();
    rulerBottom[ii-1] = rulerTop[ii-1] + rulerHeight[ii-1];
}
let molads=[];
let ptrTop,ptrBottom,ptrHeight; // use them to find the molad value from the pointer #2
// ptrTop is 0d18h, ptrBottom is the same, at the bottom of the ruler.

let calendarn; // which of the fourteen calendars is selected

/* list of the molads of the transition points on the Four Gates,
     and num, their canonical form,
     and calns, the position in the calendars array for all four yearType columns, whether or not 
       it is a transition,
     and cols, for which yearTypes [cols] it is the transition,
	 and rulerday, the position/day on the rulers on the left where the critical 18h mark crossing is.
	 Also rhs, which shows how the day of Rosh Hashanah changes for the transition. Each element
	   gives the column, and the transition from the initial
	   day of RH to the final result. This can include several columns to the left or right.
   If you are at or after a given critical molad _and_ before the next critical one
     for that column, this entry tells you the resulting calendar.
*/
const tblMoladList = [
  {"molad": [0,18,0], "num": 0180000, "calns": [0,0,0,7], "cols": [0,1,2,3], "rulerday": [2,0],
    "rhs": {2: [0,1,2]}
  },
  {"molad": [1,9,204], "num": 1090204, "calns": [1,1,1,7], "cols": [0,1,2], "rulerday": [3,5],
    "rhs": {3: [5,6,7], 2: [1,2]}
  },
  {"molad": [1,20,491], "num": 1200491, "calns": [1,1,1,8], "cols": [3], "rulerday": [3,0],
    "rhs": {3: [0,1,2], 2: [1,2]}
  },
  {"molad": [2,15,589], "num": 2150589, "calns": [2,2,1,8], "cols": [0,1], "rulerday": [1,3],
    "rhs": {1: [3,4,5], 2: [2,3]}
  },
  {"molad": [2,18,0], "num": 2180000, "calns": [2,2,2,9], "cols": [2,3], "rulerday": [2,2],
    "rhs": {2: [2,3]}
  },
  {"molad": [3,9,204], "num": 3090204, "calns": [3,3,3,9], "cols": [0,1,2], "rulerday": [3,0],
    "rhs": {3: [0,1,2], 2: [3,4,5]}
  },
  {"molad": [3,18,0], "num": 3180000, "calns": [3,3,3,10], "cols": [3], "rulerday": [2,3],
    "rhs": {2: [3,4,5]}
  },
  {"molad": [4,11,695], "num": 4110695, "calns": [3,3,3,11], "cols": [3], "rulerday": [4,0],
    "rhs": {4: [0,1,2], 3: [3,4,5], 2:[4,5]}
  },
  {"molad": [5,9,204], "num": 5090204, "calns": [4,4,4,11], "cols": [0,1,2], "rulerday": [3,2],
    "rhs": {3: [2,3], 2: [5]}
  },
  {"molad": [5,18,0], "num": 5180000, "calns": [5,5,5,12], "cols": [0,1,2,3], "rulerday": [2,5],
    "rhs": {2: [5,6,0]}
  },
  {"molad": [6,0,408], "num": 6000408, "calns": [6,5,5,12], "cols": [0], "rulerday": [4,0],
    "rhs": {4: [0,1,2], 3:[3,4,5], 2:[6,0]}
  },
  {"molad": [6,9,204], "num": 6090204, "calns": [6,6,6,12], "cols": [1,2], "rulerday": [3,3],
    "rhs": {3: [3,4,5], 2: [6,0]}
  },
  {"molad": [6,20,491], "num": 6200491, "calns": [6,6,6,13], "cols": [3], "rulerday": [3,5],
    "rhs": {3: [5,6,0], 2: [6,0]}
  },
  {"molad": [7,18,0], "num": 7180000, "cols": [0,1,2,3], "calns": [0,7], "rulerday": [2,0],
    "rhs": {2: [0,1,2]}
  }
];

/* build hash table for molad canonical numbers, save time */
let moladI = [];
for (let ii=0; ii<14; ii++) {
  let molad = tblMoladList[ii], moladnum = molad.num; // canonical form
  moladI.push(moladnum);
}

/* list of the calendars, first seven for peshutos, then seven for m'ubaros */
const calendars = ['בח"ג','בש"ה','גכ"ה','הכ"ז','הש"א','זח"א','זש"ג','בח"ה','בש"ז','גכ"ז','הח"א','הש"ג','זח"ג','זש"ה'];

/* initialize - gotta start somewhere */
$(window).on("load", function(){

    /* list of the transition points on the Four Gates */
    const tblMolads = ["0d 18h 0ch","1d 9h 204ch","1d 20h 491ch","2d 15h 589ch","2d 18h 0ch","3d 9h 204ch","3d 18h 0ch","4d 11h 695ch","5d 9h 204ch","5d 18h 0ch","6d 0h 408ch","6d 9h 204ch","6d 20h 491ch","7d 18h 0ch"];

    /* ONE-TIME finding difference between successful rows, so we can choose row height for each */
    /*for (var ii=0; ii<13; ii++) {
        var m2 = tblMolads[ii+1],m1=tblMolads[ii];
        var diff = moladDecimalSubtract(m1,m2);
    }*/
    /* resulting fraction of a day between two successive rows on the chart, in order. 
       some are much bigger than others
    Results: */
    const tblHeights = [0.6328703703703704,0.46940586419753094,0.7954475308641973,0.10227623456790136,0.6328703703703704,0.3671296296296296,0.7351466049382713,0.8977237654320991,0.3671296296296296,0.26574074074074083,0.3671296296296296,0.4694058641975305,0.8977237654320991];
    /* total of heights = 7;*/
    
    ptrTop = $("#rule2 .li18h:first").offset().top;
    ptrBottom = $("#rule2 .li18h:last").offset().top;
    ptrHeight = ptrBottom-ptrTop; // set global variables-
    
    /* reset the row heights to match the actual time within that row */
    const heightMult = ptrHeight/7; //multiplier in pixels so the total will be 7;
    $("tbody tr").each(function(index){ 
      $(this).css("height",(tblHeights[index]*heightMult)+"px") 
    })

    //Make the middle div element draggable:
    $("#ptr_2").draggable({
      axis: "y",
      containment: [5,ptrTop,10,ptrBottom],
      drag: function(evt){
        mvHArr(); // move horizontal arrow
        let moladDec = getMoladDec(); // find decimal molad from position on ruler
        let molad2 = dec2Molad(moladDec); // convert into actual molad
        setMolad(molad2,2); // set counter and global molads entry
        mvOtherPtrs(molad2); // move the other three pointers
		chkCalendar(molad2); // set correct calendar based on pointer
		clearRHbar(); // if they had been set
      }
    });
    
  // vertically position fourgates chart section
  //  directly to the right of the 0d18h position of ruler 2 (=ptrTop)
  let tableBodyTop = $("#fourGatesBody").position().top;
  $("#fourgatesdiv").offset({top: ptrTop-tableBodyTop});

  // initialize year type column
  yrTyp = 1; 
  for (let ii=1; ii<5; ii++) { // move pointers to some initial position
    mvPtr([2,0,0],ii);
  }
  $(".yearType").eq(2).trigger("click"); // choose that column
  mvHArr(); // move horizontal arrow
  ;
  
  for (col=1; col<4; col++) { // set sizes for all the day-of-RH bars
    for (ii=0; ii<3; ii++) {	
	  sizeRHbar(col,ii)
	}
  }
  
  flashclass("moladCol",1); // briefly flash moladCol column
  flasheltbyid("showCol",1);

});

function flashelt(oelt,num) {
    var fclass = "flash"+num;
    oelt.classList.remove(fclass); // first clear
    setTimeout(function() {oelt.classList.add(fclass);},0);
    setTimeout(function() {oelt.classList.remove(fclass);},3000); // clear after
}

function flasheltbyid(id,num) { // flash color on a single element
    var oelt = document.getElementById(id);
    flashelt(oelt,num);
}

function flashclass(classnm,num) { // flash all of a given class
  $("."+classnm).each(function(){
    flashelt(this,num);
  });
}