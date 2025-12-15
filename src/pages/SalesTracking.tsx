import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, X, Edit2, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { useSalesEvents } from '../lib/hooks';
import { supabase } from '../lib/supabase';
import type { SalesEvent } from '../lib/database.types';
import type { ToastType } from '../components/Toast';
import AddSaleModal from '../components/AddSaleModal';
import EditSaleModal from '../components/EditSaleModal';

interface SalesTrackingProps {
  showToast?: (type: ToastType, message: string) => void;
}

interface AnalyticsData {
  totalUnits: number;
  totalRevenue: number;
  avgPerMarket: number;
  marketDays: number;
  productBreakdown: { name: string; units: number; revenue: number }[];
  salesTrend: { date: string; units: number; revenue: number }[];
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  bgColor: string;
}

function StatCard({ label, value, icon, bgColor }: StatCardProps) {
  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">{label}</p>
          <p className="text-xl sm:text-3xl font-bold mt-1 text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ml-2`}>
          <span className="text-lg sm:text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function SalesTracking({ showToast }: SalesTrackingProps) {
  const [viewMode, setViewMode] = useState<'sales' | 'analytics'>('sales');
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const { events, loading, reload } = useSalesEvents(selectedMonth);
  const [addSaleModalOpen, setAddSaleModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SalesEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<SalesEvent | null>(null);
  const [totalUnits, setTotalUnits] = useState(0);

  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUnits: 0,
    totalRevenue: 0,
    avgPerMarket: 0,
    marketDays: 0,
    productBreakdown: [],
    salesTrend: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const year = parseInt(selectedMonth.split('-')[0]);
  const month = parseInt(selectedMonth.split('-')[1]) - 1;

  useEffect(() => {
    loadMonthStats();
  }, [events]);

  useEffect(() => {
    if (viewMode === 'analytics') {
      loadAnalytics();
    }
  }, [viewMode, dateFilter, customStart, customEnd]);

  async function loadMonthStats() {
    if (events.length === 0) {
      setTotalUnits(0);
      return;
    }

    const eventIds = events.map(e => e.id);
    const { data: items } = await supabase
      .from('sales_items')
      .select('quantity_sold')
      .in('sales_event_id', eventIds);

    const units = items?.reduce((sum, item) => sum + item.quantity_sold, 0) || 0;
    setTotalUnits(units);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);

    let startDate = '';
    let endDate = new Date().toISOString().split('T')[0];

    const now = new Date();
    if (dateFilter === 'last7') {
      startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
    } else if (dateFilter === 'last30') {
      startDate = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
    } else if (dateFilter === 'last90') {
      startDate = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
    } else if (dateFilter === 'last180') {
      startDate = new Date(now.setDate(now.getDate() - 180)).toISOString().split('T')[0];
    } else if (dateFilter === 'thisMonth') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (dateFilter === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(lastMonthEnd.getDate()).padStart(2, '0')}`;
    } else if (dateFilter === 'ytd') {
      startDate = `${now.getFullYear()}-01-01`;
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    }

    let eventsQuery = supabase.from('sales_events').select('*');
    if (startDate) {
      eventsQuery = eventsQuery.gte('event_date', startDate).lte('event_date', endDate);
    }

    const { data: events } = await eventsQuery;
    const eventIds = events?.map(e => e.id) || [];

    let itemsQuery = supabase.from('sales_items').select('*');
    if (eventIds.length > 0) {
      itemsQuery = itemsQuery.in('sales_event_id', eventIds);
    } else if (startDate) {
      itemsQuery = itemsQuery.eq('sales_event_id', 'none');
    }

    const { data: items } = await itemsQuery;

    const totalRevenue = events?.reduce((sum, e) => sum + Number(e.total_revenue), 0) || 0;
    const totalUnits = items?.reduce((sum, i) => sum + i.quantity_sold, 0) || 0;
    const marketDays = events?.length || 0;
    const avgPerMarket = marketDays > 0 ? totalRevenue / marketDays : 0;

    const productMap = new Map<string, { units: number; revenue: number }>();
    items?.forEach(item => {
      const existing = productMap.get(item.product_name) || { units: 0, revenue: 0 };
      productMap.set(item.product_name, {
        units: existing.units + item.quantity_sold,
        revenue: existing.revenue + Number(item.subtotal)
      });
    });

    const productBreakdown = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.units - a.units);

    const salesTrend = events?.map(e => ({
      date: e.event_date,
      units: items?.filter(i => i.sales_event_id === e.id).reduce((sum, i) => sum + i.quantity_sold, 0) || 0,
      revenue: Number(e.total_revenue)
    })).sort((a, b) => a.date.localeCompare(b.date)) || [];

    setAnalyticsData({
      totalUnits,
      totalRevenue,
      avgPerMarket,
      marketDays,
      productBreakdown,
      salesTrend
    });

    setAnalyticsLoading(false);
  }

  function previousMonth() {
    const newDate = new Date(year, month - 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  }

  function nextMonth() {
    const newDate = new Date(year, month + 1);
    setSelectedMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  }

  function goToToday() {
    const today = new Date();
    setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
  }

  function getDaysInMonth() {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }

  function getEventForDate(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.find(e => e.event_date === dateStr);
  }

  const days = getDaysInMonth();
  const monthRevenue = events.reduce((sum, e) => sum + e.total_revenue, 0);
  const marketDays = events.length;
  const avgPerMarket = marketDays > 0 ? monthRevenue / marketDays : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viewMode === 'sales' ? 'Track revenue and events' : 'Performance analytics'}
          </p>
        </div>
        {viewMode === 'sales' && (
          <button
            onClick={() => setAddSaleModalOpen(true)}
            className="flex items-center gap-2 btn-primary px-4 sm:px-5"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Sale</span>
          </button>
        )}
      </div>

      <div className="card p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setViewMode('sales')}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              viewMode === 'sales'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`py-3 px-4 rounded-lg font-medium transition-all ${
              viewMode === 'analytics'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {viewMode === 'sales' ? (
        <SalesView
          events={events}
          loading={loading}
          year={year}
          month={month}
          monthNames={monthNames}
          shortMonthNames={shortMonthNames}
          previousMonth={previousMonth}
          nextMonth={nextMonth}
          goToToday={goToToday}
          getDaysInMonth={getDaysInMonth}
          getEventForDate={getEventForDate}
          days={days}
          monthRevenue={monthRevenue}
          totalUnits={totalUnits}
          marketDays={marketDays}
          avgPerMarket={avgPerMarket}
          setSelectedEvent={setSelectedEvent}
        />
      ) : (
        <AnalyticsView
          data={analyticsData}
          loading={analyticsLoading}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      )}

      {addSaleModalOpen && (
        <AddSaleModal
          onClose={() => setAddSaleModalOpen(false)}
          onSave={() => {
            reload();
            setAddSaleModalOpen(false);
            showToast?.('success', 'Sales event saved');
          }}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setEditingEvent(selectedEvent);
            setSelectedEvent(null);
          }}
        />
      )}

      {editingEvent && (
        <EditSaleModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={() => {
            reload();
            setEditingEvent(null);
            showToast?.('success', 'Sales event updated');
          }}
        />
      )}
    </div>
  );
}

