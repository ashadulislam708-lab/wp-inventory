import { combineReducers } from '@reduxjs/toolkit';
import userReducer from '~/redux/features/userSlice';
import counterReducer from '~/redux/features/counterSlice';

const rootReducer = combineReducers({
  user: userReducer,
  counter: counterReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;