'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useOutletStore } from '../../store/outletStore';
import ApiClient from '../../lib/api';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { MenuItemWithOutletData, MenuCategoryGroup, OutletSummary } from '@dumline/shared';
import { formatINR } from '../../lib/utils';
import {
  SlidersHorizontal,
  Plus,
  Edit2,
  Check,
  X,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  ChefHat,
  Search,
  Filter,
  DollarSign,
  User,
} from 'lucide-react';

export default function CentralAdminPage() {
  const { user, token, setAuth } = useAuthStore();
  const { outlets, loadOutlets } = useOutletStore();

  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [categories, setCategories] = useState<MenuCategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Edit item modal state
  const [editingItem, setEditingItem] = useState<MenuItemWithOutletData | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editAvailable, setEditAvailable] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutletId) {
      setSelectedOutletId(outlets[0].id);
    }
  }, [outlets, selectedOutletId]);

  const fetchMenu = async (outletId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getCategorizedMenu(outletId);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOutletId) {
      fetchMenu(selectedOutletId);
    }
  }, [selectedOutletId]);

  // Demo auto-login as Central Admin
  const handleQuickLoginAsAdmin = async () => {
    try {
      setIsLoading(true);
      const res = await ApiClient.login({
        emailOrPhone: 'admin@dumline.com',
        password: 'Admin@123',
      });
      setAuth(res.token, res.user);
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle availability (86ing)
  const handleToggleAvailability = async (item: MenuItemWithOutletData) => {
    if (!token) return;
    setUpdatingItemId(item.id);
    try {
      const newStatus = !item.isAvailableAtOutlet;
      await ApiClient.setOutletOverride(
        {
          outletId: selectedOutletId,
          itemId: item.id,
          isAvailableOverride: newStatus,
        },
        token
      );
      // Refresh local view
      await fetchMenu(selectedOutletId);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle availability (86ing)');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Open edit price modal
  const handleOpenEdit = (item: MenuItemWithOutletData) => {
    setEditingItem(item);
    setEditPrice(item.effectivePrice);
    setEditAvailable(item.isAvailableAtOutlet);
    setSaveSuccess(null);
  };

  // Save outlet price override
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !token) return;

    setIsSaving(true);
    try {
      await ApiClient.setOutletOverride(
        {
          outletId: selectedOutletId,
          itemId: editingItem.id,
          priceOverride: editPrice,
          isAvailableOverride: editAvailable,
        },
        token
      );
      setSaveSuccess('Outlet pricing and stock status updated successfully.');
      setTimeout(() => {
        setEditingItem(null);
        fetchMenu(selectedOutletId);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to save item override');
    } finally {
      setIsSaving(false);
    }
  };

  const allItems = categories.flatMap((c) => c.items);
  const filteredItems = allItems.filter(
    (it) =>
      it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.prepComplexityTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-dumline-sand/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dumline-sand-dark pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dumline-saffron/30 bg-dumline-saffron/10 px-3 py-0.5 text-xs font-bold text-dumline-saffron-dark mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>CENTRAL CATALOG & OUTLET INVENTORY MANAGEMENT</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal">
                Central Menu Administration
              </h1>
              <p className="text-xs sm:text-sm text-dumline-charcoal/70">
                Manage global dishes, configure outlet-specific price overrides, and manage 86ing (stock depletion).
              </p>
            </div>

            {/* Persona Bar */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-dumline-charcoal">{user?.fullName || 'Central Administrator'}</div>
                <div className="text-[10px] text-dumline-saffron-dark font-semibold uppercase tracking-wider">
                  Role: CENTRAL ADMIN
                </div>
              </div>
            </div>
          </div>

        {/* Outlet Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-dumline-sand-dark bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-dumline-charcoal/70 shrink-0">
              Active Outlet Scope:
            </span>
            <select
              value={selectedOutletId}
              onChange={(e) => setSelectedOutletId(e.target.value)}
              className="rounded-xl border border-dumline-sand-dark bg-dumline-ivory px-3.5 py-2 text-xs font-bold text-dumline-charcoal shadow-inner focus:outline-none focus:border-dumline-crimson"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.deliveryRadiusKm}km radius)
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
            <input
              type="text"
              placeholder="Search dishes or stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/20 pl-9 pr-3.5 py-2 text-xs text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-300 p-4 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Catalog Table */}
        <div className="rounded-2xl border border-dumline-sand-dark bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-dumline-sand bg-dumline-sand/10 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-dumline-charcoal">
                Catalog & Availability for {selectedOutlet?.name}
              </h2>
              <p className="text-xs text-dumline-charcoal/70">
                All prices are GST-inclusive. Toggling availability immediately updates customer menus across web sockets.
              </p>
            </div>
            <span className="text-xs font-bold text-dumline-charcoal/60">
              {filteredItems.length} dishes listed
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-dumline-charcoal/60">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-dumline-crimson border-t-transparent" />
              <p className="mt-2">Loading catalog items...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-dumline-sand bg-dumline-sand/20 text-[11px] font-bold uppercase tracking-wider text-dumline-charcoal/70">
                  <tr>
                    <th className="px-5 py-3.5">Dish</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Prep Complexity & Station</th>
                    <th className="px-5 py-3.5">Global Price</th>
                    <th className="px-5 py-3.5">Outlet Price</th>
                    <th className="px-5 py-3.5">Stock Status (86ing)</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dumline-sand">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-dumline-sand/20 transition-colors ${
                        !item.isAvailableAtOutlet ? 'bg-red-50/40 opacity-75' : ''
                      }`}
                    >
                      {/* Dish */}
                      <td className="px-5 py-4">
                        <div className="font-serif font-bold text-sm text-dumline-charcoal">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-dumline-charcoal/60 truncate max-w-xs">
                          {item.description}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-dumline-sand/60 px-2 py-0.5 text-[10px] font-bold text-dumline-charcoal">
                          {item.category}
                        </span>
                      </td>

                      {/* Complexity & Station */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className="inline-flex rounded bg-dumline-crimson/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-dumline-crimson">
                            {item.prepComplexityTag}
                          </span>
                          <div className="text-[10px] text-dumline-charcoal/60 font-mono">
                            {item.basePrepMinutes}m base prep
                          </div>
                        </div>
                      </td>

                      {/* Global Price */}
                      <td className="px-5 py-4 font-mono font-medium text-dumline-charcoal/70">
                        {formatINR(item.basePrice)}
                      </td>

                      {/* Outlet Price */}
                      <td className="px-5 py-4">
                        <div className="font-serif font-bold text-sm text-dumline-charcoal">
                          {formatINR(item.effectivePrice)}
                        </div>
                        {item.effectivePrice !== item.basePrice && (
                          <span className="text-[9px] font-semibold text-dumline-saffron-dark">
                            (Override active)
                          </span>
                        )}
                      </td>

                      {/* Availability (86ing) */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          disabled={updatingItemId === item.id || !token}
                          onClick={() => handleToggleAvailability(item)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all shadow-sm ${
                            item.isAvailableAtOutlet
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.isAvailableAtOutlet ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              <span>86ed (Sold Out)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-dumline-sand-dark bg-white px-2.5 py-1 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-crimson hover:text-white transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dumline-charcoal/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-dumline-ivory border border-dumline-sand-dark p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-dumline-sand pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-dumline-charcoal">
                    Edit Dish for {selectedOutlet?.name}
                  </h3>
                  <p className="text-xs text-dumline-charcoal/70 font-semibold">{editingItem.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-lg p-1.5 text-dumline-charcoal/60 hover:bg-dumline-sand"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOverride} className="mt-5 space-y-4">
                {saveSuccess && (
                  <div className="rounded-xl bg-green-50 border border-green-300 p-3 text-xs text-green-800">
                    {saveSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                    Outlet Retail Price (GST-Inclusive ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-dumline-sand-dark bg-white px-3.5 py-2.5 text-sm font-semibold text-dumline-charcoal shadow-sm focus:border-dumline-crimson focus:outline-none"
                    required
                  />
                  <span className="text-[11px] text-dumline-charcoal/60">
                    Global catalog base price: {formatINR(editingItem.basePrice)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                    Outlet Stock Availability (86ing Status)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditAvailable(true)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-colors ${
                        editAvailable
                          ? 'border-green-600 bg-green-100 text-green-900'
                          : 'border-dumline-sand-dark bg-white text-dumline-charcoal'
                      }`}
                    >
                      In Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditAvailable(false)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-colors ${
                        !editAvailable
                          ? 'border-red-600 bg-red-100 text-red-900'
                          : 'border-dumline-sand-dark bg-white text-dumline-charcoal'
                      }`}
                    >
                      86ed (Sold Out)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-dumline-sand">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-dumline-crimson px-5 py-2 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
