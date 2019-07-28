/**
 * 이 파일은 폼릿 에디터에서 셀 데이타 수정 시 WYSIWYG 에디터 기능이 가능하도록 하기 위한
 * 함수들이 정의되어 있는 파일이다.
 * 이 소스는 jQuery te plugin을 기반으로 작성되었으니 참고하기 바란다.
 * 아래는 jQuery te plugin 홈페이지 url이다.
 * 
 * http://jqueryte.com/
 * 
 * @autor jgs135(jgs135@naonsoft.com)
 */
var buttons = [];	// 툴바 기능 목록
var thisBrowser = navigator.userAgent.toLowerCase();	// 브라우저 체크
var emphasize = 'active';	// 버튼이 눌려 있는 표시를 하기 위한 class
		
// insertion function for parameters to toolbar
/**
 * 툴바에 기능 추가
 */
function addParams(name,command,key,tag,emphasis,section, floor){
	var thisCssNo  = buttons.length+1;
	return buttons.push({name:name, cls:thisCssNo, command:command, key:key, tag:tag, emphasis:emphasis, section:section, floor:floor});
};
		
// add parameters for toolbar buttons
addParams('format','formats','','',false); // 글꼴 변경
addParams('fsize','fSize','','',false); // 글자 크기 변경
addParams('color','colors','','',false); // 글자색
addParams('b','bold','B',["b","strong"],true); // 굵게
addParams('i','italic','I',["i","em"],true); // 이탈릭체
addParams('u','underline','U',["u"],true); // 밑줄
addParams('ol','insertorderedlist','¾',["ol"],true); // 번호 목록
addParams('ul','insertunorderedlist','¼',["ul"],true); // 블릿 목록
addParams('sub','subscript','(',["sub"],true); // 
addParams('sup','superscript','&',["sup"],true); // super script --> ctrl + up arrow
addParams('outdent','outdent','%',["blockquote"],false); // 내어 쓰기
addParams('indent','indent','\'',["blockquote"],false); // 들여 쓰기
addParams('left','justifyLeft','','',false); // 왼쪽 정렬
addParams('center','justifyCenter','','',false); // 가운데 정렬
addParams('right','justifyRight','','',false); // 오른쪽 정렬
addParams('strike','strikeThrough','K',["strike"],true); // 취소선
addParams('link','linkcreator','L',["a"],true); // 링크 생성
addParams('unlink','unlink','',["a"],false); // 링크 삭제 
addParams('remove','removeformat','.','',false); // 삭제
addParams('rule','inserthorizontalrule','H',["hr"],false); // 제목 줄
addParams('source','displaysource','','',false); // 소스 보기
		
/**
 * 선택 영역 정보를 가지고 있는 selection object를 구하는 함수
 * @returns Selection Object
 */
function selectionGet(){
	// for webkit, mozilla, opera
	if (window.getSelection)
		return window.getSelection();
	// for ie
	else if (document.selection && document.selection.createRange && document.selection.type != "None")
		return document.selection.createRange();
}

// the function of changing to the selected text with "execCommand" method
/**
 * 현재 선택 영역에 선택한 툴바 기능을 적용 하는 함수
 */
function selectionSet(addCommand,thirdParam){
	var	range,
		sel = selectionGet();

	// for webkit, mozilla, opera
	if (window.getSelection)
	{
		if (sel.anchorNode && sel.getRangeAt)
			range = sel.getRangeAt(0);
			
		if(range)
		{
			sel.removeAllRanges();
			sel.addRange(range);
		}
		
		if(!thisBrowser.match(/msie/))
			document.execCommand('StyleWithCSS', false, false);
		
		document.execCommand(addCommand, false, thirdParam);
	}
	
	// for ie
	else if (document.selection && document.selection.createRange && document.selection.type != "None")
	{
		range = document.selection.createRange();
		range.execCommand(addCommand, false, thirdParam);
	}
	
	// change styles to around tags
	affectStyleAround(false,false);
}

