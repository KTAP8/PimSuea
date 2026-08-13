const { supabase, supabaseAdmin, getAuthenticatedSupabase } = require('../config/supabaseClient');
const { calculatePrice, getDeliveryFee, lookupAddonPrice } = require('../utils/pricing');
const { isUUID, isPositiveInt } = require('../utils/validate');
const { copyObject, getLocationFromUrl, getPublicUrl } = require('../config/r2Client');
const { getSizesByProductIds } = require('../utils/sizes');
const { consentStamp } = require('../constants/legal');
const { persistProfileConsentIfNeeded } = require('../utils/consent');
const {
  GIFT_SERVICE_CODE,
  normalizeGiftRecipient,
  validateGiftRecipient,
  validateGiftMessage,
  formatGiftRecipientForClient,
} = require('../utils/gift');

exports.getUserOrders = async (req, res) => {
  const userId = req.user.id;
  // Use authenticated client to respect RLS
  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    const { data: orders, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          is_gift,
          gift_message,
          addon_code,
          addon_fee_thb,
          gift_recipient:gift_recipients (
            full_name,
            phone,
            address_line1,
            address_line2,
            province,
            district,
            postal_code
          ),
          user_design:user_designs (
            design_name,
            preview_image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match frontend interface
    const formattedOrders = orders.map(order => ({
        ...order,
        items: order.order_items ? order.order_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.unit_price,
            product_name: item.user_design?.design_name || 'Custom Design',
            image: item.user_design?.preview_image_url,
            is_gift: item.is_gift,
            gift_message: item.gift_message,
            addon_code: item.addon_code,
            addon_fee_thb: item.addon_fee_thb,
            gift_recipient: formatGiftRecipientForClient(item.gift_recipient),
        })) : []
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

exports.getOrderDetails = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    const { data: order, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price,
          is_gift,
          gift_message,
          addon_code,
          addon_fee_thb,
          gift_recipient:gift_recipients (
            full_name,
            phone,
            address_line1,
            address_line2,
            province,
            district,
            postal_code
          ),
          user_design:user_designs (
            design_name,
            preview_image_url
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
         if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Order not found' });
        }
        throw error;
    }

    const formattedOrder = {
        ...order,
        total: order.total_amount, // Alias if frontend expects 'total' in some places, but interface says total_amount
        items: order.order_items ? order.order_items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.unit_price,
            product_name: item.user_design?.design_name || 'Custom Design',
            image: item.user_design?.preview_image_url,
            is_gift: item.is_gift,
            gift_message: item.gift_message,
            addon_code: item.addon_code,
            addon_fee_thb: item.addon_fee_thb,
            gift_recipient: formatGiftRecipientForClient(item.gift_recipient),
        })) : []
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

/**
 * Shared coupon validation helper — fetches the coupon, checks all constraints,
 * and returns { coupon } on success or throws an Error with a Thai message.
 */
async function fetchAndValidateCoupon(code, userId) {
  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, discount_type, discount_value, max_discount_thb, max_uses_per_user, max_total_uses, max_qty, expires_at, is_active, allowed_printing_types')
    .eq('code', code)
    .maybeSingle();

  if (error) throw error;
  if (!coupon || !coupon.is_active) throw new Error('ไม่พบรหัสโค้ดนี้ หรือโค้ดถูกปิดใช้งานแล้ว');
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error('รหัสโค้ดนี้หมดอายุแล้ว');

  if (coupon.max_total_uses != null) {
    const { count } = await supabaseAdmin
      .from('coupon_usages')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id);
    if ((count ?? 0) >= coupon.max_total_uses) throw new Error('โค้ดนี้ถูกใช้ครบจำนวนแล้ว');
  }

  if (coupon.max_uses_per_user != null) {
    const { count: userCount } = await supabaseAdmin
      .from('coupon_usages')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId);
    if ((userCount ?? 0) >= coupon.max_uses_per_user) throw new Error('คุณใช้รหัสโค้ดนี้ครบจำนวนแล้ว');
  }

  return coupon;
}

/**
 * Calculate the discount amount given a validated coupon, the product subtotal,
 * and the total shirt quantity in the order.
 */
function computeCouponDiscount(coupon, subtotal, totalQty) {
  const applicableQty = (coupon.max_qty != null) ? Math.min(totalQty, coupon.max_qty) : totalQty;
  const fraction = totalQty > 0 ? applicableQty / totalQty : 0;
  const discountableSubtotal = subtotal * fraction;

  let discount;
  if (coupon.discount_type === 'percentage') {
    const raw = discountableSubtotal * (Number(coupon.discount_value) / 100);
    discount = (coupon.max_discount_thb != null) ? Math.min(raw, Number(coupon.max_discount_thb)) : raw;
  } else {
    discount = Math.min(Number(coupon.discount_value), discountableSubtotal);
  }
  return Math.round(discount * 100) / 100;
}

exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { items, shipping } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  if (!shipping || typeof shipping !== 'object' || Array.isArray(shipping)) {
    return res.status(400).json({ error: 'ข้อมูลที่อยู่จัดส่งไม่ครบถ้วน' });
  }

  for (const item of items) {
    if (!isPositiveInt(item.quantity)) {
      return res.status(400).json({ error: 'quantity ต้องเป็นจำนวนเต็มบวก' });
    }
  }

  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    // Step 1a: Fetch all design data and color names in parallel
    const itemDesignData = await Promise.all(items.map(async (item) => {
      const designId = (item.designId && item.designId !== 'custom') ? item.designId : null;
      if (!designId) return { item, design: null };
      const { data: design } = await supabaseAdmin
        .from('user_designs')
        .select('print_dimensions, printing_type, base_product_id')
        .eq('id', designId)
        .single();
      return { item, design: design ?? null };
    }));

    const productIds = itemDesignData.map(({ item, design }) =>
      item.productId || item.product_id || design?.base_product_id
    ).filter(Boolean);
    const sizesByProduct = await getSizesByProductIds(productIds);

    for (const { item, design } of itemDesignData) {
      const productId = item.productId || item.product_id || design?.base_product_id;
      if (!productId) {
        return res.status(400).json({ error: 'ไม่พบสินค้าสำหรับรายการในตะกร้า' });
      }
      const allowed = sizesByProduct.get(productId);
      if (!allowed?.size || !allowed.has(item.size)) {
        return res.status(400).json({ error: `size "${item.size}" ไม่ถูกต้องสำหรับสินค้านี้` });
      }
    }

    const dtfDesign = itemDesignData.find(({ design }) => design?.printing_type === 'DTF');
    if (dtfDesign) {
      return res.status(400).json({
        error: 'DTF printing is no longer available. Please create a new design with DTG.',
      });
    }

    const colorIds = [...new Set(items.map(i => i.color_id || i.color).filter(Boolean))];
    const colorEntries = await Promise.all(colorIds.map(async (id) => {
      const { data } = await supabaseAdmin.from('colors').select('name').eq('id', id).single();
      return [id, data?.name ?? null];
    }));
    const colorMap = new Map(colorEntries);

    // Step 1b: Build grouped quantity maps (same logic as frontend repriceAll)
    // shirt group: base_product_id:color_id → combined qty
    // print group: designId → combined qty
    const shirtGroupQty = new Map();
    const printGroupQty = new Map();
    for (const { item, design } of itemDesignData) {
      if (!design) continue;
      const colorId = item.color_id || item.color;
      shirtGroupQty.set(
        `${design.base_product_id}:${colorId}`,
        (shirtGroupQty.get(`${design.base_product_id}:${colorId}`) ?? 0) + item.quantity
      );
      printGroupQty.set(item.designId, (printGroupQty.get(item.designId) ?? 0) + item.quantity);
    }

    // Step 1c: Calculate per-item price using grouped quantities and per-side summing
    const pricedItems = await Promise.all(itemDesignData.map(async ({ item, design }) => {
      const designId = (item.designId && item.designId !== 'custom') ? item.designId : null;

      const printingType = design?.printing_type ?? null;

      if (!designId || !design) {
        console.warn(`Order item has no design_id; using client price: ${item.price}`);
        return { ...item, verifiedUnitPrice: item.price, printingType };
      }

      const colorId = item.color_id || item.color;
      const color_name = colorMap.get(colorId);
      if (!color_name) {
        console.warn(`Color '${colorId}' not priceable; using client price`);
        return { ...item, verifiedUnitPrice: item.price, printingType };
      }

      const dims = design.print_dimensions;
      if (!dims || typeof dims !== 'object' || !design.printing_type) {
        console.warn(`Design ${designId} missing dims/printing_type; using client price`);
        return { ...item, verifiedUnitPrice: item.price, printingType };
      }

      const entries = Object.entries(dims).filter(([, d]) => d.w > 0 && d.h > 0);
      if (entries.length === 0) {
        console.warn(`Design ${designId} has no valid print sides; using client price`);
        return { ...item, verifiedUnitPrice: item.price, printingType };
      }

      const shirt_qty = shirtGroupQty.get(`${design.base_product_id}:${colorId}`) ?? item.quantity;
      const print_qty = printGroupQty.get(designId) ?? item.quantity;

      try {
        // Per-side pricing: shirt counted once (from first side), print summed across all sides
        const sideResults = await Promise.all(entries.map(([, d]) => calculatePrice({
          printingType: design.printing_type,
          aabb_w_cm: d.w,
          aabb_h_cm: d.h,
          quantity: item.quantity,
          shirt_qty,
          print_qty,
          productId: design.base_product_id,
          color_name,
          size: item.size,
        })));
        const verifiedUnitPrice = sideResults[0].shirt_per_unit
          + sideResults.reduce((s, r) => s + r.print_per_unit, 0);
        return { ...item, verifiedUnitPrice, printingType };
      } catch (priceErr) {
        console.warn(`Pricing lookup failed for design ${designId}: ${priceErr.message}; using client price`);
        return { ...item, verifiedUnitPrice: item.price, printingType };
      }
    }));

    const verifiedItemsTotal = pricedItems.reduce(
      (sum, item) => sum + item.verifiedUnitPrice * item.quantity,
      0
    );

    // Gift Service add-on: validate and price per gifted line (flat fee, includes recipient shipping)
    let giftAddonPrice = null;
    const giftLineCount = pricedItems.filter((item) => Boolean(item.is_gift)).length;
    if (giftLineCount > 0) {
      try {
        giftAddonPrice = await lookupAddonPrice(GIFT_SERVICE_CODE);
      } catch (giftPriceErr) {
        return res.status(400).json({ error: giftPriceErr.message || 'บริการของขวัญไม่พร้อมให้บริการในขณะนี้' });
      }
    }

    const giftEnrichedItems = [];
    for (const item of pricedItems) {
      if (!item.is_gift) {
        giftEnrichedItems.push({
          ...item,
          gift_message: null,
          normalizedRecipient: null,
          addon_code: null,
          addon_fee_thb: 0,
        });
        continue;
      }

      try {
        const normalizedRecipient = normalizeGiftRecipient(item.gift_recipient ?? item.giftRecipient);
        validateGiftRecipient(normalizedRecipient);
        const giftMessage = validateGiftMessage(item.gift_message ?? item.giftMessage);
        giftEnrichedItems.push({
          ...item,
          gift_message: giftMessage,
          normalizedRecipient,
          addon_code: giftAddonPrice.code,
          addon_fee_thb: giftAddonPrice.price_thb,
        });
      } catch (giftErr) {
        return res.status(400).json({ error: giftErr.message });
      }
    }

    const addonFeesTotal = giftEnrichedItems.reduce((sum, item) => sum + (item.addon_fee_thb ?? 0), 0);

    // Delivery fee applies only to non-gift quantity (gift shipping included in add-on fee)
    const nonGiftQty = giftEnrichedItems
      .filter((item) => !item.is_gift)
      .reduce((sum, item) => sum + item.quantity, 0);
    const { fee: deliveryFee } = nonGiftQty > 0 ? await getDeliveryFee(nonGiftQty) : { fee: 0 };

    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    // Apply coupon discount (server-side, product subtotal only)
    let discountAmount = 0;
    let appliedCouponCode = null;
    let appliedCouponId = null;
    if (req.body.coupon_code && typeof req.body.coupon_code === 'string') {
      const code = req.body.coupon_code.trim().toUpperCase();
      try {
        const coupon = await fetchAndValidateCoupon(code, userId);
        // Filter items by allowed_printing_types if the coupon restricts them
        let couponSubtotal = verifiedItemsTotal;
        let couponQty = totalQty;
        if (coupon.allowed_printing_types && coupon.allowed_printing_types.length > 0) {
          const allowedTypes = coupon.allowed_printing_types.map(t => t.toLowerCase());
          const filteredItems = pricedItems.filter(
            item => item.printingType && allowedTypes.includes(item.printingType.toLowerCase())
          );
          couponSubtotal = filteredItems.reduce((s, item) => s + item.verifiedUnitPrice * item.quantity, 0);
          couponQty = filteredItems.reduce((s, item) => s + item.quantity, 0);
        }
        discountAmount = computeCouponDiscount(coupon, couponSubtotal, couponQty);
        appliedCouponCode = code;
        appliedCouponId = coupon.id;
      } catch (couponErr) {
        // Coupon invalid at order time — reject the order so the user knows
        return res.status(400).json({ error: couponErr.message });
      }
    }

    const grandTotal = verifiedItemsTotal + addonFeesTotal - discountAmount + deliveryFee;
    const legalStamp = consentStamp();

    // 2. Create Order with server-verified total (items + delivery - discount)
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: grandTotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        coupon_code: appliedCouponCode,
        status: 'pending_payment',
        shipping_address: shipping,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...legalStamp,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Copy print files from draft bucket → permanent ordered bucket
    const itemsWithCopiedFiles = await Promise.all(giftEnrichedItems.map(async (item) => {
      if (!item.print_file_url) return item;

      let urlMap = {};
      try { urlMap = JSON.parse(item.print_file_url); }
      catch { urlMap = { front: item.print_file_url }; }

      const copiedMap = {};
      await Promise.all(Object.entries(urlMap).map(async ([side, url]) => {
        const loc = getLocationFromUrl(url);
        if (!loc || loc.bucket !== 'print-files') {
          copiedMap[side] = url;
          return;
        }
        try {
          await copyObject(loc.bucket, loc.key, 'print-files-ordered', loc.key);
          copiedMap[side] = getPublicUrl('print-files-ordered', loc.key);
        } catch (e) {
          console.warn('Could not copy print file to ordered bucket:', loc.key, e.message);
          copiedMap[side] = url;
        }
      }));

      return { ...item, print_file_url: JSON.stringify(copiedMap) };
    }));

    // 4. Create shipments and order items
    const hasBuyerItems = itemsWithCopiedFiles.some((item) => !item.is_gift);
    let buyerShipmentId = null;

    if (hasBuyerItems) {
      const { data: buyerShipment, error: buyerShipErr } = await client
        .from('order_shipments')
        .insert({
          order_id: order.id,
          kind: 'buyer',
          hide_prices: false,
        })
        .select('id')
        .single();
      if (buyerShipErr) {
        await client.from('orders').delete().eq('id', order.id);
        throw buyerShipErr;
      }
      buyerShipmentId = buyerShipment.id;
    }

    for (const item of itemsWithCopiedFiles) {
      let shipmentId = buyerShipmentId;
      let giftRecipientId = null;

      if (item.is_gift) {
        const { data: recipientRow, error: recipientErr } = await client
          .from('gift_recipients')
          .insert({
            collected_by_user_id: userId,
            ...item.normalizedRecipient,
          })
          .select('id')
          .single();
        if (recipientErr) {
          await client.from('orders').delete().eq('id', order.id);
          throw recipientErr;
        }
        giftRecipientId = recipientRow.id;

        const { data: giftShipment, error: giftShipErr } = await client
          .from('order_shipments')
          .insert({
            order_id: order.id,
            kind: 'gift',
            gift_recipient_id: giftRecipientId,
            hide_prices: true,
          })
          .select('id')
          .single();
        if (giftShipErr) {
          await client.from('orders').delete().eq('id', order.id);
          throw giftShipErr;
        }
        shipmentId = giftShipment.id;
      }

      const { error: lineErr } = await client.from('order_items').insert({
        order_id: order.id,
        user_design_id: (item.designId && item.designId !== 'custom') ? item.designId : null,
        size: item.size,
        color: item.color_id || item.color,
        quantity: item.quantity,
        unit_price: item.verifiedUnitPrice,
        print_file_url: item.print_file_url,
        is_gift: Boolean(item.is_gift),
        gift_message: item.gift_message,
        gift_recipient_id: giftRecipientId,
        addon_code: item.addon_code,
        addon_fee_thb: item.addon_fee_thb ?? 0,
        shipment_id: shipmentId,
      });
      if (lineErr) {
        await client.from('orders').delete().eq('id', order.id);
        throw lineErr;
      }
    }

    // Record coupon usage (admin client bypasses RLS)
    if (appliedCouponId) {
      await supabaseAdmin.from('coupon_usages').insert({
        coupon_id: appliedCouponId,
        user_id: userId,
        order_id: order.id,
        discount_applied: discountAmount,
      });
    }

    // Account-level consent: record if missing, or if published ToS is newer than last accept
    await persistProfileConsentIfNeeded(userId, legalStamp);

    res.status(201).json({ message: 'Order created successfully', orderId: order.id });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

exports.updateOrder = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { shipping_address } = req.body;

  if (!isUUID(id) && !isPositiveInt(id)) {
    return res.status(400).json({ error: 'ID ไม่ถูกต้อง' });
  }

  const client = getAuthenticatedSupabase(req.headers.authorization);

  try {
    // 1. Fetch current order to check status
    const { data: order, error: fetchError } = await client
        .from('orders')
        .select('status, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (fetchError || !order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Validate Status
    const editableStatuses = ['pending_payment', 'pending', 'paid_processing'];
    if (!editableStatuses.includes(order.status)) {
        return res.status(400).json({ error: 'Order cannot be edited in its current status' });
    }

    // 3. Update Order
    const { error: updateError } = await client
        .from('orders')
        .update({ 
            shipping_address, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('user_id', userId);

    if (updateError) throw updateError;

    res.json({ message: 'Order updated successfully' });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
};
