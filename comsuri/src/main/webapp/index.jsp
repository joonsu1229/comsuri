<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html>
<html>
<head>
<script type="text/javascript" src="./resources/lib/jquery/jquery-1.10.2.js"></script>
<script type="text/javascript" src="./resources/comsuriMain/main.js"></script>
<link rel="stylesheet" href="./resources/css/main.css">
<title>COMSURI</title>
</head>
<body>
<div class="index_wrap">
	<div class="index">
	<header class="maxwidth">
		<h1>
			<img src="./resources/img/comsuri_test.png" alt="컴수리 메인로고">
			<span class="comsuri_logoName">COMSURI</span>
		</h1>
	</header>
	<main class="maxwidth">
		<form action="post">
			<fieldset>
				<legend>로그인</legend>
				<label for="index_userEmail">이메일</label><input type="text" placeholder="EMAIL" id="index_userEmail">
				<label for="index_userPassword">비밀번호</label><input type="password" placeholder="PASSWORD" id="index_userPassword">
				<input type="submit" value="LOGIN">
			</fieldset>
		</form>
		<div class="find_info">
			<a href="#" target="_blank">아이디 찾기</a>
			<a href="#" target="_blank">비밀번호 찾기</a>
			<a href="#" target="_blank">회원가입</a> 
		</div>
		<div class="sns_account">
			<div class="kakao">
				<a href="#" target="_blank">카카오계정으로 로그인</a>
			</div>
			<div class="naver">
				<a href="#" target="_blank">네이버계정으로 로그인</a>
			</div>
		</div>
	</main>
	<footer class="maxwidth">
		<p>Copyright (c) 2019 comsuri. All rights reserved.</p>
	</footer>
	</div>
</div>
</body>
</html>