// the function of changing to the selected text with tags and tags's attributes
/**
 * 태그 및 태그의 속성을 선택한 텍스트로 변경하는 함수
 */
function replaceSelection(tTag,tAttr,tVal) {
	
	// first, prevent to conflict of different jqte editors
	if(editor.not(":focus"))
		editor.focus();
	
	// for webkit, mozilla, opera			
	if (window.getSelection)
	{
		var selObj = selectionGet(), selRange, newElement, documentFragment;
		
		if (selObj.anchorNode && selObj.getRangeAt)
		{
			selRange = selObj.getRangeAt(0);
			
			// create to new element
			newElement = document.createElement(tTag);
			
			// add the attribute to the new element
			$(newElement).attr(tAttr,tVal);
			
			// extract to the selected text
			documentFragment = selRange.extractContents();
			
			// add the contents to the new element
			newElement.appendChild(documentFragment);
			
			selRange.insertNode(newElement);
			selObj.removeAllRanges();
			
			// if the attribute is "style", change styles to around tags
			if(tAttr=="style")
				affectStyleAround($(newElement),tVal);
			// for other attributes
			else
				affectStyleAround($(newElement),false);
		}
	}
	// for ie
	else if (document.selection && document.selection.createRange && document.selection.type != "None")
	{
		var range = document.selection.createRange();
		var selectedText = range.htmlText;
		
		var newText = '<'+tTag+' '+tAttr+'="'+tVal+'">'+selectedText+'</'+tTag+'>';
		
		document.selection.createRange().pasteHTML(newText);
	}
}

// the function of getting to the parent tag
/**
 * 부모 엘리먼트를 구하는 함수
 * @return 부모 엘리먼트 또는 없을 경우 false
 */
function getSelectedNode() {
	var node,selection;
	if(window.getSelection) {
		selection = getSelection();
		node = selection.anchorNode;
	}
	if(!node && document.selection && document.selection.createRange && document.selection.type != "None")
	{
		selection = document.selection;
		var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
		node = range.commonAncestorContainer ? range.commonAncestorContainer :
			   range.parentElement ? range.parentElement() : range.item(0);
	}
	if(node) {
		return (node.nodeName == "#text" ? $(node.parentNode) : $(node));
	}
	else 
		return false;
}

// the function of replacement styles to the around tags (parent and child)
/**
 * 태그에 스타일 정보를 변경하는 함수
 */
function affectStyleAround(element,style){
	var selectedTag = getSelectedNode(); // the selected node
	
	selectedTag = selectedTag ? selectedTag : element;
	
	// jung 추가. selectedTag가 handsontableInput일 경우에 style정보가 변경되지 않도록 리턴하는 구문을 추가
	if(!selectedTag || selectedTag.hasClass('handsontableInput')){
		return;
	}
	// jung 추가 end
	
	// (for replacement with execCommand) affect to child tags with parent tag's styles
	if(selectedTag && style==false)
	{
		// apply to the selected node with parent tag's styles
		// jung 추가. && !selectedTag.parent().hasClass('handsontableInput') 코드 추가
		if(selectedTag.parent().is("[style]") && !selectedTag.parent().hasClass('handsontableInput'))
			selectedTag.attr("style",selectedTag.parent().attr("style"));
			
		// apply to child tags with parent tag's styles
		if(selectedTag.is("[style]"))
			selectedTag.find("*").attr("style",selectedTag.attr("style"));
	}
	// (for replacement with html changing method)
	else if(element && style && element.is("[style]"))
	{
		var styleKey = style.split(";"); // split the styles
		
		styleKey = styleKey[0].split(":") // get the key of first style feature
		
		// apply to child tags with parent tag's styles
		if(element.is("[style*="+styleKey[0]+"]"))
			element.find("*").css(styleKey[0],styleKey[1]);
			
		// select to the selected node again
		selectText(element);
	}
}