interface SalesViewProps {
  events: SalesEvent[];
  loading: boolean;
  year: number;
  month: number;
  monthNames: string[];
  shortMonthNames: string[];
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
  getDaysInMonth: () => (number | null)[];
  getEventForDate: (day: number) => SalesEvent | undefined;
  days: (number | null)[];
  monthRevenue: number;
  totalUnits: number;
  marketDays: number;
  avgPerMarket: number;
  setSelectedEvent: (event: SalesEvent | null) => void;
}

function SalesView({
  events,
  year,
  month,
  monthNames,
  shortMonthNames,
  previousMonth,
  nextMonth,
  goToToday,
  days,
  monthRevenue,
  totalUnits,
  marketDays,
  avgPerMarket,
  getEventForDate,
  setSelectedEvent
}: SalesViewProps) {
  const currentDate = new Date();

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Units Sold"
          value={totalUnits.toString()}
          icon="📦"
          bgColor="bg-orange-100"
        />
        <StatCard
          label="Total Revenue"
          value={`$${monthRevenue >= 1000 ? `${(monthRevenue / 1000).toFixed(1)}k` : monthRevenue.toFixed(0)}`}
          icon="💰"
          bgColor="bg-amber-100"
        />
        <StatCard
          label="Average per Market"
          value={`$${avgPerMarket >= 1000 ? `${(avgPerMarket / 1000).toFixed(1)}k` : avgPerMarket.toFixed(0)}`}
          icon="📊"
          bgColor="bg-yellow-100"
        />
        <StatCard
          label="Market Days"
          value={marketDays.toString()}
          icon="📅"
          bgColor="bg-orange-100"
        />
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={previousMonth}
            className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-target"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
              <span className="sm:hidden">{shortMonthNames[month]} {year}</span>
              <span className="hidden sm:inline">{monthNames[month]} {year}</span>
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs sm:text-sm bg-[#1e3a5f] text-white rounded-lg active:bg-[#2a4d78] transition-colors font-medium"
            >
              Today
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-target"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="text-center font-semibold text-gray-500 text-[10px] sm:text-sm py-2 sm:py-3 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} className="aspect-square bg-gray-50/50 rounded-lg" />;
            }

            const event = getEventForDate(day);
            const hasEvent = !!event;
            const isToday = day === currentDate.getDate() &&
              month === currentDate.getMonth() &&
              year === currentDate.getFullYear();

            return (
              <button
                key={idx}
                onClick={() => hasEvent && setSelectedEvent(event)}
                disabled={!hasEvent}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center transition-all duration-150 touch-target ${
                  hasEvent
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 active:from-orange-600 active:to-orange-700 shadow-md active:scale-95'
                    : isToday
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-gray-50'
                }`}
              >
                <div className={`text-[10px] sm:text-sm font-bold ${
                  hasEvent ? 'text-white/90' : isToday ? 'text-white' : 'text-gray-700'
                }`}>
                  {day}
                </div>
                {hasEvent && (
                  <div className="text-xs sm:text-lg font-bold text-white leading-tight">
                    ${event.total_revenue >= 1000 ? `${(event.total_revenue / 1000).toFixed(1)}k` : event.total_revenue.toFixed(0)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {monthRevenue > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-600">Month Total</span>
            <span className="text-lg sm:text-xl font-bold text-orange-600">${monthRevenue.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Events This Month</h2>
        {events.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No sales events this month</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to record your first event</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full card-interactive p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">{event.event_name}</h3>
                      <span className="flex-shrink-0 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-medium rounded-full">
                        {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long'
                      })}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">
                      ${event.total_revenue.toFixed(0)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

interface AnalyticsViewProps {
  data: AnalyticsData;
  loading: boolean;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  customStart: string;
  setCustomStart: (date: string) => void;
  customEnd: string;
  setCustomEnd: (date: string) => void;
}

function AnalyticsView({
  data,
  loading,
  dateFilter,
  setDateFilter,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd
}: AnalyticsViewProps) {
  const maxUnits = Math.max(...data.productBreakdown.map(p => p.units), 1);
  const maxRevenue = Math.max(...data.salesTrend.map(t => t.revenue), 1);

  const getFilterLabel = () => {
    if (dateFilter === 'all') return 'All Time';
    if (dateFilter === 'last7') return 'Last 7 Days';
    if (dateFilter === 'last30') return 'Last 30 Days';
    if (dateFilter === 'last90') return 'Last 3 Months';
    if (dateFilter === 'last180') return 'Last 6 Months';
    if (dateFilter === 'thisMonth') return 'This Month';
    if (dateFilter === 'lastMonth') return 'Last Month';
    if (dateFilter === 'ytd') return 'Year to Date';
    if (dateFilter === 'custom') return 'Custom Range';
    return 'All Time';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <p className="text-gray-600">({getFilterLabel()})</p>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          >
            <option value="all">All Time</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 3 Months</option>
            <option value="last180">Last 6 Months</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="ytd">Year to Date</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Units Sold"
          value={data.totalUnits.toString()}
          icon="📦"
          bgColor="bg-orange-100"
        />
        <StatCard
          label="Total Revenue"
          value={`$${data.totalRevenue >= 1000 ? `${(data.totalRevenue / 1000).toFixed(1)}k` : data.totalRevenue.toFixed(0)}`}
          icon="💰"
          bgColor="bg-amber-100"
        />
        <StatCard
          label="Average per Market"
          value={`$${data.avgPerMarket >= 1000 ? `${(data.avgPerMarket / 1000).toFixed(1)}k` : data.avgPerMarket.toFixed(0)}`}
          icon="📊"
          bgColor="bg-yellow-100"
        />
        <StatCard
          label="Market Days"
          value={data.marketDays.toString()}
          icon="📅"
          bgColor="bg-orange-100"
        />
      </div>

      {data.productBreakdown.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-600 text-lg">No sales data for selected period</p>
        </div>
      ) : (
        <>
          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Units Sold per Product</h2>
            </div>

            <div className="space-y-4">
              {data.productBreakdown.map(product => (
                <div key={product.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{product.name}</span>
                    <span className="text-sm font-bold text-gray-900">{product.units} units</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(product.units / maxUnits) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Sales Trend</h2>
            </div>

            {data.salesTrend.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No sales trend data available</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-2 h-64">
                  {data.salesTrend.map(trend => (
                    <div key={trend.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-orange-200 rounded-t-lg relative" style={{ height: `${(trend.revenue / maxRevenue) * 100}%`, minHeight: '20px' }}>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                          ${trend.revenue.toFixed(0)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 text-center whitespace-nowrap">
                        {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Product Distribution</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {data.productBreakdown.map((product, idx) => {
                  const percentage = (product.units / data.totalUnits) * 100;
                  const colors = [
                    'bg-orange-500',
                    'bg-amber-500',
                    'bg-yellow-500',
                    'bg-orange-400',
                    'bg-amber-400',
                    'bg-yellow-400',
                    'bg-orange-300'
                  ];
                  return (
                    <div key={product.name} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${colors[idx % colors.length]}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">{product.name}</span>
                          <span className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {data.productBreakdown.map((product, idx) => {
                      const colors = ['#f97316', '#f59e0b', '#eab308', '#fb923c', '#fbbf24', '#fde047', '#fed7aa'];
                      const percentage = (product.units / data.totalUnits) * 100;
                      const startAngle = data.productBreakdown
                        .slice(0, idx)
                        .reduce((sum, p) => sum + (p.units / data.totalUnits) * 100, 0);
                      const angle = (percentage / 100) * 360;
                      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                      const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                      const largeArc = angle > 180 ? 1 : 0;

                      return (
                        <path
                          key={product.name}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[idx % colors.length]}
                          stroke="white"
                          strokeWidth="0.5"
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="25" fill="white" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{data.totalUnits}</p>
                      <p className="text-xs text-gray-600">Total Units</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

interface EventDetailsModalProps {
  event: SalesEvent;
  onClose: () => void;
  onEdit: () => void;
}

function EventDetailsModal({ event, onClose, onEdit }: EventDetailsModalProps) {
  const [items, setItems] = useState<Array<{
    id: string;
    product_name: string;
    starting_stock: number;
    ending_stock: number;
    quantity_sold: number;
    unit_price: number;
    subtotal: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [event.id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function loadItems() {
    const { data } = await supabase
      .from('sales_items')
      .select('*')
      .eq('sales_event_id', event.id);
    if (data) setItems(data);
    setLoading(false);
  }

  const hasPendingItems = items.some(item => item.ending_stock === item.starting_stock && item.quantity_sold === 0);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={onClose} />

      <div className="hidden md:flex fixed inset-0 items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden pointer-events-auto animate-fade-in">
          <ModalContent event={event} items={items} loading={loading} onClose={onClose} onEdit={onEdit} hasPendingItems={hasPendingItems} />
        </div>
      </div>

      <div className="md:hidden bottom-sheet animate-slide-up z-50">
        <div className="bottom-sheet-handle" />
        <ModalContent event={event} items={items} loading={loading} onClose={onClose} onEdit={onEdit} hasPendingItems={hasPendingItems} />
      </div>
    </>
  );
}

interface ModalContentProps {
  event: SalesEvent;
  items: Array<{
    id: string;
    product_name: string;
    starting_stock: number;
    ending_stock: number;
    quantity_sold: number;
    unit_price: number;
    subtotal: number;
  }>;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  hasPendingItems: boolean;
}

function ModalContent({ event, items, loading, onClose, onEdit, hasPendingItems }: ModalContentProps) {
  return (
    <div className="flex flex-col max-h-[85vh] md:max-h-[90vh]">
      <div className="flex items-start justify-between p-4 md:p-6 border-b border-gray-100">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{event.event_name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors touch-target"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
        {hasPendingItems && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            Some products need "Remaining" counts. Tap <span className="font-semibold">Edit Event</span> to complete.
          </div>
        )}

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 md:p-5 text-white">
          <p className="text-sm text-white/80 mb-1">Total Revenue</p>
          <p className="text-3xl md:text-4xl font-bold">${event.total_revenue.toFixed(2)}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : items.length > 0 ? (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Products</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="p-3 md:p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{item.product_name}</p>
                    <p className="font-bold text-green-600">${item.subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                    <span>Brought: <span className="font-medium text-gray-700">{item.starting_stock}</span></span>
                    <span>Remaining: <span className="font-medium text-gray-700">{item.ending_stock}</span></span>
                    <span>Sold: <span className="font-semibold text-green-600">{item.quantity_sold}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {event.notes && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Notes</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 md:p-4 rounded-xl">{event.notes}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 p-4 md:p-6 border-t border-gray-100">
        <button
          onClick={onClose}
          className="flex-1 btn-secondary"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Event
        </button>
      </div>
    </div>
  );
}
