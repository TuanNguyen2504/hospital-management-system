import { createSlice } from '@reduxjs/toolkit';

const sqlSlice = createSlice({
  name: 'sql',
  initialState: {
    createUserInfo: {
      username: '',
      password: '',
      defaultTableSpace: '',
      tempTableSpace: '',
      isLocked: false,
      isEdition: false,
    },
    createUserRoles: [],
    createRoleRoles: [],
    createUserPrivs: [],
    createRolePrivs: [],
    createRoleName: '',
    editUserRole: [],
    editName: '',
    createUserTable: [],
  },
  reducers: {
    setGrantedRoles(state, action) {
      const { roleName, columnVal, isUser } = action.payload;
      const { key, value } = columnVal;

      const list = isUser ? state.createUserRoles : state.createRoleRoles;
      const index = list.findIndex((item) => item.roleName === roleName);

      if (index === -1) {
        let newRow = {
          roleName,
          granted: false,
          admin: false,
          default: false,
        };
        newRow[key] = value;
        if (isUser) state.createUserRoles.push(newRow);
        else state.createRoleRoles.push(newRow);
      } else {
        if (isUser) state.createUserRoles[index][key] = value;
        else state.createRoleRoles[index][key] = value;
      }
    },
    resetGrantedRoles(state, action) {
      const { isUser } = action.payload;
      if (isUser) {
        state.createRoleRoles = [];
        state.createRolePrivs = [];
        state.createUserTable = [];
      } else {
        state.createUserRoles = [];
        state.createUserPrivs = [];
        state.createUserTable = [];
      }
    },
    setGrantedPrivs(state, action) {
      const { privilege, columnVal, isUser } = action.payload;
      const { key, value } = columnVal;

      const list = isUser ? state.createUserPrivs : state.createRolePrivs;
      const index = list.findIndex((item) => item.privilege === privilege);

      if (index === -1) {
        let newRow = {
          privilege,
          granted: false,
          admin: false,
        };
        newRow[key] = value;
        if (isUser) state.createUserPrivs.push(newRow);
        else state.createRolePrivs.push(newRow);
      } else {
        if (isUser) state.createUserPrivs[index][key] = value;
        else state.createRolePrivs[index][key] = value;
      }
    },
    setCreateUserInfo(state, action) {
      const { key, value } = action.payload;
      state.createUserInfo[key] = value;
    },
    setCreateRoleName(state, action) {
      state.createRoleName = action.payload;
    },
    setEditUserRole(state, action) {
      const {
        roleName,
        granted,
        admin,
        default: isDefault,
        key,
      } = action.payload;

      const isRevoke = key.toString().indexOf('revoke') !== -1;
      const list = state.editUserRole;
      const index = list.findIndex((item) => item.roleName === roleName);

      if (index === -1) {
        let newRow = {
          roleName,
          granted,
          admin,
          default: isDefault,
          isRevoke,
        };
        state.editUserRole.push(newRow);
      } else {
        state.editUserRole[index] = {
          roleName,
          granted,
          admin,
          default: isDefault,
          isRevoke,
        };
      }
    },
    setEditName(state, action) {
      state.editName = action.payload;
    },
    setCreateUserTable(state, action) {
      const { checked, tableName, key } = action.payload;
      const index = state.createUserTable.findIndex(
        (item) => item.tableName === tableName,
      );
      if (index === -1) {
        let newRow = {
          tableName,
          select: false,
          insert: false,
          update: false,
          delete: false,
          grantOption: false,
        };
        newRow[key] = checked;
        state.createUserTable.push(newRow);
      } else {
        state.createUserTable[index][key] = checked;
      }
    },
    resetCreateUserInfo(state) {
      state.createUserInfo = {
        username: '',
        password: '',
        defaultTableSpace: '',
        tempTableSpace: '',
        isLocked: false,
        isEdition: false,
      };
    },
    grantAllRole(state, action) {
      const { list, isUser } = action.payload;
      if (isUser) state.createUserRoles = list;
      else state.createRoleRoles = list;
    },
    grantAllSysPriv(state, action) {
      const { list, isUser } = action.payload;
      if (isUser) state.createUserPrivs = list;
      else state.createRolePrivs = list;
    },
    grantAllTable(state, action) {
      state.createUserTable = action.payload;
    },
    resetEditUserRole(state, action) {
      state.editUserRole = [];
    },
  },
});

const { reducer, actions } = sqlSlice;
export const {
  setGrantedRoles,
  resetGrantedRoles,
  setGrantedPrivs,
  setCreateUserInfo,
  setCreateRoleName,
  setEditUserRole,
  setEditName,
  setCreateUserTable,
  resetCreateUserInfo,
  grantAllRole,
  grantAllSysPriv,
  grantAllTable,
  resetEditUserRole,
} = actions;
export default reducer;
