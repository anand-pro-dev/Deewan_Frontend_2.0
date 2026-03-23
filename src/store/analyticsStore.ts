import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import analyticsReducer from './analyticsSlice'; // ← add this import

export const store = configureStore({
  reducer: {
    auth:      authReducer,
    analytics: analyticsReducer, // ← add this line
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;