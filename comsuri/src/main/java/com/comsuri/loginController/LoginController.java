package com.comsuri.loginController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/login")
public class LoginController {
	private static final Logger logger = LoggerFactory.getLogger(LoginController.class);
	
	@RequestMapping(value = "/selectUser", method = RequestMethod.GET)
	public String selectUser(HttpServletRequest request, HttpServletResponse response) {
		System.out.println("잘나오니");
		
		return "login/loginPage";
	}
}
