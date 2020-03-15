package com.comsuri.loginService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.comsuri.loginDaoImpl.LoginDAOImpl;
import com.comsuri.loginVO.LoginUserVO;

@Repository
public class LoginService {
	
	@Autowired
	private LoginDAOImpl loginDao;
	
	public int insertLoginInfo(LoginUserVO vo) {
		return loginDao.insertLoginInfo(vo);
	}
	
	public LoginUserVO selectLoginInfo(LoginUserVO vo) {
		return loginDao.selectLoginInfo(vo);
	}
	
}
