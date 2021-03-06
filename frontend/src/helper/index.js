import { Menu, Select } from 'antd';
import constant from 'constant';
import React from 'react';
import { Link } from 'react-router-dom';
const { SubMenu } = Menu;
const { Option } = Select;

// fn: Render menu 1 cấp sub menu
function renderMenu(menu = []) {
  return (
    menu.length &&
    menu.map((item, index) => {
      const { isSubMenu, title, icon } = item;

      // if exist sub menu
      return isSubMenu ? (
        <SubMenu key={index} icon={icon} title={title}>
          {item.list.map((listItem, listIndex) => (
            <Menu.Item key={`${index}${listIndex}`}>
              <Link to={listItem.to}>{listItem.title}</Link>
            </Menu.Item>
          ))}
        </SubMenu>
      ) : (
        <Menu.Item key={index} icon={icon}>
          <Link to={item.to}>{title}</Link>
        </Menu.Item>
      );
    })
  );
}

// fn: chuyển đổi keyItem sang text
function convertModalKeyItem(key = 'admin') {
  switch (key) {
    case 'admin':
      return 'Danh sách Quản trị viên';
    case 'doctor':
      return 'Danh sách Bác sĩ';
    case 'financial':
      return 'Danh sách nhân viên tài vụ';
    case 'receptionist':
      return 'Danh sách tiếp tân';
    case 'pharmacist':
      return 'Danh sách nhân viên bán thuốc';
    case 'accounting':
      return 'Danh sách nhân viên kế toán';
    default:
      return 'Danh sách Quản trị viên';
  }
}

// fn: phân tích role dựa theo role list
function analystRole(roles) {
  if (!roles) return 'default';

  for (let i = 0; i < roles.length; ++i) {
    for (let k in constant.ROLES) {
      if (roles[i].toLowerCase() === constant.ROLES[k].toLowerCase()) {
        return roles[i].toLowerCase();
      }
    }
  }

  return 'default';
}

// fn: format date
function formateDate(dateInput = new Date()) {
  const date = new Date(dateInput);
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
}

// fn: render option select antd with only value array
function renderOptions(optionList = [], isRole = false) {
  return optionList.map((item, key) => (
    <Option key={`${item}${key}`} value={isRole ? `${item} (ROLE)` : item}>
      {isRole ? `${item} (ROLE)` : item}
    </Option>
  ));
}

// fn : chuyển đổi mảng granted role thành sql query
function convertRoleSql(roles = [], username = '', type = 0, isRole = false) {
  let sqlList = [],
    sqlDefaultGrant = '';
  roles.forEach((item, index) => {
    const { roleName, granted, admin, default: isDefault } = item;
    if (granted) {
      sqlList.push(
        `GRANT "${roleName}" TO ${isRole ? username : `"${username}"`}${
          admin ? ' WITH ADMIN OPTION' : ''
        }`,
      );
    }
    if (isDefault) {
      if (sqlDefaultGrant === '')
        sqlDefaultGrant = `ALTER USER "${username}" DEFAULT ROLE "${roleName}"`;
      else sqlDefaultGrant += `,"${roleName}"`;
    }
  });
  if (sqlDefaultGrant !== '') {
    if (type === 0) {
      sqlList.push(sqlDefaultGrant);
      return sqlList;
    } else {
      return { sqlList, defaultRole: sqlDefaultGrant };
    }
  } else {
    if (type === 0) return sqlList;
    return { sqlList, defaultRole: '' };
  }
}

// fn: chuyển đổi mảng granted, revoke
function convertGrantRevoke(roles = [], username = '', isRole = false) {
  let sqlList = [];
  roles.forEach((item, index) => {
    const { roleName, granted, admin, isRevoke } = item;
    if (granted && isRevoke === false) {
      sqlList.push(
        `GRANT "${roleName}" TO ${isRole ? username : `"${username}"`}${
          admin ? ' WITH ADMIN OPTION' : ''
        }`,
      );
    }

    if (!granted && isRevoke) {
      sqlList.push(
        `REVOKE "${roleName}" FROM ${isRole ? username : `"${username}"`}`,
      );
    }
  });
  return sqlList;
}

// fn : chuyển đổi mảng granted role thành sql query
function convertPrivSql(privs = [], username = '', isRole = false) {
  let sqlList = [];
  privs.forEach((item, index) => {
    const { privilege, granted, admin } = item;
    if (granted) {
      sqlList.push(
        `GRANT ${privilege} TO ${isRole ? username : `"${username}"`}${
          admin ? ' WITH ADMIN OPTION' : ''
        }`,
      );
    }
  });

  return sqlList;
}

// fn: chuyển đổi created user info
function convertCreateUserInfo(userInfo) {
  const {
    username,
    password,
    defaultTableSpace,
    tempTableSpace,
    isLocked,
    isEdition,
  } = userInfo;
  return `CREATE USER "${username}" IDENTIFIED BY "${
    password !== '' ? password : 'null'
  }" ${
    defaultTableSpace !== '' ? `DEFAULT TABLESPACE "${defaultTableSpace}"` : ''
  } ${
    tempTableSpace !== '' ? `TEMPORARY TABLESPACE "${tempTableSpace}"` : ''
  } ACCOUNT ${isLocked ? 'LOCK' : 'UNLOCK'} ${
    isEdition ? 'ENABLE EDITIONS' : ''
  }`;
}

// fn : Chuyển đổi table privilege
function convertTablePrivilege(list = [], name, isRole = false) {
  let sqlList = [];
  list.forEach((item) => {
    const {
      tableName,
      select,
      delete: isDelete,
      insert,
      update,
      grantOption,
    } = item;
    if (!select && !isDelete && !update && !insert) {
    } else {
      let sql = `GRANT${select ? ' SELECT' : ''}${update ? ', UPDATE' : ''}${
        insert ? ', INSERT' : ''
      }${isDelete ? ' , DELETE' : ''} ON ${tableName.toUpperCase()} TO ${
        isRole ? name : `"${name}"`
      }${grantOption ? ' WITH GRANT OPTION' : ''}`;

      sqlList.push(sql.replace('GRANT,', 'GRANT'));
    }
  });
  return sqlList;
}

// fn : convert alter user/role
function convertAlterUserRole(username, userInfo) {
  const { password, defaultTableSpace, tempTableSpace, isLocked, isEdition } =
    userInfo;

  return `ALTER USER "${username}"${
    password !== '' ? ` IDENTIFIED BY "${password}"` : ''
  }${
    defaultTableSpace !== '' ? ` DEFAULT TABLESPACE "${defaultTableSpace}"` : ''
  }${tempTableSpace !== '' ? ` TEMPORARY TABLESPACE "${tempTableSpace}"` : ''}${
    isLocked ? ' ACCOUNT LOCK' : ' ACCOUNT UNLOCK'
  }${isEdition ? ' ENABLE EDITIONS' : ''}`;
}

export default {
  renderMenu,
  convertModalKeyItem,
  analystRole,
  formateDate,
  renderOptions,
  convertRoleSql,
  convertPrivSql,
  convertCreateUserInfo,
  convertGrantRevoke,
  convertTablePrivilege,
  convertAlterUserRole,
};
