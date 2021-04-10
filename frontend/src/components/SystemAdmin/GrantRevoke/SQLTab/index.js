import helper from 'helper';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';
import './index.scss';

function SQLTab({ isUser, isEdit }) {
  const {
    createUserRoles,
    createUserPrivs,
    createUserInfo,
    createRoleName,
    createRoleRoles,
    createRolePrivs,
    editUserRole,
    editName,
  } = useSelector((state) => state.sql);

  const { username } = useSelector((state) => state.user);
  return (
    <div className="sa-grant-content sql-grant">
      {isUser && isEdit === false ? (
        <>
          {/* create user/role */}
          {createUserInfo.username !== '' && (
            <>
              <h3 className="sql-grant-title">------ CREATE USER: </h3>
              <p className="sql-grant-code create">
                {helper.convertCreateUserInfo(createUserInfo)}
              </p>
            </>
          )}
          {/* granted roles */}
          {createUserRoles.length > 0 && (
            <>
              <h3 className="sql-grant-title">------ GRANTED ROLES: </h3>
              {helper
                .convertRoleSql(createUserRoles, username)
                .map((item, key) => (
                  <p key={key} className="sql-grant-code granted-roles">
                    {item};
                  </p>
                ))}
            </>
          )}
          {/* system privileges */}
          {createUserPrivs.length > 0 && (
            <>
              <h3 className="sql-grant-title">------ SYSTEM PRIVILEGES: </h3>
              {helper
                .convertPrivSql(createUserPrivs, username)
                .map((item, key) => (
                  <p key={key} className="sql-grant-code sys-privs">
                    {item};
                  </p>
                ))}
            </>
          )}
        </>
      ) : (
        <>
          {createRoleName !== '' && (
            <>
              <h3 className="sql-grant-title">------ CREATE ROLE: </h3>
              <p className="sql-grant-code create">
                {`CREATE ROLE ${createRoleName};`}
              </p>
            </>
          )}
          {/* granted roles */}
          {createRoleRoles.length > 0 && (
            <>
              <h3 className="sql-grant-title">------ GRANTED ROLES: </h3>
              {helper
                .convertRoleSql(createRoleRoles, createRoleName)
                .map((item, key) => (
                  <p key={key} className="sql-grant-code granted-roles">
                    {item};
                  </p>
                ))}
            </>
          )}
          {/* system privileges */}
          {createRolePrivs.length > 0 && (
            <>
              <h3 className="sql-grant-title">------ SYSTEM PRIVILEGES: </h3>
              {helper
                .convertPrivSql(createRolePrivs, createRoleName)
                .map((item, key) => (
                  <p key={key} className="sql-grant-code sys-privs">
                    {item};
                  </p>
                ))}
            </>
          )}
        </>
      )}

      {isEdit && (
        <>
          {/* granted/revoke roles */}
          {editUserRole.length > 0 && (
            <>
              <h3 className="sql-grant-title">------ GRANTED/REVOKE ROLES: </h3>
              {helper
                .convertGrantRevoke(editUserRole, editName)
                .map((item, key) => (
                  <p key={key} className="sql-grant-code granted-roles">
                    {item};
                  </p>
                ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

SQLTab.propTypes = {
  isUser: PropTypes.bool,
  isEdit: PropTypes.bool,
};
SQLTab.defaultProps = {
  isUser: true,
  isEdit: false,
};

export default SQLTab;
