var KakaoLogin = (function(){
	var that = this;
	var kakaoAccessToken;
	
	window.onload = function init(){
		this.bind();
	};
	
	bind = function(){
		that.fn.kakaoLoginPage();		
	};
	
	fn = {			
			kakaoLoginPage : function(){
		   		window.opener.location.href="/comsuri/comsuriMain";
		   		window.close();
		 },
	};
})();


	
