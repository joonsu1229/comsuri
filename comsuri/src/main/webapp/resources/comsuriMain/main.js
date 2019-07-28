var Main = (function(){
	var that = this;
	window.onload = function init(){
		this.bind();
	};
	
	bind = function(){
		$("#test").on('click', function(){
			that.fn.click();
		});
	};
	
	fn = {
		click : function(){
			debugger;
			$.ajax({
				type: "get",
				url : "/comsuri/login/selectUser",
				success : function(result){
					if(result == ""){
						alert("테스트 성공");
					}
				}
			});
		},
	};
})();


	
