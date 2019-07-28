
(function($) {
    var printAreaCount = 0;

    $.fn.printArea = function()
        {
            var ele = $(this);
            var links = window.document.getElementsByTagName('link');
            var styles = window.document.getElementsByTagName('style');
            
            var tmpClass = $(ele).attr("class");
            var tmpPrintHtml = $(ele).html();
            var myStyles = $("style").toArray();
            var sw=screen.width;
            var sh=screen.height;
            var w = String(Number($(this).css("width").replace("px","")) + 50);//새창의 폭
       	 	var h = String(Number($(this).css("height").replace("px","")) + 50);//새창의 높이 
            var xpos=(sw-w)/2; //화면 중앙에 띄우기 가로위치
       	 	var ypos=(sh-h)/2; //화면 중앙에 띄우기 위함 세로위치
       	 	
            var rptWin = window.open("","rpt","width=" + w +",height="+ h +",top=" + ypos + ",left="+ xpos +",status=yes,scrollbars=yes");
            
            rptWin.document.open();
            rptWin.document.write("<html><head>");

            for( var i = 0; i < links.length; i++ ){
                if( links[i].rel.toLowerCase() == 'stylesheet' )
                	rptWin.document.write('<link type="text/css" rel="stylesheet" href="' + links[i].href + '"></link>');
            }
            
            rptWin.document.write('<style type="text/css">');

            for( var i = 0; i < myStyles.length; i++ ){
            	rptWin.document.write(myStyles[i].innerHTML);
            }
            
            rptWin.document.write('</style>');
            rptWin.document.write("</head><body style='background-color:#FFFFFF'><span id='"+ ele.attr("id") +"'>");
            rptWin.document.write(tmpPrintHtml);
            rptWin.document.write("</span></body></html>");
            
            rptWin.document.close();
            rptWin.print();
            rptWin.close();
        };

})(jQuery);

