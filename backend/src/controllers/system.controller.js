const oracle = require('../configs/oracle');
const OracleDB = require('oracledb');
const systemService = require('../services/system.service');
// danh sách câu truy vấn cho getStatisticDash
const sqlDashList = [
	`SELECT SUM(Value) / 1024 / 1024 AS totalSga FROM v$sga`,
	`SELECT COUNT(*) AS noRole FROM SYS.Dba_Roles`,
	`SELECT COUNT(*) AS noView FROM SYS.User_Views`,
	`SELECT COUNT(*) AS noTable FROM SYS.User_Tables`,
	`SELECT COUNT(*) AS noUser FROM All_Users`,
	`SELECT COUNT(*) AS noOpenedUser FROM SYS.Dba_Users WHERE Account_Status = 'OPEN'`,
	`SELECT COUNT(*) AS noLockedUser FROM SYS.Dba_Users	WHERE Account_Status LIKE '%LOCKED%'`,
	`SELECT COUNT(*) AS noAdminUser FROM SYS.Dba_Role_Privs WHERE Granted_Role = 'SYS_ADMIN'`,
	`SELECT COUNT(*) AS noNewUser FROM SYS.All_Users WHERE To_Char(Created, 'yy') = To_Char(Sysdate, 'yy') AND To_Char(Created, 'mm') = To_Char(Sysdate, 'mm')`,
];

exports.getStatisticDash = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const result = await Promise.all([
			await oracleConnect.execute(sqlDashList[0]),
			await oracleConnect.execute(sqlDashList[1]),
			await oracleConnect.execute(sqlDashList[2]),
			await oracleConnect.execute(sqlDashList[3]),
			await oracleConnect.execute(sqlDashList[4]),
			await oracleConnect.execute(sqlDashList[5]),
			await oracleConnect.execute(sqlDashList[6]),
			await oracleConnect.execute(sqlDashList[7]),
			await oracleConnect.execute(sqlDashList[8]),
		]);
		if (result) {
			const statisticData = {};
			result.map((item) => Object.assign(statisticData, item.rows[0]));
			return res.status(200).json({ statisticData });
		}
	} catch (error) {
		console.error('GET STATISTIC DASH ERROR: ', error);
		return res.status(400).json({ message: 'failed' });
	} finally {
		oracleConnect.close();
	}
};

exports.getUserList = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const sql = `
		SELECT User_Id,
						Username,
						Account_Status,
						Lock_Date,
						Expiry_Date,
						Created,
						Default_Tablespace
		FROM Dba_Users`;
		const result = await oracleConnect.execute(sql);
		return res.status(200).json({ userList: result.rows });
	} catch (error) {
		console.error('GET USER LIST ERROR: ', error);
		return res.status(400).json({ message: 'failed' });
	} finally {
		oracleConnect.close();
	}
};

exports.getDetailUser = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { userId } = req.query;
		const sql = `
								SELECT User_Id,
											Username,
											Account_Status,
											Lock_Date,
											Expiry_Date,
											Created,
											Default_Tablespace,
											Temporary_Tablespace,
											Profile,
											Authentication_Type
								FROM Dba_Users WHERE USER_ID = ${userId}`;
		const result = await oracleConnect.execute(sql);
		if (result) return res.status(200).json({ user: result.rows[0] });
	} catch (error) {
		console.error('GET DETAIL USER ERROR: ', error);
		return res.status(400).json({ message: 'failed' });
	} finally {
		oracleConnect.close();
	}
};

exports.getSystemInitVal = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const tableSpaceList = await systemService.getTableSpaceList(oracleConnect);
		const usernameList = await systemService.getUsernameList(oracleConnect);
		const roleList = await systemService.getRoleList(oracleConnect);
		const sysPrivList = await systemService.getSysPrivList(oracleConnect);
		const userTableList = await systemService.getUserTableList(oracleConnect);
		const colTableList = await systemService.getColTabList(oracleConnect);

		return res.status(200).json({
			tableSpaceList,
			usernameList,
			roleList,
			sysPrivList,
			userTableList,
			colTableList,
		});
	} catch (error) {
		console.error('GET SYSTEM INIT VALUE ERROR: ', error);
		return res.status(400).json({ message: 'failed' });
	} finally {
		oracleConnect.close();
	}
};

exports.delUser = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { username } = req.query;
		const sql = `DROP USER "${username}" CASCADE`;
		const result = await oracleConnect.execute(sql);
		if (result) return res.status(200).json({ message: 'success' });
	} catch (error) {
		console.error('DELETE USER ERROR: ', error);
		if (error.errorNum === 1940)
			return res
				.status(400)
				.json({ message: 'Không thể xoá người dùng đang kết nối vào CSDL !' });
		return res
			.status(400)
			.json({ message: 'Xoá người dùng không thành công ! Thử lại' });
	} finally {
		oracleConnect.close();
	}
};

exports.putChangePassword = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { newPw, username, isLocked } = req.body;
		let sql =
			newPw.trim() !== ''
				? `ALTER USER "${username}" IDENTIFIED BY ${newPw} ACCOUNT ${
						isLocked ? 'LOCK' : 'UNLOCK'
				  }`
				: `ALTER USER "${username}" ACCOUNT ${isLocked ? 'LOCK' : 'UNLOCK'}`;

		const result = await oracleConnect.execute(sql);
		if (result) return res.status(200).json({ message: 'success' });
	} catch (error) {
		console.error('PUT CHANGE PASSWORD ERROR: ', error);
		return res.status(400).json({ message: 'failed' });
	} finally {
		oracleConnect.close();
	}
};