// the function of making selected to a element
/**
 * 엘리먼트에 텍스트 노드를 선택 영역으로 잡아주는 함수
 */
function selectText(element){
	if(element)
	{
		var element = element[0];
		
		if (document.body.createTextRange)
		{
			var range = document.body.createTextRange();
			range.moveToElementText(element);
			range.select();
		}
		else if (window.getSelection)
		{
			var selection = window.getSelection();  
			var range = document.createRange();
			
			if(element != "undefined" && element != null)
			{
				range.selectNodeContents(element);
				
				selection.removeAllRanges();
				selection.addRange(range);
				
				if($(element).is(":empty"))
				{
					$(element).append("&nbsp;");
						selectText($(element));
				}
			}
		}
	}
}

// the function of converting text to link
/**
 * 텍스트를 하이퍼링크로 변경 해주는 함수
 */
function selected2link(){
	if(!toolbar.data("sourceOpened"))
	{
		var selectedTag = getSelectedNode(); // the selected node
		var thisHrefLink = "http://"; // default the input value of the link-form-field

		// display the link-form-field
		linkAreaSwitch(true);

		if(selectedTag)
		{
			
			var thisTagName  = selectedTag.prop('tagName').toLowerCase();
			
			// if tag name of the selected node is "a" and the selected node have "href" attribute
			if(thisTagName == "a" && selectedTag.is('[href]'))
			{
				thisHrefLink = selectedTag.attr('href');
				
				selectedTag.attr(setdatalink,"");
			}
			// if it don't have "a" tag name
			else 
				replaceSelection("a",setdatalink,"");
			
		}
		else 
			linkinput.val(thisHrefLink).focus();
		
		// the method of displaying-hiding to link-types
		linktypeselect.click(function(e)
		{
			if($(e.target).hasClass(vars.css+"_linktypetext") || $(e.target).hasClass(vars.css+"_linktypearrow"))
				linktypeSwitch(true);
		});
		
		// the method of selecting to link-types
		linktypes.find("a").click(function()
		{
			var thisLinkType = $(this).attr(vars.css+"-linktype");
			
			linktypes.data("linktype",thisLinkType)
			
			linktypeview.find("."+vars.css+"_linktypetext").html(linktypes.find('a:eq('+linktypes.data("linktype")+')').text());
			
			linkInputSet(thisHrefLink);
			
			linktypeSwitch();
		});
		
		linkInputSet(thisHrefLink);
		
		// the method of link-input
		linkinput
			// auto focus
			.focus()
			// update to value
			.val(thisHrefLink)
			// the event of key to enter in link-input
			.bind("keypress keyup",function(e)
			{
				if(e.keyCode==13)
				{
					linkRecord(jQTE.find("["+setdatalink+"]"));
					return false;
				}
			});
		
		// the event of click link-button
		linkbutton.click(function()
		{
			linkRecord(jQTE.find("["+setdatalink+"]"));
		});
	}
	else
		// hide the link-form-field
		linkAreaSwitch(false);
}

/**
 * 
 * @param thisSelection
 */
function linkRecord(thisSelection){
	// focus to link-input
	linkinput.focus();
	
	// select to the selected node
	selectText(thisSelection);
	
	// remove pre-link attribute (mark as "link will be added") of the selected node
	thisSelection.removeAttr(setdatalink);
	
	// if not selected to link-type of picture
	if(linktypes.data("linktype")!="2")
		selectionSet("createlink",linkinput.val()); // insert link url of link-input to the selected node
	// if selected to link-type of picture
	else
	{
		selectionSet("insertImage",linkinput.val()); // insert image url of link-input to the selected node

		// the method of all pictures in the editor
		editor.find("img").each(function(){
			var emptyPrevLinks = $(this).prev("a");
			var emptyNextLinks = $(this).next("a");
			
			// if "a" tags of the front and rear of the picture is empty, remove
			if(emptyPrevLinks.length>0 && emptyPrevLinks.html()=="")
				emptyPrevLinks.remove();
			else if(emptyNextLinks.length>0 && emptyNextLinks.html()=="")
				emptyNextLinks.remove();
		});
	}

	// hide the link-form-field
	linkAreaSwitch();
	
	// export contents of the text to the sources
	editor.trigger("change");
}

