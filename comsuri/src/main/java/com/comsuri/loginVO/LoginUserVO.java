package com.comsuri.loginVO;
import java.util.Date;

public class LoginUserVO {

	private String user_id;
	private String user_email;
	private String user_name;
	private String user_password;
	private String user_profileImagePath;
	private int user_sex;
	private String user_birth;
	private String user_job;
	private String user_phoneNumber;
	private String user_authCode;
	private String user_authStatus;
	private String user_isTutor;
	private String user_status;
	private Date user_log;
	private String user_regDt;
	private int user_isAdmin;
	
	
	
	public String getUser_regDt() {
		return user_regDt;
	}


	public void setUser_regDt(String user_regDt) {
		this.user_regDt = user_regDt;
	}


	public int getUser_isAdmin() {
		return user_isAdmin;
	}


	public void setUser_isAdmin(int user_isAdmin) {
		this.user_isAdmin = user_isAdmin;
	}


	public Date getUser_log() {
		return user_log;
	}


	public void setUser_log(Date user_log) {
		this.user_log = user_log;
	}

	public String getUser_status() {
		return user_status;
	}


	public void setUser_status(String user_status) {
		this.user_status = user_status;
	}


	public String getUser_isTutor() {
		return user_isTutor;
	}


	public void setUser_isTutor(String user_isTutor) {
		this.user_isTutor = user_isTutor;
	}


	public String getUser_authCode() {
		return user_authCode;
	}


	public void setUser_authCode(String user_authCode) {
		this.user_authCode = user_authCode;
	}


	public String getUser_authStatus() {
		return user_authStatus;
	}


	public void setUser_authStatus(String user_authStatus) {
		this.user_authStatus = user_authStatus;
	}


	public void setUser_birth(String user_birth) {
		this.user_birth = user_birth;
	}
	

	public String getUser_birth() {
		return user_birth;
	}


	private String user_snsId;
	
	
	public void setUser_snsId(String user_snsId) {
		this.user_snsId = user_snsId;
	}
	
	public String getUser_snsId() {
		return user_snsId;
	}

	public String getUser_id() {
		return user_id;
	}
	public void setUser_id(String user_id) {
		this.user_id = user_id;
	}
	public String getUser_email() {
		return user_email;
	}
	public void setUser_email(String user_email) {
		this.user_email = user_email;
	}
	public String getUser_name() {
		return user_name;
	}
	public void setUser_name(String user_name) {
		this.user_name = user_name;
	}
	public String getUser_password() {
		return user_password;
	}
	public void setUser_password(String user_password) {
		this.user_password = user_password;
	}
	public String getUser_profileImagePath() {
		return user_profileImagePath;
	}
	public void setUser_profileImagePath(String user_profileImagePath) {
		this.user_profileImagePath = user_profileImagePath;
	}
	public int getUser_sex() {
		return user_sex;
	}
	public void setUser_sex(int user_sex) {
		this.user_sex = user_sex;
	}
	
	public String getUser_job() {
		return user_job;
	}
	public void setUser_job(String user_job) {
		this.user_job = user_job;
	}
	public String getUser_phoneNumber() {
		return user_phoneNumber;
	}
	public void setUser_phoneNumber(String user_phoneNumber) {
		this.user_phoneNumber = user_phoneNumber;
	}

	
	@Override
	public String toString() {
		return "UserVO [user_id=" + user_id + ", user_email=" + user_email + ", user_name=" + user_name
				+ ", user_password=" + user_password + ", user_profileImagePath=" + user_profileImagePath
				+ ", user_sex=" + user_sex + ", user_birth=" + user_birth + ", user_job=" + user_job
				+ ", user_phoneNumber=" + user_phoneNumber + ", user_authCode=" + user_authCode + ", user_authStatus="
				+ user_authStatus + ", user_isTutor=" + user_isTutor + ", user_status=" + user_status + ", pageNumber="
				+ "user_regDt=" + user_regDt 
				+ "user_isAdmin=" + user_isAdmin + ", user_snsId=" + user_snsId + "]";
	}
}
