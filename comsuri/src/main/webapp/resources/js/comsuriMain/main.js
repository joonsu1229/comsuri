var Main = (function(){
	var that = this;
	window.onload = function init(){
		this.bind();
	};
	
	bind = function(){
		Kakao.init('3d78d858fdef3962f8e80bdbba7e4707');
		$("#index_kakaoLogin").on('click', function(){
			that.fn.kakaoLogin();			
		});
		
		$("#index_naverLogin").on('click',function(){
			that.fn.logoutTest();
		});
	};
	
	fn = {
		kakaoLogin : function(){			
			var url = "https://kauth.kakao.com/oauth/authorize?client_id=3d78d858fdef3962f8e80bdbba7e4707&redirect_uri=http://localhost:9090/comsuri/oauth&response_type=code";
			var option = "resizable=no,scrollbars=no, status=no,width=500, height=500";	
			window.open(url, 'kakao', option);
		},
		
		logoutTest : function(){
			Kakao.API.request({
				url: '/v1/user/logout',
				success: function(res) {
	                var sPerson = JSON.stringify(res);
					var oPerson = JSON.parse(sPerson);
	
					//사용자 정보		                          
					Kakao.Auth.logout(function () {  alert("카카오로그아웃");});
				},
				fail: function(error) {
				}
			});
		}
	};
})();


	