// the function of switching link-form-field
function linkAreaSwitch(status){
	// remove all pre-link attribute (mark as "link will be added")
	clearSetElement("["+setdatalink+"]:not([href])");
	jQTE.find("["+setdatalink+"][href]").removeAttr(setdatalink);
	
	if(status)
	{
		toolbar.data("linkOpened",true);
		linkform.show();
	}
	else
	{ 
		toolbar.data("linkOpened",false);
		linkform.hide();
	}
	
	linktypeSwitch();
}

// the function of switching link-type-selector
function linktypeSwitch(status){
	if(status)
		linktypes.show();
	else
		linktypes.hide();
}

// the function of updating the link-input according to the link-type
function linkInputSet(thisHrefLink){
	var currentType = linktypes.data("linktype");
	
	// if selected type of e-mail
	if(currentType=="1" && (linkinput.val()=="http://" || linkinput.is("[value^=http://]") || !linkinput.is("[value^=mailto]"))) 
		linkinput.val("mailto:");
	else if(currentType!="1" && !linkinput.is("[value^=http://]"))
			linkinput.val("http://");
	else
		linkinput.val(thisHrefLink);
}

// the function of adding style to selected text
function selected2style(styleCommand){
	if(!toolbar.data("sourceOpened"))
	{
		
		// if selected to changing the font-size value
		if(styleCommand=="fSize")
			styleField = fsizebar;
		
		// if selected to changing the text-color value
		else if(styleCommand=="colors")
			styleField = cpalette;
		
		// display the style-field
		styleFieldSwitch(styleField,true);
		
		// the event of click to style button
		styleField.find("a").unbind("click.styleField").on('click.styleField', function()
		{
			var styleValue = $(this).attr(vars.css + "-styleval"); // the property of style value to be added
			
			// if selected to changing the font-size value
			if(styleCommand=="fSize")
			{
				styleType  = "font-size";
				styleValue = styleValue + vars.funit; // combine the value with size unit
			}
			// if selected to changing the text-color value
			else if(styleCommand=="colors")
			{
				styleType  = "color";
				styleValue = "rgb("+styleValue + ")"; // combine color value with rgb
			}
			
			var prevStyles = refuseStyle(styleType); // affect styles to child tags (and extract to the new style attributes)
			
			// change to selected text
			replaceSelection("span","style",styleType+":"+styleValue+";"+prevStyles);
			
			// hide all style-fields
			styleFieldSwitch("",false);
			
			// remove title bubbles
			$('.'+vars.css+'_title').remove();
			
			// export contents of the text to the sources
			editor.trigger("change");
		});
		
	}
	else
		// hide the style-field
		styleFieldSwitch(styleField,false);
		
	// hide the link-form-field
	linkAreaSwitch(false);
}

// the function of switching the style-field
function styleFieldSwitch(styleField,status){
	var mainData="", // the style data of the actual wanted
		allData = [{"d":"fsizeOpened","f":fsizebar},{"d":"cpallOpened","f":cpalette}]; // all style datas
	
	// if the style data of the actual wanted isn't empty
	if(styleField!="")
	{
		// return to all datas and find the main data
		for(var si=0; si < allData.length; si++)
		{
			if(styleField==allData[si]["f"])
				mainData = allData[si];
		}
	}
	// display the style-field
	if(status)
	{
		toolbar.data(mainData["d"],true); // stil seçme alanının açıldığını belirten parametre yaz 
		mainData["f"].slideDown(100); // stil seçme alanını aç
		
		// return to all datas and close the fields of external datas
		for(var si=0; si < allData.length; si++)
		{
			if(mainData["d"]!=allData[si]["d"])
			{
				toolbar.data(allData[si]["d"],false);
				allData[si]["f"].slideUp(100);
			}
		}
	}
	// hide all style-fields
	else
	{
		// return to all datas and close all style fields
		for(var si=0; si < allData.length; si++)
		{
			toolbar.data(allData[si]["d"],false);
			allData[si]["f"].slideUp(100);
		}
	}
}

