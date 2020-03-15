package com.comsuri.loginDao;

import com.comsuri.loginVO.LoginUserVO;

public interface LoginDao {
	public int insertLoginInfo(LoginUserVO vo);
	public LoginUserVO selectLoginInfo(LoginUserVO vo);
}
