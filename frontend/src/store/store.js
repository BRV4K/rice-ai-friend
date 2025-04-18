// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
    reducer: {
        settings: settingsReducer,
        chat: chatReducer,
    },
});