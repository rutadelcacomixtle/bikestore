import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    color: '#1f2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottom: '2pt solid #1d4ed8',
    paddingBottom: 12,
  },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
  brandSub: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  receiptLabel: { fontSize: 9, color: '#6b7280', textAlign: 'right' },
  receiptNum: { fontSize: 11, fontFamily: 'Helvetica-Bold', textAlign: 'right', color: '#374151' },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    borderBottom: '0.5pt solid #e5e7eb',
    paddingBottom: 3,
  },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 110, color: '#6b7280' },
  value: { flex: 1, color: '#111827' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: '5 8',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4 8',
    borderBottom: '0.5pt solid #f3f4f6',
  },
  colProduct: { flex: 1 },
  colQty: { width: 35, textAlign: 'center' },
  colUnit: { width: 60, textAlign: 'right' },
  colTotal: { width: 65, textAlign: 'right' },
  headerText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 6,
    borderTop: '1pt solid #1d4ed8',
  },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151' },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', width: 80, textAlign: 'right' },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 8,
  },
})

const fmt = (n) =>
  `$${(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const STATUS_LABELS = {
  received: 'Recibida', in_progress: 'En proceso', ready: 'Lista', delivered: 'Entregada',
}
const PAYMENT_LABELS = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta' }

export function ReceiptPDF({ order, profile, bicycle, orderProducts, total }) {
  const date = new Date(order?.created_at).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Bike Store</Text>
            <Text style={styles.brandSub}>Taller de bicicletas</Text>
          </View>
          <View>
            <Text style={styles.receiptLabel}>Recibo de trabajo</Text>
            <Text style={styles.receiptNum}>#{order?.id?.slice(0, 8).toUpperCase()}</Text>
            <Text style={[styles.receiptLabel, { marginTop: 2 }]}>{date}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{profile?.full_name ?? '—'}</Text>
          </View>
          {profile?.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Teléfono:</Text>
              <Text style={styles.value}>{profile.phone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Bicicleta:</Text>
            <Text style={styles.value}>
              {bicycle ? `${bicycle.brand} ${bicycle.model}` : '—'}
              {bicycle?.serial_number ? ` (Serie: ${bicycle.serial_number})` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle del trabajo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Descripción:</Text>
            <Text style={styles.value}>{order?.description}</Text>
          </View>
          {order?.diagnosis && (
            <View style={styles.row}>
              <Text style={styles.label}>Diagnóstico:</Text>
              <Text style={styles.value}>{order.diagnosis}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{STATUS_LABELS[order?.status] ?? order?.status}</Text>
          </View>
          {order?.paid_at && (
            <View style={styles.row}>
              <Text style={styles.label}>Pago:</Text>
              <Text style={styles.value}>
                {new Date(order.paid_at).toLocaleDateString('es-MX')} —{' '}
                {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos y refacciones</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colProduct]}>Producto</Text>
            <Text style={[styles.headerText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.headerText, styles.colUnit]}>Precio unit.</Text>
            <Text style={[styles.headerText, styles.colTotal]}>Subtotal</Text>
          </View>
          {orderProducts.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={{ color: '#9ca3af', flex: 1, padding: 4 }}>Sin productos</Text>
            </View>
          ) : (
            orderProducts.map((op) => (
              <View key={op.id} style={styles.tableRow}>
                <Text style={styles.colProduct}>{op.product_name}</Text>
                <Text style={styles.colQty}>{op.quantity}</Text>
                <Text style={styles.colUnit}>{fmt(op.unit_price)}</Text>
                <Text style={styles.colTotal}>{fmt(op.subtotal)}</Text>
              </View>
            ))
          )}
          <View style={styles.tableRow}>
            <Text style={[styles.colProduct, { color: '#374151' }]}>Mano de obra</Text>
            <Text style={styles.colQty}>1</Text>
            <Text style={styles.colUnit}>{fmt(order?.labor_cost)}</Text>
            <Text style={styles.colTotal}>{fmt(order?.labor_cost)}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </View>

        <Text style={styles.footer}>
          Gracias por su preferencia · Bike Store
        </Text>
      </Page>
    </Document>
  )
}
