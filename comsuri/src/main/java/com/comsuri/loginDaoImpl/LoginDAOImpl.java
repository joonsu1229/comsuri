package com.comsuri.loginDaoImpl;

import org.apache.ibatis.session.SqlSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.comsuri.loginDao.LoginDao;
import com.comsuri.loginVO.LoginUserVO;

@Repository
public class LoginDAOImpl  implements LoginDao{
	private String namespace = "com.comsuri.loginDao.LoginDao.";
	
	@Autowired
	private SqlSession sqlSession;
	
	public void setSqlSession(SqlSession sqlSession) {
		this.sqlSession = sqlSession;
	}

	public int insertLoginInfo(LoginUserVO vo) {
		return this.sqlSession.insert(namespace + "insertLoginInfo", vo);
	}
	
	public LoginUserVO selectLoginInfo(LoginUserVO vo) {
		return this.sqlSession.selectOne(namespace + "selectLoginInfo", vo);
	}	
}
