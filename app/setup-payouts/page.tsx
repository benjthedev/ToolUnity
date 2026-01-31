'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/app/utils/toast';

export default function SetupPayoutsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  
  const [accountHolderName, setAccountHolderName] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchPayoutDetails();
  }, [session?.user?.id, loading, router]);

  const fetchPayoutDetails = async () => {
    try {
      const { data } = await supabase
        .from('users_ext')
        .select('bank_account_holder_name, bank_sort_code, bank_account_number')
        .eq('user_id', session?.user?.id)
        .single();

      if (data) {
        setAccountHolderName(data.bank_account_holder_name || '');
        setSortCode(data.bank_sort_code || '');
        setAccountNumber(data.bank_account_number || '');
      }
    } catch (err) {
      console.error('Error fetching payout details:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const formatSortCode = (value: string) => {
    // Remove non-digits and format as XX-XX-XX
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  };

  const formatAccountNumber = (value: string) => {
    // Remove non-digits, max 8
    return value.replace(/\D/g, '').slice(0, 8);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validation
    if (!accountHolderName.trim()) {
      showToast('Account holder name is required', 'error');
      setSaving(false);
      return;
    }

    const cleanSortCode = sortCode.replace(/\D/g, '');
    if (cleanSortCode.length !== 6) {
      showToast('Sort code must be 6 digits', 'error');
      setSaving(false);
      return;
    }

    if (accountNumber.length !== 8) {
      showToast('Account number must be 8 digits', 'error');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('users_ext')
        .update({
          bank_account_holder_name: accountHolderName.trim(),
          bank_sort_code: cleanSortCode,
          bank_account_number: accountNumber,
          bank_details_updated_at: new Date().toISOString(),
        })
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      showToast('Bank details saved successfully!', 'success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error saving payout details:', err);
      showToast('Failed to save bank details', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-white">Set Up Payouts</h1>
          <p className="text-blue-100 mt-2">Add your bank details to receive payments from rentals</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          
          {/* Info Box */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              💳 <strong>How it works:</strong> When someone rents your tool, you'll receive 85% of the rental cost. 
              We'll manually transfer funds to the bank account you provide here within 5 business days.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Account Holder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must match the name on your bank account</p>
            </div>

            {/* Sort Code */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Sort Code *
              </label>
              <input
                type="text"
                value={sortCode}
                onChange={(e) => setSortCode(formatSortCode(e.target.value))}
                placeholder="XX-XX-XX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                maxLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">6 digits (find on your bank card or statement)</p>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(formatAccountNumber(e.target.value))}
                placeholder="12345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                maxLength={8}
                required
              />
              <p className="text-xs text-gray-500 mt-1">8 digits (find on your cheque book or bank app)</p>
            </div>

            {/* Security Info */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                🔒 <strong>Your security:</strong> Bank details are encrypted and stored securely. 
                We only use them to send you payouts.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Bank Details'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 text-center bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
