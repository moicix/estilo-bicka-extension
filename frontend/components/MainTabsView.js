/**
 * @file This file defines the MainTabsView component, which serves as the
 * primary navigation structure of the application when no records are selected.
 * It contains the tab buttons and renders the content for the active tab.
 */

import React, { useState } from 'react';
import { Box, Button } from '@airtable/blocks/ui';
import Confirmados from './Confirmados';
import Solicitados from './Solicitados';

/**
 * Generates the style object for a tab button.
 * @param {boolean} isActive - Whether the tab is currently active.
 * @returns {object} A style object for the tab button.
 */
const tabButtonStyle = (isActive) => ({
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    color: isActive ? 'blue' : 'gray',
    // Adds a blue underline to the active tab for visual feedback.
    borderBottom: isActive ? '2px solid blue' : 'none',
});

/**
 * The main tab container for the application.
 * It manages which tab ("Confirmados" or "Solicitados") is active and displays
 * the corresponding component.
 * @returns {React.ReactElement} The rendered tab view.
 */
function MainTabsView() {
    const [activeTab, setActiveTab] = useState('confirmados');

    return (
        <>
            {/* Tab navigation buttons */}
            <Box display="flex" marginBottom={3}>
                <Button 
                    onClick={() => setActiveTab('confirmados')} 
                    size="large" 
                    style={{...tabButtonStyle(activeTab === 'confirmados'), marginRight: '0.25rem'}}
                >
                    Confirmados
                </Button>
                <Button 
                    onClick={() => setActiveTab('solicitados')} 
                    size="large" 
                    style={tabButtonStyle(activeTab === 'solicitados')}
                >
                    Solicitados
                </Button>
            </Box>

            {/* Content area for the active tab */}
            <Box flex="1" overflow="auto" border="thick" borderRadius="large" borderTopLeftRadius={0} padding={3}>
                {activeTab === 'confirmados' && <Confirmados />}
                {activeTab === 'solicitados' && <Solicitados />}
            </Box>
        </>
    );
}

export default MainTabsView;