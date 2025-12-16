// src/context/ThemeContext.js
import React, { createContext, useContext, useState } from 'react';

// 1. Create the Context
const ThemeContext = createContext();

// 2. Create a Provider Component
export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = (value) => {
        setIsDarkMode(value);
    };

    // Define colors for easy access
    const theme = {
        isDarkMode,
        toggleTheme,
        colors: isDarkMode ? {
            background: '#000000',
            card: '#1C1C1E',
            text: '#FFFFFF',
            subText: '#AAAAAA',
            border: '#333333',
            tint: '#5A8AE4'
        } : {
            background: '#FFFFFF',
            card: '#FFFFFF',
            text: '#000000',
            subText: '#666666',
            border: '#F0F0F0',
            tint: '#5A8AE4'
        }
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

// 3. Custom Hook for easy access
export const useTheme = () => useContext(ThemeContext);