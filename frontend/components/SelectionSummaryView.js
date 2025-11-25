/**
 * @file This file defines the SelectionSummaryView component, which is displayed
 * when a user selects one or more records in the main Airtable grid view.
 * It provides a summary of the selected records and allows the user to perform
 * a bulk confirmation action.
 */

import React, { useState, useMemo } from 'react';
import {
    useBase,
    useRecords,
    Box,
    Button,
    Dialog,
    Heading,
    Text,
    Loader,
} from '@airtable/blocks/ui';
import { LPO_TABLE_NAME } from '../constants';

/**
 * A view that summarizes the currently selected records from the grid.
 * It calculates the total cost of "Abierto" records and provides a button
 * to confirm them, changing their status.
 * @param {object} props The component props.
 * @param {string[]} props.selectedRecordIds An array of IDs for the records selected in the grid.
 * @param {object} props.cursor The Airtable cursor object to interact with grid selection.
 * @returns {React.ReactElement} The rendered SelectionSummaryView component.
 */
function SelectionSummaryView({ selectedRecordIds, cursor }) {
    const base = useBase();
    const lpoTable = base.getTableByName(LPO_TABLE_NAME);
    const selectedRecords = useRecords(lpoTable, { recordIds: selectedRecordIds });
    const visibleRecords = useMemo(() => {
        if (!selectedRecords) return null;
        return selectedRecords.filter(record => selectedRecordIds.includes(record.id));
    }, [selectedRecords, selectedRecordIds]);

    const [isUpdating, setIsUpdating] = useState(false);
    const [successInfo, setSuccessInfo] = useState(null);

    /**
     * @property {object} summary
     * @property {number} summary.totalCost - The summed "Costo" of all open records.
     * @property {number} summary.count - The number of open records.
     * @property {Airtable.Record[]} summary.openRecords - An array of the actual open record objects.
     */
    const { totalCost, count, openRecords, nonOpenRecords } = useMemo(() => {
        if (!visibleRecords) {
            return { totalCost: 0, count: 0, openRecords: [], nonOpenRecords: [] };
        }
        const recordsToConfirm = visibleRecords.filter(r => r.getCellValueAsString('Estatus') === 'Abierto');
        const cost = recordsToConfirm.reduce((sum, record) => sum + (record.getCellValue('Costo') || 0), 0);
        const blockedRecords = visibleRecords.filter(r => r.getCellValueAsString('Estatus') !== 'Abierto');
        return { totalCost: cost, count: recordsToConfirm.length, openRecords: recordsToConfirm, nonOpenRecords: blockedRecords };
    }, [visibleRecords]);

    /**
     * Handles the action of confirming the selected "Abierto" records.
     * It updates their "Estatus" field and clears the user's selection in the grid.
     */
    const handleConfirmSelection = async () => {
        if (openRecords.length === 0) {
            const blockedCount = nonOpenRecords.length;
            const blockedMsg = blockedCount > 0 ? ` ${blockedCount} record(s) skipped because they are not in "Abierto".` : '';
            alert(`No records with status "Abierto" are selected.${blockedMsg}`);
            return;
        }
        if (nonOpenRecords.length > 0) {
            alert(`${nonOpenRecords.length} record(s) will be skipped because they are not in "Abierto".`);
        }
        setIsUpdating(true);
        try {
            const timestamp = new Date().toISOString();
            const updates = openRecords.map(record => ({
                id: record.id,
                fields: {
                    'Estatus': { name: 'Confirmar y Monitorear' },
                    'Historial de Estatus': `${record.getCellValueAsString('Historial de Estatus') || ''}${record.getCellValueAsString('Historial de Estatus') ? '\n' : ''}${timestamp} - Confirmar y Monitorear`,
                },
            }));
            await lpoTable.updateRecordsAsync(updates);
            setSuccessInfo({ count: updates.length, totalCost });
            clearSelection();
        } catch (error) {
            console.error('Error updating records:', error);
            alert(`Error updating records: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const clearSelection = () => {
        if (cursor && cursor.setSelectedRecordIds) {
            cursor.setSelectedRecordIds([]);
        }
    };

    // Show a loader while the selected record data is being fetched.
    if (!visibleRecords) {
        return <Loader />;
    }

    return (
        <Box border="thick" borderRadius="large" padding={3} backgroundColor="lightGray1">
            {successInfo && (
                <Dialog
                    onClose={() => {
                        setSuccessInfo(null);
                        clearSelection();
                    }}
                    width="400px"
                >
                    <Box padding={3} display="flex" flexDirection="column" alignItems="center">
                        <Heading>Confirmado</Heading>
                        <Text>{successInfo.count} record(s) updated to &quot;Confirmar y Monitorear&quot;.</Text>
                        <Text>Total Cost: ${successInfo.totalCost.toFixed(2)}</Text>
                        <Button
                            marginTop={3}
                            variant="primary"
                            onClick={() => {
                                setSuccessInfo(null);
                                clearSelection();
                            }}
                        >
                            OK
                        </Button>
                    </Box>
                </Dialog>
            )}
            <Heading>Selection Summary</Heading>
            <Text>{selectedRecordIds.length} record(s) selected in view.</Text>
            <Text>Found {count} record(s) with &quot;Abierto&quot; status.</Text>
            <Text fontWeight="strong">Total Cost to Confirm: ${totalCost.toFixed(2)}</Text>
            <Box marginTop={3} border="default" borderRadius="large" overflow="hidden">
                <Box display="flex" paddingY={2} paddingX={3} backgroundColor="lightGray2" fontWeight="strong">
                    <Text flex="1 1 20%">No. de Pedido</Text>
                    <Text flex="1 1 20%">Línea</Text>
                    <Text flex="1 1 20%">Modelo</Text>
                    <Text flex="2 1 30%">Descripción</Text>
                    <Text flex="1 1 10%" textAlign="right">Costo</Text>
                </Box>
                {openRecords.length === 0 ? (
                    <Box paddingY={3} paddingX={3}>
                        <Text>No records with status &quot;Abierto&quot; in the current selection.</Text>
                    </Box>
                ) : (
                    openRecords.map(record => (
                        <Box key={record.id} display="flex" paddingY={2} paddingX={3} borderTop="default">
                            <Text flex="1 1 20%" truncate>{record.getCellValueAsString('No. de Pedido') || 'Sin No.'}</Text>
                            <Text flex="1 1 20%" truncate>{record.getCellValueAsString('Línea')}</Text>
                            <Text flex="1 1 20%" truncate>{record.getCellValueAsString('Modelo')}</Text>
                            <Text flex="2 1 30%" truncate>{record.getCellValueAsString('Descripción')}</Text>
                            <Text flex="1 1 10%" textAlign="right">${(record.getCellValue('Costo') || 0).toFixed(2)}</Text>
                        </Box>
                    ))
                )}
            </Box>
            <Button 
                marginTop={3} 
                variant="primary" 
                onClick={handleConfirmSelection} 
                disabled={isUpdating || count === 0}
            >
                {isUpdating ? 'Confirming...' : 'Confirmar Pedido'}
            </Button>
        </Box>
    );
}

export default SelectionSummaryView;
