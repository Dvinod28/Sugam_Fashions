import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  activeMenu: "overview",
  notifications: 3,
};

export const DashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    closeMobileSidebar(state) {
      state.mobileSidebarOpen = false;
    },
    setActiveMenu(state, action) {
      state.activeMenu = action.payload;
    },
    clearNotifications(state) {
      state.notifications = 0;
    },
  },
});

export const { toggleSidebar, toggleMobileSidebar, closeMobileSidebar, setActiveMenu, clearNotifications } = DashboardSlice.actions;
export default DashboardSlice.reducer;


