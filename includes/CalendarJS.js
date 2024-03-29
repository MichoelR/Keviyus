$(document).ready(function() {
	caltype=2; // global variable - initial format displayed
	$("#caltypebtn_2").addClass("calBdySel");

	// row number (for each calendar type, for each side) for the move buttons
	// that's [row number for calendar, row number for sidra]
	tags = {1:{1:{0:[24,1],1:[85,8],2:[148,17],3:[192,25],4:[242,34],5:[304,44],6:[350,51]},
			   2:{0:[24,1],1:[85,8],2:[179,22],3:[222,29],4:[272,34],5:[334,44],6:[378,51]}},
		    2:{1:{0:[23,1],1:[84,8],2:[147,17],3:[191,25],4:[241,34],5:[303,44],6:[348,51]},
			   2:{0:[23,1],1:[85,8],2:[178,22],3:[221,29],4:[271,34],5:[333,44],6:[377,51]}},
		    3:{1:{0:[54,1],1:[116,8],2:[181,17],3:[224,25],4:[274,34],5:[336,44],6:[380,51]},
			   2:{0:[24,1],1:[86,8],2:[181,22],3:[224,29],4:[274,34],5:[336,44],6:[380,51]}}
		   }; // JSON caltype:{num:...}}
	lockn = ''; // is any one of the lock rows locked?
	$("#caltypebtntxt").text('ראש השנה');

	$("#calendars").on("keydown",function(e){ // add pagedown event to calendars scroll
      if(e.keyCode === 34){
		weekDown(); // move down exactly one week
		return false;
        }
      if(e.keyCode === 33){
		weekUp(); // move up exactly one week
		return false;
        }
    });
	
	weekHeight = getWeekHeight(); // store in global var
	
})

function initPage0() {
	typeofcol=2; // global variable, p'shutah=1, m'uberes=2
	//scrollingTableSetThWidth(); // reset header widths to match calendar body;
}

//Finds x value of given object
function findPos(obj) {
    var curleft = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
        } while (obj = obj.offsetParent);
    return [curleft];
    }
}	

function getCurrentComputedStyle(element, attribute)
{
    var attributeValue;
    if (window.getComputedStyle) 
    { // class A browsers
        var styledeclaration = document.defaultView.getComputedStyle(element, null);
        attributeValue = styledeclaration.getPropertyValue(attribute);
    } else if (element.currentStyle) { // IE
        attributeValue = element.currentStyle[vclToCamelCases(attribute)];
    }
    return attributeValue;
}

function scrollIntoViewPlus(elt,elt2,pxl) { // default 135 pixels from top
	elt.scrollIntoView(); // brings to top
	if (!pxl) pxl=135; // just fits under header
	//$(".calendars")[0].scrollTop += -pxl;
	$(elt2)[0].scrollTop += -pxl;
}

function scrollIn(elt, elt2, pxl) {
	// elt is the target, elt2 is the surrounding scrolling element
	if (!pxl) pxl = $(".calendarshdr").height(); // fixed header, blocks view
	var vpos0 = $(elt).position();
	if (!vpos0) return "";
	var vpos = vpos0.top;
	//var cscrolltop = $("#calendars")[0].scrollTop
	var cscrolltop = $(elt2)[0].scrollTop
	var shift = cscrolltop+vpos-pxl-20;
	//$("#calendars").animate({scrollTop: shift},1000)
	$(elt2).animate({scrollTop: shift},1000)
}

function getVis(elt) { // is this element vertically visible in the scrolling div?
	// return pos=-1 for above, 0 for visible, 1 for below
	var ht,ht2,vpos,vis
	var vpos0 = $(elt).position();
	if (!vpos0) return "";
	vpos = vpos0.top;
	ht = $(elt).offsetParent().height();
	ht2 = $(elt).height();
	ht3 = $(".calendarshdr").height(); // fixed header, blocks view
	if (vpos < ht3) return -1; // above top of div
	if ((vpos+ht2) > ht) return 1; // below fold
	return 0; // visible
}

function switchtype(type,scrollf) { // toggle p'shutah, m'uberes - which is visible?
	// if no argument, toggle global variable
	var elt2=$("#calendars");
	var pos = (type==2) ? 0 : $(elt2).width();
	var duration = (scrollf)?1000:0; // do it slowly?
	elt2.animate({scrollLeft:pos},{duration:duration});
}
	