// the function of removing all pre-link attribute (mark as "link will be added")
function clearSetElement(elem){
	jQTE.find(elem).each(function(){
		$(this).before($(this).html()).remove();
	});
}

// the function of refusing some styles
function refuseStyle(refStyle){
	var selectedTag = getSelectedNode(); // the selected node
	
	// if the selected node have attribute of "style" and it have unwanted style
	// jung 추가. handsontableInput div에 style 정보을 상속 하지 않도록 처리
	if(selectedTag && selectedTag.is("[style]") && selectedTag.css(refStyle)!="" && !selectedTag.hasClass('handsontableInput'))
	{
		var refValue = selectedTag.css(refStyle); // first get key of unwanted style
		
		selectedTag.css(refStyle,""); // clear unwanted style
		
		var cleanStyle = selectedTag.attr("style"); // cleaned style
		
		selectedTag.css(refStyle,refValue); // add unwanted style to the selected node again
		
		return cleanStyle; // print cleaned style
	}
	else
		return "";
}

// the function of adding style to selected text
function selected2format(){
	formatFieldSwitch(true);
	
	formatbar.find("a").click(function()
	{
		$("*",this).click(function(e)
		{
			e.preventDefault();
			return false;
		});
		
		formatLabelView($(this).text().split(' ',1));
		
		var formatValue = $(this).attr(vars.css + "-formatval"); // the type of format value
		
		// jung 수정. format을 family로 기능 변경
		// convert to selected format
		/*
		selectionSet("formatBlock",'<'+formatValue+'>');
		formatFieldSwitch(false);
		*/
		
		var prevStyles = refuseStyle('font-family'); // affect styles to child tags (and extract to the new style attributes)
		
		// change to selected text
		replaceSelection("span","style",'font-family'+":"+formatValue+";"+prevStyles);
		
		formatFieldSwitch(false);
		
		// export contents of the text to the sources
		editor.trigger("change");
	});
}

// the function of switching the style-field
function formatFieldSwitch(status){				
	var thisStatus = status ? true : false;
	
	thisStatus = status && formatbar.data("status") ? true : false;
	
	if(thisStatus || !status)
		formatbar.data("status",false).slideUp(200);
	else
		formatbar.data("status",true).slideDown(200);
}

// change format label
function formatLabelView(str){
	var formatLabel = formatbar.closest("."+vars.css+"_tool").find("."+vars.css+"_tool_label").find("."+vars.css+"_tool_text");
	
	if(str.length > 10)
			str = str.substr(0,7) + "...";
	
	// change format label of button
	formatLabel.html(str);
}

