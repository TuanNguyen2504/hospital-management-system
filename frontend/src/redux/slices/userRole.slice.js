import { createSlice } from '@reduxjs/toolkit';

const userRole = createSlice({
  name: 'userRole',
  initialState: {
    editedUserInfo: {
      defaultTableSpace: '',
      tempTableSpace: '',
      isLocked: false,
      isEdition: false,
    },
    grantedPriv: [],
    grantedRole: [],
    grantedTable: [],
  },
  reducers: {
    setEditedUserInfo(state, action) {
      state.editedUserInfo = action.payload;
    },
    setGrantedInit(state, action) {
      state.grantedPriv = action.payload.grantedPriv;
      state.grantedRole = action.payload.grantedRole;
      state.grantedTable = action.payload.grantedTable;
    },
  },
});

const { reducer, actions } = userRole;
export const { setEditedUserInfo, setGrantedInit } = actions;
export default reducer;