function toggleCalType(caltype0)	{ // shift between calendars that have days of week
	// lined up (default, caltype=1), and that have all the Rosh Hashanos
	// start together (caltype=2), or all Pesachs together (caltype=3)
	caltype = caltype0; // global variable
	if (caltype==1) { //
		$("#calendarsbody1").show(); $("#caltypebtn_1").addClass("calBdySel");
		$("#calendarsbody2").hide(); $("#caltypebtn_2").removeClass("calBdySel");
		$("#calendarsbody3").hide(); $("#caltypebtn_3").removeClass("calBdySel");
	} else if (caltype==2) {
		$("#calendarsbody2").show(); $("#caltypebtn_2").addClass("calBdySel");
		$("#calendarsbody1").hide(); $("#caltypebtn_1").removeClass("calBdySel");
		$("#calendarsbody3").hide(); $("#caltypebtn_3").removeClass("calBdySel");
	} else if (caltype==3) {
		$("#calendarsbody3").show(); $("#caltypebtn_3").addClass("calBdySel");
		$("#calendarsbody1").hide(); $("#caltypebtn_1").removeClass("calBdySel");
		$("#calendarsbody2").hide(); $("#caltypebtn_2").removeClass("calBdySel");
	}
}

function moveTo(num)	{ // scroll to various places on the calendar.
	// approximate, but it saves time.
	var pxl,rown0,rown1,tag,type;
	// use global 'tags' JSON string to find correct row
	// use global 'caltype' for which kind of calendar format
	var elt2 = $("#calendars")
	type = ($(elt2).scrollLeft()) > ($(elt2).innerWidth()/2) ? 1 : 2;
	var tag = tags[caltype][type][num];
	var rown0 = tag[0], rown1 = tag[1];
	var elt0 = $("#"+caltype+'_row'+rown0);
	// peshutah side is a month ahead
	switchtype(type,1); // go to nearest _same_ side
	scrollIn(elt0,elt2); // scroll down to correct row
	var elt1 = $("#sidros_"+rown1);
	elt2 = $("#parshacol");
	pxl = $(elt2).innerHeight()/3;
	scrollIn(elt1,elt2,pxl); // scroll sidros to correct parsha
}

function lockTo(num)	{ // freeze various rows on the calendar
	moveTo(num); // begin by scrolling to that row, if we aren't there.
	var rown = tags[caltype][num]; // caltype global var
	var eltid = caltype+'_row'+rown; // the row we want
	$("#" + eltid + " > td").addClass('bodystickcell');
	unlock(); // unfreeze previous row
	var btn = $("#lockbtn_"+num); // need to change class on clicked buttons
	$(btn).addClass("unlockbtn");
	$(btn).removeClass("lockbtn");
	$(btn).attr("onclick","unlock("+num+")"); 
	$(btn).prop("title","Unfreeze");
	lockn = num; // global variable
}

function unlock()	{ // unfreeze a row
	if (lockn==='') return; // global var, empty if nothing's locked
	// fix row
	var rown = tags[caltype][lockn];
	var eltid = caltype+'_row'+rown; // the row we want to unlock
	$("#" + eltid + " > td").removeClass('bodystickcell');
	// fix button
	var btn = $("#lockbtn_"+lockn); // need to change class on clicked buttons
	$(btn).removeClass("unlockbtn");
	$(btn).addClass("lockbtn");
	$(btn).attr("onclick","lockTo("+lockn+")");
	$(btn).prop("title","Freeze");
	lockn = ''; // global var
}

function getWeekHeight()	{ // find scrolling height for one week of calendar
	var elt1 = $("#"+caltype+"_row7");
	var elt2 = $("#"+caltype+"_row14"); // one week below
	var vpos0 = $(elt1).position();
	if (!vpos0) return "";
	var vpos1 = vpos0.top;
	var vpos0 = $(elt2).position();
	if (!vpos0) return "";
	var vpos2 = vpos0.top;
	return vpos2-vpos1;
}
function getAllHeights() { // DEBUGGING - find all scrolling heights
	var min=1000,max=0;
	for (var cnt=1; cnt<60; cnt++){
		var elt1 = $("#"+caltype+"_row"+(cnt*7));
		var elt2 = $("#"+caltype+"_row"+((cnt*7)+7)); // one week below
		var vpos0 = $(elt1).position();
		if (!vpos0) break;
		var vpos1 = vpos0.top;
		var vpos0 = $(elt2).position();
		if (!vpos0) break;
		var vpos2 = vpos0.top;
		var shift = vpos2-vpos1;
		console.log(caltype+"_row"+(7*cnt)+": "+ shift);
		if (shift>max) max=shift;
		if (shift<min) min=shift;
	}
	console.log('hello');
	console.log('min: '+min);
	console.log('max: '+max);
}

function weekDown() { // scroll down one week exactly
	var cscrolltop = $("#calendars")[0].scrollTop
	var shift = cscrolltop + weekHeight; // global var for one week's height
	$("#calendars").animate({scrollTop: shift},1000);
}

function weekUp() { // scroll up one week exactly
	var cscrolltop = $("#calendars")[0].scrollTop
	var shift = cscrolltop - weekHeight; // global var for one week's height
	$("#calendars").animate({scrollTop: shift},1000);
}
