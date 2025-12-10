import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Product, Component, Recipe, SalesEvent, ProductionHistory } from './database.types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (data) setProducts(data);
    setLoading(false);
  }

  return { products, loading, reload: loadProducts };
}

export function useComponents() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComponents();
  }, []);

  async function loadComponents() {
    const { data } = await supabase
      .from('components')
      .select('*')
      .order('category, type');
    if (data) setComponents(data);
    setLoading(false);
  }

  return { components, loading, reload: loadComponents };
}

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProduct(id);
  }, [id]);

  async function loadProduct(productId: string) {
    const [productResult, recipeResult] = await Promise.all([
      supabase.from('products').select('*').eq('id', productId).maybeSingle(),
      supabase.from('recipes').select('*').eq('product_id', productId).maybeSingle()
    ]);

    if (productResult.data) setProduct(productResult.data);
    if (recipeResult.data) setRecipe(recipeResult.data);
    setLoading(false);
  }

  return { product, recipe, loading, reload: () => id && loadProduct(id) };
}

export function useSalesEvents(month?: string) {
  const [events, setEvents] = useState<SalesEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [month]);

  async function loadEvents() {
    let query = supabase.from('sales_events').select('*').order('event_date', { ascending: false });

    if (month) {
      const startDate = `${month}-01`;
      const endDate = new Date(month + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      query = query.gte('event_date', startDate).lt('event_date', endDate.toISOString().split('T')[0]);
    }

    const { data } = await query;
    if (data) setEvents(data);
    setLoading(false);
  }

  return { events, loading, reload: loadEvents };
}

export function useProductionHistory(productId?: string) {
  const [history, setHistory] = useState<ProductionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [productId]);

  async function loadHistory() {
    let query = supabase.from('production_history').select('*').order('production_date', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data } = await query;
    if (data) setHistory(data);
    setLoading(false);
  }

  return { history, loading, reload: loadHistory, refresh: loadHistory };
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    lowStockItems: 0,
    totalProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [salesResult, productsResult] = await Promise.all([
      supabase.from('sales_events').select('total_revenue'),
      supabase.from('products').select('current_stock')
    ]);

    const totalRevenue = salesResult.data?.reduce((sum, e) => sum + Number(e.total_revenue), 0) || 0;
    const products = productsResult.data || [];
    const lowStockItems = products.filter(p => p.current_stock < 15).length;

    setStats({
      totalRevenue,
      totalSales: salesResult.data?.length || 0,
      lowStockItems,
      totalProducts: products.length
    });
    setLoading(false);
  }

  return { stats, loading };
}
