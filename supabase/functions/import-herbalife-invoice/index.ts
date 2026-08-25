import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------
// Importação de Nota Fiscal Eletrônica (NF-e) de compra de
// produtos Herbalife para controle de estoque.
//
// Recebe o XML parseado no frontend, valida se a nota já foi
// importada, cria produtos automaticamente se necessário
// (com flag pending_catalog_data), e registra os movimentos
// de entrada no estoque.
//
// A saída automática acontece via trigger do banco (não aqui).
// ------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      nfe_key,
      nfe_number,
      issue_date,
      total_value,
      total_freight,
      raw_xml,
      items,
    } = body

    // Validação básica dos campos obrigatórios
    if (!nfe_key || !nfe_number || !issue_date || !raw_xml || !Array.isArray(items)) {
      throw new Error('Dados incompletos: campos obrigatórios ausentes')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Sessão inválida')

    const { data: trainer, error: trainerErr } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (trainerErr || !trainer) throw new Error('Treinador não encontrado para este usuário')

    const trainerId = trainer.id

    // Verificar se nota já foi importada anteriormente
    const { data: existingInvoice, error: checkErr } = await supabaseAdmin
      .from('herbalife_invoices')
      .select('id')
      .eq('nfe_key', nfe_key)
      .maybeSingle()
    
    if (checkErr) throw checkErr
    if (existingInvoice) {
      return new Response(
        JSON.stringify({ error: 'Esta nota fiscal já foi importada anteriormente.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Inserir cabeçalho da nota fiscal
    const { data: invoice, error: invoiceErr } = await supabaseAdmin
      .from('herbalife_invoices')
      .insert({
        trainer_id: trainerId,
        nfe_key,
        nfe_number,
        issue_date,
        total_value,
        total_freight: total_freight ?? 0,
        raw_xml,
      })
      .select('id')
      .single()
    
    if (invoiceErr) throw invoiceErr
    const invoiceId = invoice.id

    // Processar cada item da nota
    const newProductsCreated: Array<{ sku: string; name: string }> = []
    let itemsProcessed = 0

    for (const item of items) {
      const { cprod, xprod, qty, unit_value, freight_value, total_value: item_total } = item

      // Calcular SKU candidato (remover sufixo "BR" se houver)
      let skuCandidate = cprod?.trim() || ''
      if (skuCandidate.toUpperCase().endsWith('BR')) {
        skuCandidate = skuCandidate.slice(0, -2)
      }

      if (!skuCandidate || !xprod) {
        // Item inválido, pular (não abortar tudo)
        continue
      }

      // Buscar produto existente pelo SKU
      const { data: existingProduct, error: prodSearchErr } = await supabaseAdmin
        .from('supplements')
        .select('id')
        .eq('sku', skuCandidate)
        .maybeSingle()
      
      if (prodSearchErr) throw prodSearchErr

      let supplementId: string

      if (existingProduct) {
        supplementId = existingProduct.id
      } else {
        // Criar produto automaticamente com flag pending_catalog_data
        const { data: newProduct, error: newProdErr } = await supabaseAdmin
          .from('supplements')
          .insert({
            sku: skuCandidate,
            name: xprod.trim(),
            brand: 'Herbalife',
            serving_size_g: 0,
            pending_catalog_data: true,
          })
          .select('id')
          .single()
        
        if (newProdErr) {
          // Se falhar ao criar produto, pular este item (não abortar tudo)
          console.error(`Erro ao criar produto ${skuCandidate}:`, newProdErr)
          continue
        }

        supplementId = newProduct.id
        newProductsCreated.push({ sku: skuCandidate, name: xprod.trim() })
      }

      // Inserir item da nota fiscal
      const { data: invoiceItem, error: itemErr } = await supabaseAdmin
        .from('herbalife_invoice_items')
        .insert({
          invoice_id: invoiceId,
          supplement_id: supplementId,
          cprod: cprod?.trim() || '',
          xprod: xprod.trim(),
          qty: qty ?? 0,
          unit_value: unit_value ?? 0,
          freight_value: freight_value ?? 0,
          total_value: item_total ?? 0,
        })
        .select('id')
        .single()
      
      if (itemErr) {
        console.error(`Erro ao inserir item da nota:`, itemErr)
        continue
      }

      // Buscar doses_per_package para calcular quantidade do movimento
      const { data: pricing, error: pricingErr } = await supabaseAdmin
        .from('herbalife_pricing')
        .select('doses_per_package')
        .eq('supplement_id', supplementId)
        .maybeSingle()
      
      if (pricingErr) throw pricingErr

      // Calcular quantidade para o movimento de estoque:
      // Se tem doses_per_package > 0, converte para doses
      // Senão, usa a quantidade bruta (unidades inteiras)
      const dosesPerPackage = pricing?.doses_per_package ?? null
      let movementQuantity: number
      
      if (dosesPerPackage !== null && dosesPerPackage > 0) {
        movementQuantity = qty * dosesPerPackage
      } else {
        movementQuantity = qty
      }

      // Registrar movimento de entrada no estoque
      const { error: movementErr } = await supabaseAdmin
        .from('herbalife_stock_movements')
        .insert({
          trainer_id: trainerId,
          supplement_id: supplementId,
          movement_type: 'entrada_nf',
          quantity: movementQuantity,
          source_invoice_item_id: invoiceItem.id,
        })
      
      if (movementErr) {
        console.error(`Erro ao registrar movimento de estoque:`, movementErr)
        continue
      }

      itemsProcessed++
    }

    return new Response(
      JSON.stringify({
        invoiceId,
        itemsProcessed,
        newProductsCreated,
        totalValue: total_value,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[import-herbalife-invoice] erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
