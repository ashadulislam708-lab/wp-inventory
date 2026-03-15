import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "~/redux/features/authSlice";
import dashboardReducer from "~/redux/features/dashboardSlice";
import productReducer from "~/redux/features/productSlice";
import orderReducer from "~/redux/features/orderSlice";
import userReducer from "~/redux/features/userSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  products: productReducer,
  orders: orderReducer,
  users: userReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
