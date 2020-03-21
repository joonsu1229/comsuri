var Main = (function(){
	var that = this;
	window.onload = function init(){
		that.bind();
	};
	
	bind = function(){
		$("#cont").on("button","click",that.fn.start());
	};
	
	fn = {
		start : function(){
			
		}
	};
})();


	
