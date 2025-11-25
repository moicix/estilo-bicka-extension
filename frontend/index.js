/**
 * @file This is the main entry point for the Airtable block.
 * It initializes the block and renders the top-level React component.
 */

import React, { useState } from 'react';
import {
    initializeBlock,
    useLoadable,
    useWatchable,
    useCursor,
    Box,
} from '@airtable/blocks/ui';
import SelectionSummaryView from './components/SelectionSummaryView';
import MainTabsView from './components/MainTabsView';

/**
 * The main application component.
 * This component acts as a router, displaying either the `SelectionSummaryView`
 * if records are selected in the grid, or the `MainTabsView` otherwise.
 * @returns {React.ReactElement} The rendered top-level component.
 */
function OrderManagementApp() {
    // It's important to load the cursor information before using it.
    useLoadable(useCursor());
    const cursor = useCursor();

    // State to hold the list of selected record IDs.
    const [selectedRecordIds, setSelectedRecordIds] = useState(cursor.selectedRecordIds);

    // This hook watches for changes in the grid selection and updates the state.
    // This makes the block reactive to user actions in the Airtable UI.
    useWatchable(cursor, ['selectedRecordIds'], () => {
        setSelectedRecordIds(cursor.selectedRecordIds);
    });

    return (
        <Box padding={3} height="100vh" display="flex" flexDirection="column">
            {/* Conditional rendering based on whether any records are selected */}
            {selectedRecordIds.length > 0 ? (
                <SelectionSummaryView selectedRecordIds={selectedRecordIds} cursor={cursor} />
            ) : (
                <MainTabsView />
            )}
        </Box>
    );
}

// Initialize the block with the main component.
initializeBlock(() => <OrderManagementApp />);