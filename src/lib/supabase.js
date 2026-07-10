import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ─── Contacts (clientes sin cuenta) ──────────────────────────────────────────

export const contactService = {
  async list(search = '') {
    let query = supabase.from('contacts').select('*').order('full_name')
    if (search) query = query.ilike('full_name', `%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async get(id) {
    const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase.from('contacts').insert(payload).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw error
  },

  async mergeIntoProfile(contactId, profileId) {
    const { error } = await supabase.rpc('merge_contact_into_profile', {
      p_contact_id: contactId,
      p_profile_id: profileId,
    })
    if (error) throw error
  },
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export const profileService = {
  async get(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async list(search = '') {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('full_name')
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async update(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.rpc('delete_profile', { p_profile_id: id })
    if (error) throw error
  },
}

// ─── Bicycles ────────────────────────────────────────────────────────────────

export const bicycleService = {
  async listByCustomer(customerId) {
    const { data, error } = await supabase
      .from('bicycles')
      .select('*')
      .eq('customer_id', customerId)
      .order('brand')
    if (error) throw error
    return data
  },

  async listByContact(contactId) {
    const { data, error } = await supabase
      .from('bicycles')
      .select('*')
      .eq('contact_id', contactId)
      .order('brand')
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('bicycles')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('bicycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.rpc('delete_bicycle', { p_bicycle_id: id })
    if (error) throw error
  },
}

// ─── Work Orders ─────────────────────────────────────────────────────────────

export const workOrderService = {
  async list(filters = {}) {
    let query = supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.customerId) query = query.eq('customer_id', filters.customerId)
    if (filters.contactId) query = query.eq('contact_id', filters.contactId)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async get(id) {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        ...payload,
        status: 'received',
        customer_id: payload.customer_id || null,
        contact_id:  payload.contact_id  || null,
        bicycle_id:  payload.bicycle_id  || null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async markPaid(id, paymentMethod) {
    return this.update(id, {
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
    })
  },

  async revertPaid(id) {
    return this.update(id, {
      paid_at: null,
      payment_method: null,
    })
  },

  async delete(id) {
    const { error } = await supabase.from('work_orders').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Product Categories ───────────────────────────────────────────────────────

export const categoryService = {
  async list() {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('sort_order')
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('product_categories')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('product_categories').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const productService = {
  async list(onlyActive = false) {
    let query = supabase.from('products').select('*').order('name')
    if (onlyActive) query = query.eq('active', true)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Work Order Products ──────────────────────────────────────────────────────

export const workOrderProductService = {
  async listByOrder(workOrderId) {
    const { data, error } = await supabase
      .from('work_order_products')
      .select('*')
      .eq('work_order_id', workOrderId)
    if (error) throw error
    return data
  },

  async add(payload) {
    const { data, error } = await supabase
      .from('work_order_products')
      .insert(payload)
      .select()
      .single()
    if (error) throw error

    const { error: stockError } = await supabase.rpc('decrement_product_stock', {
      p_product_id: payload.product_id,
      p_quantity:   payload.quantity,
    })
    if (stockError) throw stockError

    return data
  },

  async remove(id) {
    const { data: entry, error: getError } = await supabase
      .from('work_order_products')
      .select('product_id, quantity')
      .eq('id', id)
      .single()
    if (getError) throw getError

    const { error } = await supabase
      .from('work_order_products')
      .delete()
      .eq('id', id)
    if (error) throw error

    const { error: stockError } = await supabase.rpc('increment_product_stock', {
      p_product_id: entry.product_id,
      p_quantity:   entry.quantity,
    })
    if (stockError) throw stockError
  },
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export const salesService = {
  async list() {
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data
  },

  async create(sale, items) {
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single()
    if (saleError) throw saleError

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(items.map((i) => ({ ...i, sale_id: saleData.id })))
    if (itemsError) throw itemsError

    for (const item of items) {
      const { error } = await supabase.rpc('decrement_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
      if (error) throw error
    }

    return saleData
  },

  async delete(id) {
    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('product_id, quantity')
      .eq('sale_id', id)
    if (itemsError) throw itemsError

    for (const item of items) {
      const { error: stockError } = await supabase.rpc('increment_product_stock', {
        p_product_id: item.product_id,
        p_quantity:   item.quantity,
      })
      if (stockError) throw stockError
    }

    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (error) throw error
  },
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const supplierService = {
  async list() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('active', true)
      .order('name')
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('suppliers')
      .update({ active: false })
      .eq('id', id)
    if (error) throw error
  },
}

// ─── Stock Entries ────────────────────────────────────────────────────────────

export const stockEntryService = {
  async list(from, to) {
    let query = supabase
      .from('stock_entries')
      .select('*')
      .order('created_at', { ascending: false })
    if (from) query = query.gte('created_at', from)
    if (to)   query = query.lte('created_at', to)
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('stock_entries')
      .insert(payload)
      .select()
      .single()
    if (error) throw error

    const { error: stockError } = await supabase.rpc('increment_product_stock', {
      p_product_id: payload.product_id,
      p_quantity:   payload.quantity,
    })
    if (stockError) throw stockError

    return data
  },

  // Registrar una compra con múltiples productos en una sola operación
  async createBatch({ supplier_id, supplier_name, notes }, items) {
    for (const item of items) {
      const total_cost = item.quantity * item.unit_cost
      const { error } = await supabase
        .from('stock_entries')
        .insert({
          product_id:   item.product_id,
          product_name: item.product_name,
          quantity:     item.quantity,
          unit_cost:    item.unit_cost,
          total_cost,
          supplier:     supplier_name || null,
          supplier_id:  supplier_id   || null,
          notes:        notes         || null,
        })
      if (error) throw error

      const { error: stockError } = await supabase.rpc('increment_product_stock', {
        p_product_id: item.product_id,
        p_quantity:   item.quantity,
      })
      if (stockError) throw stockError
    }
  },
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export const financeService = {
  async getSummary(from, to) {
    const { data: orders, error: ordersError } = await supabase
      .from('work_orders')
      .select('id, labor_cost')
      .not('paid_at', 'is', null)
      .gte('paid_at', from)
      .lte('paid_at', to)
    if (ordersError) throw ordersError

    const laborRevenue = orders.reduce((s, o) => s + (o.labor_cost ?? 0), 0)
    const orderIds = orders.map((o) => o.id)

    let productRevenue = 0
    let cogs = 0

    if (orderIds.length > 0) {
      const { data: ops, error: opsError } = await supabase
        .from('work_order_products')
        .select('subtotal, cost_price, quantity')
        .in('work_order_id', orderIds)
      if (opsError) throw opsError
      productRevenue = ops.reduce((s, op) => s + (op.subtotal ?? 0), 0)
      cogs = ops.reduce((s, op) => s + (op.cost_price ?? 0) * (op.quantity ?? 0), 0)
    }

    const revenue = laborRevenue + productRevenue
    const grossProfit = revenue - cogs

    const { data: entries, error: entriesError } = await supabase
      .from('stock_entries')
      .select('total_cost')
      .gte('created_at', from)
      .lte('created_at', to)
    if (entriesError) throw entriesError
    const purchasesCost = entries.reduce((s, e) => s + (e.total_cost ?? 0), 0)

    const { data: prods, error: prodsError } = await supabase
      .from('products')
      .select('stock, cost_price')
      .eq('active', true)
    if (prodsError) throw prodsError
    const stockValue = prods.reduce((s, p) => s + (p.stock ?? 0) * (p.cost_price ?? 0), 0)

    return {
      revenue,
      laborRevenue,
      productRevenue,
      cogs,
      grossProfit,
      purchasesCost,
      stockValue,
      orderCount: orders.length,
      entryCount: entries.length,
    }
  },
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsService = {
  async getSummary() {
    const [
      { count: totalOrders },
      { count: totalCustomers },
      { count: activeProducts },
      { count: pending },
      { count: inProgress },
      { count: ready },
    ] = await Promise.all([
      supabase.from('work_orders').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'received'),
      supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('work_orders').select('*', { count: 'exact', head: true }).eq('status', 'ready'),
    ])
    return { totalOrders, totalCustomers, activeProducts, pending, inProgress, ready }
  },
}
