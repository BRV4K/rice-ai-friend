import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    gender: 'подруга',
    talkativeness: 8,
    sensitivity: 3,
    enthusiasm: 7,
    boldness: 4,
    humor: 6,
    argumentativeness: 2,
    interests: ['кино', 'музыка', 'искусство'],
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        updateSettings: (state, action) => {
            return { ...state, ...action.payload };
        },
    },
});

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;