package com.comsuri.kakao.api;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import com.comsuri.loginService.LoginService;
import com.comsuri.loginVO.LoginUserVO;
import com.fasterxml.jackson.databind.JsonNode;

@Controller
public class LoginController {
	private static final Logger logger = LoggerFactory.getLogger(LoginController.class);
	
	private Kakao_restApi kakao_restApi = new Kakao_restApi();
	
	@Autowired
	private LoginService loginService;
	
    @RequestMapping(value = "/oauth", produces = "application/json", method = { RequestMethod.GET, RequestMethod.POST })
    public String kakaoLogin(@RequestParam("code") String code, HttpServletRequest request, HttpServletResponse response, HttpSession session) {
        JsonNode jsonToken = kakao_restApi.getAccessToken(code);
        JsonNode profile = kakao_restApi.getKakaoUserInfo(jsonToken.path("access_token").toString());
        
        //카카오톡에 넘겨준 유저 정보를 LogiUserVo에 담아줌
        LoginUserVO vo = kakao_restApi.changeData(profile);
        
        //로그인을 계속 유지하기위해 세션에 값을 담아줌
        session.setAttribute("loginUserInfo", vo);
               
        //DB에서 조회한 값이 null일경우 카카오톡에 넣은 유저 정보를 insert해줌
		/*
		 * if(loginService.selectLoginInfo(vo) == null) {
		 * loginService.insertLoginInfo(vo); }
		 */
        
        System.out.println("JSON 반환:" + jsonToken.get("access_token"));
        return "/login/kakaoLogin";
    }
}