exports.postCreateUser = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { createSql, sqlList, defaultRole } = req.body;
		const createRes = await oracleConnect.execute(createSql);
		if (createRes) {
			const grantRes = await Promise.all(
				sqlList.map(async (sql, index) => {
					await oracleConnect.execute(sql);
				}),
			);

			if (grantRes) {
				if (defaultRole !== '') await oracleConnect.execute(defaultRole);
				return res.status(200).json({ message: 'success' });
			}
		}
	} catch (error) {
		console.error('POST CREATE USER ERROR: ', error);
		if (error.errorNum === 1920) {
			return res.status(409).json({
				message:
					'Đã tồn tại username hoặc role trùng tên. Hãy đổi username khác!',
			});
		}
		return res
			.status(400)
			.json({ message: 'Tạo user không thành công ! Thử lại.' });
	} finally {
		oracleConnect.close();
	}
};

exports.postCreateRole = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { createSql, sqlList } = req.body;
		const createRes = await oracleConnect.execute(createSql);
		if (createRes) {
			const grantRes = await Promise.all(
				sqlList.map(async (sql, index) => {
					await oracleConnect.execute(sql);
				}),
			);

			if (grantRes) {
				return res.status(200).json({ message: 'success' });
			}
		}
	} catch (error) {
		console.error('POST CREATE ROLE ERROR: ', error);
		if (error.errorNum === 1921) {
			return res.status(409).json({
				message:
					'Đã tồn tại username hoặc role trùng tên. Hãy đổi username khác!',
			});
		} else if (error.errorNum === 990) {
			return res
				.status(400)
				.json({ message: 'ADMIN hiện tại không đủ quyền !' });
		}
		return res
			.status(400)
			.json({ message: 'Tạo user không thành công ! Thử lại.' });
	} finally {
		oracleConnect.close();
	}
};

exports.getUserRolePriv = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { name } = req.query;

		const result = await Promise.all([
			{
				role: await oracleConnect.execute(
					`SELECT * FROM SYS.Dba_Role_Privs WHERE Grantee='${name}'`,
				),
			},
			{
				priv: await oracleConnect.execute(
					`SELECT * FROM Dba_Sys_Privs WHERE Grantee = '${name}'`,
				),
			},
			{
				table: await oracleConnect.execute(
					`SELECT Table_Name, Privilege FROM Dba_Tab_Privs WHERE Grantee = '${name}'`,
				),
			},
		]);
		if (result) {
			const roles = result[0].role.rows,
				privs = result[1].priv.rows,
				table = result[2].table.rows;

			const grantedRole = roles.map((item) => {
				return {
					roleName: item.GRANTED_ROLE,
					granted: true,
					admin: item.ADMIN_OPTION === 'NO' ? false : true,
					default: item.DEFAULT_ROLE === 'NO' ? false : true,
				};
			});

			const grantedPriv = privs.map((item) => {
				return {
					privilege: item.PRIVILEGE,
					granted: true,
					admin: item.ADMIN_OPTION === 'NO' ? false : true,
				};
			});

			let grantedTable = [];
			table.forEach((item) => {
				const { TABLE_NAME, PRIVILEGE } = item;
				const index = grantedTable.findIndex((i) => {
					return i.tableName === TABLE_NAME;
				});
				console.log(index);
				if (index === -1) {
					let obj = {
						tableName: TABLE_NAME,
						select: false,
						update: false,
						delete: false,
						insert: false,
					};
					obj[PRIVILEGE.toLowerCase()] = true;
					grantedTable.push(obj);
				} else {
					grantedTable[index][PRIVILEGE.toLowerCase()] = true;
				}
			});

			return res.status(200).json({ grantedRole, grantedPriv, grantedTable });
		}
	} catch (error) {
		console.error('GET USER ROLE PRIV ERROR: ', error);

		return res.status(400).json({ message: 'failed' });
	} finally {
		oracleConnect.close();
	}
};

exports.getBriefUserInfo = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { username } = req.query;
		const sql = `SELECT Account_Status,
		Default_Tablespace,
		Temporary_Tablespace,Editions_Enabled
		FROM Dba_Users WHERE Username='${username}'`;
		const result = await oracleConnect.execute(sql);
		if (result) {
			const data = result.rows[0];
			return res.status(200).json({
				isLocked: data.ACCOUNT_STATUS === 'OPEN' ? false : true,
				defaultTableSpace: data.DEFAULT_TABLESPACE,
				tempTableSpace: data.TEMPORARY_TABLESPACE,
				isEdition: data.EDITIONS_ENABLED === 'N' ? false : true,
			});
		}
	} catch (error) {
		console.error('GET BRIEF USER INFO ERROR:', error);
		return res.status(400).json({ message: false });
	} finally {
		oracleConnect.close();
	}
};

exports.putEditUserRole = async (req, res, next) => {
	const oracleConnect = await oracle.connect(
		res.locals.user,
		res.locals.password,
	);
	try {
		const { sqlList } = req.body;
		const editRes = await Promise.all(
			sqlList.map(async (sql, index) => {
				await oracleConnect.execute(sql);
			}),
		);
		if (editRes) {
			return res.status(200).json({ message: 'success' });
		}
	} catch (error) {
		return res.status(400).json({ message: 'Chỉnh sửa user/role thất bại !' });
	} finally {
		oracleConnect.close();
	}
};
