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
});

  // make molad times on the chart clickable - adjust molads and yrTyp, move pointers
$(".moladDiv").on("click", function() {
  let pickYrTyp = $(this).attr("pickYrTyp"); // some of them need certain yrTyps to work
  let moladTxt = $(this).text();
  let title = $(this).attr("title");
  $(".yearType").eq(pickYrTyp-1).trigger("click"); // choose that column
  // okay, let's set the molad
  let molad2 = molad2array(moladTxt);
  mvPtr(molad2,2,0,1); // adjust pointer for second ruler
  mvOtherPtrs(molad2,1);
  mvHArr(); // move horizontal arrow to match
  showStory(moladTxt,title);
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

function mvPtr(molad2,ii,noctrf,flashf) { // other rulers 1 3 or 4, move to match appropriately
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
  if (flashf) {check18(otherMolad,ii)};
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
  }
}

function mvHArr() {
  let ptrPos = $("#ptr_2").offset().top;
  $("#HArr").offset({top: ptrPos-1.5});
  sizeVArrow(ptrPos); // also resize vertical arrow to match
}

function mvVArrow(yrTyp,divtop,divleft) {
  //$("#VArr").css("left",divleft+17);
  //$("#VArr").css("top",divtop+117);
  $("#VArr").offset({top:divtop+30, left: divleft+20});
  sizeHArrow(divleft); // also resize horizontal arrow, to match
}

function sizeVArrow(ptrPos) {
  let arrowTop = $("#VArr").offset().top;
  $(".varrow").css("height",(ptrPos-arrowTop-12));  
}

function sizeHArrow(divleft) {
  let arrowLeft = $("#HArr").offset().left;
  $(".harrow").css("width",divleft-arrowLeft+7);
}

function showStory(moladTxt,title) {
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

let rulerTop=[],rulerHeight=[],rulerBottom=[];
for (let ii=1; ii<5; ii++) {
    rulerTop[ii-1] = $("#rule"+ii).position().top; // should be 0, contained in parent div
    rulerHeight[ii-1] = $("#rule"+ii).height();
    rulerBottom[ii-1] = rulerTop[ii-1] + rulerHeight[ii-1];
}
let molads=[];
let ptrTop,ptrBottom,ptrHeight; // use them to find the molad value from the pointer #2
// ptrTop is 0d18h, ptrBottom is the same, at the bottom of the ruler.

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