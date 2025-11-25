/**
 * @file This file contains all components related to the "Confirmados" tab.
 * This includes fetching records that are ready for confirmation, grouping them by order,
 * displaying them in a list, and providing a modal to finalize the confirmation process.
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
    Icon,
    Loader,
    Select,
    Input,
} from '@airtable/blocks/ui';
import { LPO_TABLE_NAME, PEDIDOS_TABLE_NAME, METODOS_PAGO_TABLE_NAME, PAGOS_TABLE_NAME } from '../constants';

const brandStatus = {
    'Belcorp': 'Pendiente de Pago',
    'Betterware': 'Pendiente de Pago',
    'Cklass': 'Pendiente de Pago',
    'Andrea': 'Pagado',
    'Price Shoes': 'Pagado',
    'Bibiana': 'Pendiente de Pago',
    'Andre Badi': 'Pagado',
    'Nice': 'Pendiente de Pago',
    'Joyeria': 'Pendiente de Pago',
    'Vianney': 'Pagado',
    'Intima': 'Pagado',
    'Elefantito': 'Pagado',
    'Esquimal': 'Pagado',
    'Concord': 'Pagado',
    'Avon': 'Pendiente de Pago',
    'Otros': 'Pendiente de Pago',
};
const allowedPedidoStatuses = ['Pagado', 'Pendiente de Pago', 'Pago Incompleto'];
const allowedLineaStatuses = ['Pagado', 'Pendiente de Pago', 'Pago Incompleto'];

/**
 * A modal dialog for confirming a specific group of order lines.
 * This component creates a new "Pedido" record and updates the status
 * of the associated "Líneas de Pedido" records.
 * @param {object} props The component props.
 * @param {object} props.group The group of records to be confirmed, containing details like linea, records, and totalCosto.
 * @param {Function} props.onClose The function to call when the modal should be closed.
 * @returns {React.ReactElement} The rendered confirmation modal.
 */