// the function of insertion a specific form to texts
function extractToText(strings){
	var $htmlContent, $htmlPattern, $htmlReplace;

	// first remove to unnecessary gaps
	$htmlContent = strings.replace(/\n/gim,'').replace(/\r/gim,'').replace(/\t/gim,'').replace(/&nbsp;/gim,' ');

	$htmlPattern =  [
		/\<span(|\s+.*?)><span(|\s+.*?)>(.*?)<\/span><\/span>/gim, // trim nested spans
		/<(\w*[^p])\s*[^\/>]*>\s*<\/\1>/gim, // remove empty or white-spaces tags (ignore paragraphs (<p>) and breaks (<br>))
		/\<div(|\s+.*?)>(.*?)\<\/div>/gim, // convert div to p
		/\<strong(|\s+.*?)>(.*?)\<\/strong>/gim, // convert strong to b
		/\<em(|\s+.*?)>(.*?)\<\/em>/gim // convert em to i
	];

	$htmlReplace = [
		'<span$2>$3</span>',
		'',
		'<p$1>$2</p>',
		'<b$1>$2</b>',
		'<i$1>$2</i>'
	];
	
	// repeat the cleaning process 5 times
	for(c=0; c<5; c++)
	{
		// create loop as the number of pattern
		for(var i = 0; i < $htmlPattern.length; i++)
		{
			$htmlContent = $htmlContent.replace($htmlPattern[i], $htmlReplace[i]);
		}
	}

	// if paragraph is false (<p>), convert <p> to <br>
	if(!vars.p)
		$htmlContent = $htmlContent.replace(/\<p(|\s+.*?)>(.*?)\<\/p>/ig, '<br/>$2');

	// if break is false (<br>), convert <br> to <p>
	if(!vars.br)
	{
		$htmlPattern =  [
			/\<br>(.*?)/ig,
			/\<br\/>(.*?)/ig
		];

		$htmlReplace = [
			'<p>$1</p>',
			'<p>$1</p>'
		];

		// create loop as the number of pattern (for breaks)
		for (var i = 0; i < $htmlPattern.length; i++) {
			$htmlContent = $htmlContent.replace($htmlPattern[i], $htmlReplace[i]);
		}
	}

	// if paragraph and break is false (<p> && <br>), convert <p> to <div>
	if(!vars.p && !vars.br)
		$htmlContent = $htmlContent.replace(/\<p>(.*?)\<\/p>/ig, '<div>$1</div>');

	return $htmlContent;
}

// the function of exporting contents of the text field to the source field (to be the standard in all browsers)
function postToSource(){
	// clear unnecessary tags when editor view empty
	var sourceStrings = editor.text()=="" && editor.html().length<12 ? "" : editor.html();
	
	thisElement.val(extractToText(sourceStrings));
}

// the function of exporting contents of the source field to the text field (to be the standard in all browsers)
function postToEditor(){
	editor.html(extractToText(thisElement.val()));
}

// the function of getting parent (or super parent) tag name of the selected node
function detectElement(tags){

	var resultdetect=false, $node = getSelectedNode(), parentsTag;
	
	if($node)
	{
		$.each(tags, function(i, val){
			parentsTag = $node.prop('tagName').toLowerCase();

			if (parentsTag == val)
				resultdetect = true;
			else
			{
				$node.parents().each(function(){
					parentsTag = $(this).prop('tagName').toLowerCase();
					if (parentsTag == val)
						resultdetect = true;
				});
			}
		});
		
		return resultdetect;
	}
	else 
		return false;
}

// the function of getting parent (or super parent) tag name of the selected node
/**
 * 현재 커서가 가있는 엘리먼트에 폰트를 확인해서 툴바에 표시하는 함수이다.
 * @author JUNG(jgs135@naonsoft.com)
 */
function detectFontFamily(val){

	var resultdetect=false, $node = getSelectedNode(), parentsTag;
	
	if($node)
	{
		if ($node.css('font-family') == val)
			resultdetect = true;
		else
		{
			$node.parents().each(function(){
				if ($node.css('font-family') == val)
					resultdetect = true;
			});
		}
		return resultdetect;
	}
	else 
		return false;
}

// the function of highlighting the toolbar buttons according to the cursor position in jqte editor
function buttonEmphasize(e){
	for(var n = 0; n < buttons.length; n++)
	{				
		if(buttons[n].emphasis && buttons[n].tag!='')
			detectElement(buttons[n].tag) ? $('.'+buttons[n].command).addClass(emphasize) : $('.'+buttons[n].command).removeClass(emphasize);
	}								
}