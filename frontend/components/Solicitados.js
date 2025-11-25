/**
 * @file This file contains all components related to the "Solicitados" tab.
 * This includes fetching orders that have been requested, displaying them in a list,
 * and providing a modal to register a payment against an order.
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
    Select,
    Input,
    FormField,
    Loader,
} from '@airtable/blocks/ui';
import { METODOS_PAGO_TABLE_NAME, PAGOS_TABLE_NAME, PEDIDOS_TABLE_NAME } from '../constants';

/**
 * A modal dialog for registering a payment for a specific order.
 * It allows selecting a payment method and amount, and includes conditional
 * fields based on the chosen payment type.
 * @param {object} props The component props.
 * @param {Airtable.Record} props.pedido The order record for which the payment is being made.
 * @param {Function} props.onClose The function to call when the modal should be closed.
 * @returns {React.ReactElement} The rendered payment modal.
 */
function PagarPedidoModal({ pedido, onClose }) {
    const base = useBase();
    const metodosPagoTable = base.getTableByName(METODOS_PAGO_TABLE_NAME);
    const pagosTable = base.getTableByName(PAGOS_TABLE_NAME);

    const metodosPagoRecords = useRecords(metodosPagoTable);

    // State for the payment form
    const [metodoPagoId, setMetodoPagoId] = useState(null);
    const [abono, setAbono] = useState('');
    const [quienPago, setQuienPago] = useState(null);
    const [referencia, setReferencia] = useState('');
    const [tarjeta, setTarjeta] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [payments, setPayments] = useState([]);

    /**
     * @property {object[]} metodoPagoOptions - A memoized list of payment methods
     * formatted for the Select component.
     */
    const metodoPagoOptions = useMemo(() => {
        if (!metodosPagoRecords) return [];
        return metodosPagoRecords.map(r => ({ value: r.id, label: r.name }));
    }, [metodosPagoRecords]);

    // Find the full record for the selected payment method.
    const selectedMetodo = useMemo(() => {
        if (!metodoPagoId || !metodosPagoRecords) return null;
        return metodosPagoRecords.find(r => r.id === metodoPagoId);
    }, [metodoPagoId, metodosPagoRecords]);

    // Get the type (e.g., 'Efectivo') of the selected payment method to show conditional fields.
    const metodoType = selectedMetodo ? selectedMetodo.getCellValueAsString('TIPO') : null;

    const totalCosto = pedido.getCellValue('Total Costo Pedido') || 0;
    const alreadyPaid = pedido.getCellValue('Monto Compilación (de Pagos)') || 0;
    const addedPaymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(totalCosto - alreadyPaid - addedPaymentsTotal, 0);

    const resetForm = () => {
        setMetodoPagoId(null);
        setAbono('');
        setQuienPago(null);
        setReferencia('');
        setTarjeta('');
    };

    const handleAddPayment = () => {
        const amount = parseFloat(abono);
        if (!metodoPagoId || !amount || amount <= 0) {
            alert('Please select a payment method and enter a valid amount.');
            return;
        }
        const adjustedAmount = amount > remaining ? remaining : amount;
        const newPayment = {
            metodoId: metodoPagoId,
            amount: adjustedAmount,
            quienPago: metodoType === 'Efectivo' ? quienPago : null,
            referencia: metodoType === 'Vales' ? referencia : null,
            tarjeta: metodoType === 'Transferencia' ? tarjeta : null,
        };
        setPayments(prev => [...prev, newPayment]);
        resetForm();
    };

    const handleRemovePayment = (index) => {
        setPayments(prev => prev.filter((_, idx) => idx !== index));
    };

    /**
     * Handles saving the payment record. It validates the form and creates a new
     * record in the "Pagos" table with the relevant details.
     */
    const handleSave = async () => {
        if (payments.length === 0) {
            alert('Please add at least one payment.');
            return;
        }
        setIsSubmitting(true);
        try {
            for (const payment of payments) {
                const pagoRecord = {
                    'Pedido': [{ id: pedido.id }],
                    'Método de Pago Admin': [{ id: payment.metodoId }],
                    'Abono': payment.amount,
                    'ID Pago': `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                };
                if (payment.quienPago) pagoRecord['Quién Realizó Pago'] = { name: payment.quienPago };
                if (payment.referencia) pagoRecord['Número de Referencia'] = payment.referencia;
                if (payment.tarjeta) pagoRecord['Tarjeta de Débito'] = payment.tarjeta;
                await pagosTable.createRecordAsync(pagoRecord);
            }
            const newPaidTotal = alreadyPaid + addedPaymentsTotal;
            const newRemaining = Math.max(totalCosto - newPaidTotal, 0);
            let newStatus;
            if (newRemaining <= 0) {
                newStatus = 'Pagado';
            } else if (newPaidTotal > 0) {
                newStatus = 'Pago Incompleto';
            } else {
                newStatus = 'Pendiente de Pago';
            }
            await base.getTableByName(PEDIDOS_TABLE_NAME).updateRecordAsync(pedido.id, { 'Estatus': { name: newStatus } });
            onClose(); // Close the modal on success.
        } catch (error) {
            console.error(`Error saving payment:`, error);
            alert(`Error saving payment: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show a loader inside the dialog while payment methods are loading.
    if (!metodosPagoRecords) return <Dialog onClose={onClose}><Loader/></Dialog>;

    return (
        <Dialog onClose={onClose} width="500px">
            <Box padding={3}>
                <Button icon="x" onClick={onClose} aria-label="Close" style={{position: 'absolute', top: '10px', right: '10px'}} />
                <Heading>Realizar Pago para Pedido {pedido.getCellValueAsString('No. de Pedido')}</Heading>
                <Text marginBottom={2}>Restante: ${remaining.toFixed(2)} (Pagado: ${alreadyPaid.toFixed(2)} / Total: ${totalCosto.toFixed(2)})</Text>
                
                <FormField label="Método de Pago">
                    <Select options={metodoPagoOptions} value={metodoPagoId} onChange={setMetodoPagoId} />
                </FormField>
                <FormField label="Abono">
                    <Input type="number" value={abono} onChange={e => setAbono(e.target.value)} />
                </FormField>

                {/* Conditional fields based on payment type */}
                {metodoType === 'Efectivo' && (
                    <FormField label="Quién Realizó Pago">
                        <Select options={[{value: 'CANA', label: 'CANA'}, {value: 'NASL', label: 'NASL'}]} value={quienPago} onChange={setQuienPago} />
                    </FormField>
                )}
                {metodoType === 'Vales' && (
                    <FormField label="Número de Referencia">
                        <Input value={referencia} onChange={e => setReferencia(e.target.value)} />
                    </FormField>
                )}
                {metodoType === 'Transferencia' && (
                    <FormField label="Tarjeta de Débito">
                        <Input value={tarjeta} onChange={e => setTarjeta(e.target.value)} />
                    </FormField>
                )}

                <Box display="flex" justifyContent="flex-end" marginTop={2}>
                    <Button onClick={handleAddPayment} variant="secondary" disabled={remaining === 0 || isSubmitting}>
                        Agregar pago
                    </Button>
                </Box>

                {payments.length > 0 && (
                    <Box marginTop={3} border="default" borderRadius="large" padding={2}>
                        <Heading size="small">Pagos por registrar</Heading>
                        {payments.map((p, idx) => {
                            const metodo = metodosPagoRecords && metodosPagoRecords.find(r => r.id === p.metodoId);
                            return (
                                <Box key={`${p.metodoId}-${idx}`} display="flex" alignItems="center" justifyContent="space-between" paddingY={1}>
                                    <Text>{metodo ? metodo.name : 'Método'}</Text>
                                    <Text>${p.amount.toFixed(2)}</Text>
                                    <Button icon="x" size="small" onClick={() => handleRemovePayment(idx)} />
                                </Box>
                            );
                        })}
                    </Box>
                )}

                <Box display="flex" justifyContent="flex-end" marginTop={3}>
                    <Button onClick={onClose} marginRight={2}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={isSubmitting || payments.length === 0}>
                        {isSubmitting ? 'Saving...' : 'Guardar pagos'}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}


/**
 * The main view for the "Solicitados" tab.
 * It displays a list of requested or sent orders, showing their payment status.
 * @param {object} props The component props.
 * @param {Airtable.Record[]} props.pedidos An array of order records.
 * @returns {React.ReactElement} The rendered tab content.
 */
function SolicitadosTab({ pedidos }) {
    const [payingPedido, setPayingPedido] = useState(null);
    const [estatusFilter, setEstatusFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
    const [marcaFilter, setMarcaFilter] = useState('all');

    const uniqueEstatus = useMemo(() => {
        const values = new Set();
        pedidos.forEach(p => {
            const est = p.getCellValueAsString('Estatus');
            if (est) values.add(est);
        });
        return Array.from(values);
    }, [pedidos]);

    const uniqueMonths = useMemo(() => {
        const values = new Set();
        pedidos.forEach(p => {
            const fechaStr = p.getCellValueAsString('Fecha Pedido');
            const monthVal = fechaStr ? fechaStr.slice(0, 7) : null;
            if (monthVal) values.add(monthVal);
        });
        return Array.from(values);
    }, [pedidos]);

    const uniqueMarcas = useMemo(() => {
        const values = new Set();
        pedidos.forEach(p => {
            const marca = p.getCellValueAsString('MARCA');
            if (marca) values.add(marca);
        });
        return Array.from(values);
    }, [pedidos]);

    const filteredPedidos = useMemo(() => {
        return pedidos.filter(p => {
            const est = p.getCellValueAsString('Estatus');
            const fechaStr = p.getCellValueAsString('Fecha Pedido');
            const monthVal = fechaStr ? fechaStr.slice(0, 7) : null;
            const marca = p.getCellValueAsString('MARCA');
            const matchesEstatus = estatusFilter === 'all' || est === estatusFilter;
            const matchesMonth = monthFilter === 'all' || monthVal === monthFilter;
            const matchesMarca = marcaFilter === 'all' || marca === marcaFilter;
            return matchesEstatus && matchesMonth && matchesMarca;
        });
    }, [pedidos, estatusFilter, monthFilter, marcaFilter]);

    if (pedidos.length === 0) {
        return <Text>No orders found with status &quot;Solicitado&quot; or &quot;Enviado&quot;.</Text>;
    }

    return (
        <Box>
            {/* The payment modal is rendered here but only visible when `payingPedido` is set. */}
            {payingPedido && <PagarPedidoModal pedido={payingPedido} onClose={() => setPayingPedido(null)} />}

            <Box display="flex" marginBottom={2} alignItems="center">
                <Select
                    options={[{ value: 'all', label: 'Estatus: Todos' }, ...uniqueEstatus.map(v => ({ value: v, label: v }))]}
                    value={estatusFilter}
                    onChange={setEstatusFilter}
                    marginRight={2}
                />
                <Select
                    options={[{ value: 'all', label: 'Mes: Todos' }, ...uniqueMonths.map(v => ({ value: v, label: v }))]}
                    value={monthFilter}
                    onChange={setMonthFilter}
                    marginRight={2}
                />
                <Select
                    options={[{ value: 'all', label: 'Marca: Todas' }, ...uniqueMarcas.map(v => ({ value: v, label: v }))]}
                    value={marcaFilter}
                    onChange={setMarcaFilter}
                />
            </Box>

            {/* Table Header */}
            <Box display="flex" borderBottom="thick" paddingY={2} fontWeight="strong">
                <Text flex="1 1 25%">No. de Pedido</Text>
                <Text flex="1 1 25%">MARCA</Text>
                <Text flex="1 1 25%">Monto Pagado</Text>
                <Text flex="1 1 25%">Costo Total</Text>
                <Box width="100px" />
            </Box>

            {/* Table Body */}
            {filteredPedidos.map(pedido => {
                const paid = pedido.getCellValue('Monto Compilación (de Pagos)') || 0;
                const total = pedido.getCellValue('Total Costo Pedido') || 0;
                const status = pedido.getCellValueAsString('Estatus');
                const needsPayment = status !== 'Pagado' && total - paid > 0;
                return (
                    <Box key={pedido.id} display="flex" alignItems="center" paddingY={2} borderBottom="default">
                        <Text flex="1 1 25%">{pedido.getCellValueAsString('No. de Pedido')}</Text>
                        <Text flex="1 1 25%">{pedido.getCellValueAsString('MARCA')}</Text>
                        <Text flex="1 1 25%">${paid.toFixed(2)}</Text>
                        <Text flex="1 1 25%">${total.toFixed(2)}</Text>
                        <Box width="100px" display="flex" justifyContent="center">
                            {needsPayment && <Button variant="primary" onClick={() => setPayingPedido(pedido)}>Pagar</Button>}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

/**
 * A wrapper component that fetches all "Pedidos" records and filters them
 * to find those with a "Solicitado" or "Enviado" status.
 * @returns {React.ReactElement} The rendered SolicitadosTab or a Loader.
 */
function SolicitadosWrapper() {
    const base = useBase();
    const pedidosTable = base.getTableByName(PEDIDOS_TABLE_NAME);
    // Explicitly define the fields to fetch for performance optimization.
    const allRecords = useRecords(pedidosTable, {fields: ["No. de Pedido", "MARCA", "Monto Compilación (de Pagos)", "Total Costo Pedido", "Estatus", "Fecha Pedido"]});

    /**
     * @property {Airtable.Record[]} solicitados - A memoized list of records filtered
     * by "Solicitado" or "Enviado" status.
     */
    const solicitados = useMemo(() => {
        if (!allRecords) return [];
        const validStatuses = ["Solicitado", "Enviado", "Pendiente de Pago", "Pago Incompleto", "Pagado"];
        return allRecords.filter(r => validStatuses.includes(r.getCellValueAsString('Estatus')));
    }, [allRecords]);

    if (!allRecords) return <Loader />;
    
    return <SolicitadosTab pedidos={solicitados} />;
}

export default SolicitadosWrapper;