function ConfirmarPedidoModal({ group, onClose }) {
    const base = useBase();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [pedidoNumero, setPedidoNumero] = useState(group.pedidoNum === 'Sin No.' ? '' : group.pedidoNum);
    const [pedidoFecha, setPedidoFecha] = useState('');
    const [costosAdicionales, setCostosAdicionales] = useState('');
    const [gastosAdicionales, setGastosAdicionales] = useState('');

    const pedidosTable = base.getTableByName(PEDIDOS_TABLE_NAME);
    const lpTable = base.getTableByName(LPO_TABLE_NAME);
    const pagosTable = base.getTableByName(PAGOS_TABLE_NAME);
    const metodosPagoTable = base.getTableByName(METODOS_PAGO_TABLE_NAME);
    const metodosPagoRecords = useRecords(metodosPagoTable);
    const [paymentMethodId, setPaymentMethodId] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [payments, setPayments] = useState([]);

    const metodoPagoOptions = useMemo(() => {
        if (!metodosPagoRecords) return [];
        return metodosPagoRecords.map(r => ({ value: r.id, label: r.name }));
    }, [metodosPagoRecords]);

    const pedidoStatusChoices = useMemo(() => {
        const field = pedidosTable.getFieldByNameIfExists('Estatus');
        return field && field.options && field.options.choices
            ? field.options.choices.map(choice => choice.name)
            : [];
    }, [pedidosTable]);

    const lineaStatusChoices = useMemo(() => {
        const field = lpTable.getFieldByNameIfExists('Estatus');
        return field && field.options && field.options.choices
            ? field.options.choices.map(choice => choice.name)
            : [];
    }, [lpTable]);

    const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const extraCost = parseFloat(costosAdicionales) || 0;
    const extraExpenses = parseFloat(gastosAdicionales) || 0;
    const totalDue = group.totalCosto + extraCost + extraExpenses;
    const remaining = Math.max(totalDue - totalPaid, 0);
    const preferredStatus = brandStatus[group.linea] || 'Pendiente de Pago';
    const canLeavePending = preferredStatus === 'Pendiente de Pago';

    const handleAddPayment = () => {
        if (!paymentMethodId) {
            alert('Selecciona un método de pago.');
            return;
        }
        const amount = parseFloat(paymentAmount);
        if (!amount || amount <= 0) {
            alert('Ingresa un monto válido.');
            return;
        }
        const adjusted = amount > remaining ? remaining : amount;
        const idPago = prompt('ID Pago (opcional)') || '';
        const fechaPago = prompt('Fecha Pago (yyyy-mm-dd, opcional)') || '';
        const descripcion = prompt('Descripción (opcional)') || '';
        const notas = prompt('Notas (opcional)') || '';
        setPayments(prev => [...prev, { methodId: paymentMethodId, amount: adjusted, idPago, fechaPago, descripcion, notas }]);
        setPaymentAmount('');
    };

    /**
     * Handles the final confirmation. Creates a new Pedido, links the LPO records,
     * and updates the LPO records' statuses based on brand-specific logic.
     */
    const handleConfirm = async () => {
        if (!pedidoNumero || !pedidoNumero.trim()) {
            alert('El número de pedido es requerido.');
            return;
        }
        if (remaining > 0 && !canLeavePending) {
            alert('Debes cubrir el total. Esta línea no permite dejar pendiente el pago.');
            return;
        }
        setIsSubmitting(true);
        try {
            const pedidoStatus = remaining > 0 ? (totalPaid > 0 ? 'Pago Incompleto' : 'Pendiente de Pago') : 'Pagado';
            const safePedidoStatus = allowedPedidoStatuses.includes(pedidoStatus) && pedidoStatusChoices.includes(pedidoStatus)
                ? pedidoStatus
                : (pedidoStatusChoices.includes('Pendiente de Pago') ? 'Pendiente de Pago' : (pedidoStatusChoices[0] || 'Pendiente de Pago'));
            const rawLineaStatus = preferredStatus || pedidoStatus;
            const safeLineaStatus = allowedLineaStatuses.includes(rawLineaStatus) && lineaStatusChoices.includes(rawLineaStatus)
                ? rawLineaStatus
                : (lineaStatusChoices.includes('Pendiente de Pago') ? 'Pendiente de Pago' : (lineaStatusChoices[0] || 'Pendiente de Pago'));
            const timestamp = new Date().toISOString();

            // 1. Create the main "Pedido" record.
            const newPedidoId = await pedidosTable.createRecordAsync({
                'No. de Pedido': pedidoNumero.trim(),
                'Estatus': { name: safePedidoStatus },
                'Fecha Pedido': pedidoFecha || null,
                'Costos Adicionales': extraCost || 0,
                'Gastos Adicionales': extraExpenses || 0,
                'Historial de Estatus': `${timestamp} - Creado y establecido a ${safePedidoStatus}`,
                'Productos': group.records.map(r => ({ id: r.id })),
            });
            
            // 2. Register payments until the due is covered or pending is allowed.
            for (const payment of payments) {
                await pagosTable.createRecordAsync({
                    'Pedido': [{ id: newPedidoId }],
                    'Método de Pago Admin': [{ id: payment.methodId }],
                    'Abono': payment.amount,
                    'ID Pago': payment.idPago || null,
                    'Fecha Pago': payment.fechaPago || null,
                    'Descripción': payment.descripcion || null,
                    'Notas': payment.notas || null,
                });
            }
            
            // 3. Update all LPO records in the group with the new status.
            await lpTable.updateRecordsAsync(group.records.map(record => ({
                id: record.id,
                fields: {
                    'Estatus': { name: safeLineaStatus },
                    'No. de Pedido': pedidoNumero.trim(),
                    'Historial de Estatus': `${record.getCellValueAsString('Historial de Estatus') || ''}${record.getCellValueAsString('Historial de Estatus') ? '\n' : ''}${timestamp} - Asignado No. de Pedido ${pedidoNumero.trim()} y cambiado a ${safeLineaStatus}`,
                },
            })));
            setSuccessData({ linea: group.linea, cantidad: group.records.length, costo: group.totalCosto });
        } catch (error) {
            console.error(`Error confirming order:`, error);
            alert(`Error confirming order: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemovePayment = (index) => {
        setPayments(prev => prev.filter((_, idx) => idx !== index));
    };

    // If the submission was successful, show a summary dialog.
    if (successData) {
        return (
            <Dialog onClose={onClose} width="400px">
                <Box display="flex" flexDirection="column" alignItems="center" padding={3}>
                    <Icon name="check" size={48} fillColor="green" />
                    <Heading>Pedido Confirmado</Heading>
                    <Text>Línea: {successData.linea}</Text>
                    <Text>Cantidad: {successData.cantidad}</Text>
                    <Text>Costo Total: ${successData.costo.toFixed(2)}</Text>
                    <Button onClick={onClose} marginTop={3} variant="primary">OK</Button>
                </Box>
            </Dialog>
        );
    }

    // Default view of the modal, showing order details and confirmation button.
    return (
        <Dialog onClose={onClose} width="600px">
            <Box padding={3}>
                <Button icon="x" onClick={onClose} aria-label="Close" style={{position: 'absolute', top: '10px', right: '10px'}} />
                <Heading>Confirmar pedido de {group.linea}</Heading>
                <Input
                    value={pedidoNumero}
                    onChange={e => setPedidoNumero(e.target.value)}
                    placeholder="No. de Pedido"
                    marginTop={2}
                />
                <Input
                    type="date"
                    value={pedidoFecha}
                    onChange={e => setPedidoFecha(e.target.value)}
                    placeholder="Fecha Pedido"
                    marginTop={2}
                />
                <Input
                    type="number"
                    value={costosAdicionales}
                    onChange={e => setCostosAdicionales(e.target.value)}
                    placeholder="Costos Adicionales"
                    marginTop={2}
                />
                <Input
                    type="number"
                    value={gastosAdicionales}
                    onChange={e => setGastosAdicionales(e.target.value)}
                    placeholder="Gastos Adicionales"
                    marginTop={2}
                />
                
                {/* Scrollable list of items in the order */}
                <Box border="default" borderRadius="large" padding={2} marginY={2} maxHeight="300px" overflowY="auto">
                     {group.records.map(record => (
                        <Box key={record.id} display="flex" justifyContent="space-between" paddingY={1}>
                            <Text width="150px" truncate>{record.getCellValueAsString('Modelo')}</Text>
                            <Text flex="1" marginX={2}>{record.getCellValueAsString('Descripción')}</Text>
                            <Text>${(record.getCellValue('Costo') || 0).toFixed(2)}</Text>
                        </Box>
                    ))}
                </Box>

                {/* Payments */}
                <Box marginTop={3}>
                    <Heading size="small" marginBottom={2}>Pagos</Heading>
                    <Box display="flex" alignItems="center" marginBottom={2}>
                        <Select
                            width="50%"
                            options={metodoPagoOptions}
                            value={paymentMethodId}
                            onChange={setPaymentMethodId}
                            placeholder="Método de Pago"
                        />
                        <Input
                            type="number"
                            width="30%"
                            marginLeft={2}
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            placeholder="Monto"
                        />
                        <Button marginLeft={2} onClick={handleAddPayment} disabled={isSubmitting || remaining === 0 || !metodoPagoOptions.length}>
                            Agregar
                        </Button>
                    </Box>
                    {payments.map((p, idx) => {
                        const metodo = metodosPagoRecords && metodosPagoRecords.find(r => r.id === p.methodId);
                        return (
                            <Box key={`${p.methodId}-${idx}`} display="flex" alignItems="center" justifyContent="space-between" paddingY={1}>
                                <Box display="flex" alignItems="center">
                                    <Text marginRight={2}>{metodo ? metodo.name : 'Método'}</Text>
                                    <Text>${p.amount.toFixed(2)}</Text>
                                </Box>
                                <Button
                                    icon="x"
                                    size="small"
                                    variant="secondary"
                                    onClick={() => handleRemovePayment(idx)}
                                    aria-label="Eliminar pago"
                                />
                            </Box>
                        );
                    })}
                    <Text marginTop={2}>Pagado: ${totalPaid.toFixed(2)} / Total: ${group.totalCosto.toFixed(2)}</Text>
                    <Text fontWeight="strong" color={remaining > 0 ? 'red' : 'green'}>
                        Restante: ${remaining.toFixed(2)}{remaining > 0 && !canLeavePending ? ' (requiere pago)' : ''}
                    </Text>
                </Box>

                <Box display="flex" justifyContent="flex-end" alignItems="center" paddingTop={3}>
                    <Heading size="small" marginRight={3}>Restante: ${remaining.toFixed(2)}</Heading>
                    <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting || (!canLeavePending && remaining > 0) || !pedidoNumero.trim()}>
                        {isSubmitting ? 'Solicitando...' : 'Solicitar'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}

/**
 * The main view for the "Confirmados" tab.
 * It groups records by order number and brand ("Línea") and displays them as cards.
 * @param {object} props The component props.
 * @param {Airtable.Record[]} props.recordsToConfirm An array of records with the status "Confirmar y Monitorear".
 * @returns {React.ReactElement} The rendered tab content.
 */
function ConfirmadosTab({ recordsToConfirm }) {
    const [confirmingGroup, setConfirmingGroup] = useState(null);
    const [viewingGroup, setViewingGroup] = useState(null);

    /**
     * @property {object[]} groupedByPedido - An array of order groups.
     * Each group object contains the order number, brand, records, and total cost.
     */
    const groupedByPedido = useMemo(() => {
        // The `reduce` function iterates over all records to group them.
        const recordsByPedido = recordsToConfirm.reduce((groups, record) => {
            const pedidoNum = record.getCellValueAsString('No. de Pedido') || 'Sin No.';
            const linea = record.getCellValueAsString('Línea');

            // Create a unique key for each group (e.g., "12345-Andrea").
            const key = `${pedidoNum}-${linea}`;
            if (!groups[key]) {
                groups[key] = {
                    pedidoNum,
                    linea,
                    records: [],
                    totalCosto: 0,
                };
            }
            // Add the record to its group and update the total cost.
            groups[key].records.push(record);
            groups[key].totalCosto += record.getCellValue('Costo') || 0;
            return groups;
        }, {});

        return Object.values(recordsByPedido);
    }, [recordsToConfirm]);

    if (recordsToConfirm.length === 0) {
        return <Text>No records found with status &quot;Confirmar y Monitorear&quot;.</Text>;
    }

    return (
        <Box>
            {/* The confirmation modal is rendered here but only visible when `confirmingGroup` is set. */}
            {confirmingGroup && <ConfirmarPedidoModal group={confirmingGroup} onClose={() => setConfirmingGroup(null)} />}
            
            {viewingGroup && (
                <Dialog onClose={() => setViewingGroup(null)} width="600px">
                    <Box padding={3}>
                        <Button icon="x" onClick={() => setViewingGroup(null)} aria-label="Close" style={{position: 'absolute', top: '10px', right: '10px'}} />
                        <Heading>Detalle de Pedido {viewingGroup.pedidoNum}</Heading>
                        <Text marginBottom={2}>Línea: {viewingGroup.linea}</Text>
                        <Box border="default" borderRadius="large" padding={2} maxHeight="350px" overflowY="auto">
                            {viewingGroup.records.map(record => (
                                <Box key={record.id} display="flex" paddingY={1} borderTop="default">
                                    <Text flex="1" truncate>{record.getCellValueAsString('Modelo')}</Text>
                                    <Text flex="2" marginX={2} truncate>{record.getCellValueAsString('Descripción')}</Text>
                                    <Text flex="1" textAlign="right">${(record.getCellValue('Costo') || 0).toFixed(2)}</Text>
                                </Box>
                            ))}
                        </Box>
                        <Box display="flex" justifyContent="flex-end" marginTop={3}>
                            <Heading size="small">Total: ${viewingGroup.totalCosto.toFixed(2)}</Heading>
                        </Box>
                    </Box>
                </Dialog>
            )}

            {groupedByPedido.map(group => (
                <Box key={`${group.pedidoNum}-${group.linea}`} padding={3} border="default" borderRadius="large" marginBottom={3}>
                    <Heading size="small">Pedido: {group.pedidoNum}</Heading>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                         <Text><Text as="span" fontWeight="strong">Línea: </Text>{group.linea}</Text>
                         <Text><Text as="span" fontWeight="strong">Suma Costo: </Text>${group.totalCosto.toFixed(2)}</Text>
                        <Box>
                            <Button marginRight={2} icon="expand" aria-label="Ver detalles" onClick={() => setViewingGroup(group)} />
                            <Button variant="primary" onClick={() => setConfirmingGroup(group)}>Solicitar</Button>
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}


/**
 * A wrapper component that fetches all "Líneas de Pedido" records and filters them
 * to find those ready for confirmation.
 * @returns {React.ReactElement} The rendered ConfirmadosTab or a Loader.
 */
function ConfirmadosWrapper() {
    const base = useBase();
    const lpoTable = base.getTableByName(LPO_TABLE_NAME);
    const allRecords = useRecords(lpoTable);

    /**
     * @property {Airtable.Record[]} recordsToConfirm - A memoized list of records filtered
     * by the "Confirmar y Monitorear" status.
     */
    const recordsToConfirm = useMemo(() => {
        if (!allRecords) return [];
        // This filter is the core logic for this component.
        return allRecords.filter(r => r.getCellValueAsString('Estatus') === 'Confirmar y Monitorear');
    }, [allRecords]);

    if (!allRecords) return <Loader />;

    return <ConfirmadosTab recordsToConfirm={recordsToConfirm} />;
}

export default ConfirmadosWrapper;
