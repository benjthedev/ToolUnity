'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';

export default function AddToolPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [conditionPhotos, setConditionPhotos] = useState<File[]>([]);
  const [conditionPreviews, setConditionPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    condition: 'good',
    toolValue: '',
    dailyRate: '',
    postcode: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check email verification status
  useEffect(() => {
    if (loading) return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Check if email is verified from session first
    if (!session.user?.emailVerified) {
      router.push(`/verify-email?email=${encodeURIComponent(session.user?.email || '')}`);
      return;
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Validate postcode format (basic UK postcode validation)
    if (name === 'postcode') {
      // Allow only alphanumeric and space, max 8 characters
      value = value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConditionPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const filesArray = Array.from(files);
      if (filesArray.length + conditionPhotos.length > 5) {
        setError('Maximum 5 condition photos allowed');
        return;
      }
      const newPhotos = [...conditionPhotos, ...filesArray];
      setConditionPhotos(newPhotos);
      
      // Generate previews
      filesArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setConditionPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeConditionPhoto = (index: number) => {
    setConditionPhotos((prev) => prev.filter((_, i) => i !== index));
    setConditionPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Block unverified users
    if (!session?.user?.emailVerified) {
      setError('Please verify your email before listing tools');
      return;
    }

    // Validate image is required
    if (!imageFile) {
      setError('Tool photo is required');
      return;
    }

    // Validate tool value
    const toolValue = parseFloat(formData.toolValue);
    if (isNaN(toolValue) || toolValue < 0) {
      setError('Tool value must be a valid number');
      return;
    }

    if (toolValue > 1000) {
      setError('Tool value cannot exceed £1,000');
      return;
    }

    // Validate daily rate
    const dailyRate = parseFloat(formData.dailyRate);
    if (isNaN(dailyRate) || dailyRate < 0.5) {
      setError('Daily rental rate must be at least £0.50');
      return;
    }

    if (dailyRate > 500) {
      setError('Daily rental rate cannot exceed £500');
      return;
    }

    // Round to 2 decimal places for consistency
    const roundedToolValue = Math.round(toolValue * 100) / 100;
    const roundedDailyRate = Math.round(dailyRate * 100) / 100;

    setSubmitting(true);

    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    const csrf = cookies.find(c => c.trim().startsWith('__csrf_token='));
    const csrfToken = csrf ? decodeURIComponent(csrf.split('=')[1]) : '';

    try {
      let imageUrl = '';
      const conditionPhotosUrls: string[] = [];
      const sb = getSupabase();

      // Helper function to upload file with retry logic
      const uploadFileWithRetry = async (file: File, path: string, maxRetries = 2): Promise<string> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            
            const { data: uploadData, error: uploadError } = await sb.storage
              .from('tool-images')
              .upload(path, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              if (attempt === maxRetries) {
                throw uploadError;
              }
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
              continue;
            }

            const { data: urlData } = sb.storage
              .from('tool-images')
              .getPublicUrl(path);
            
            return urlData.publicUrl;
          } catch (err) {
            if (attempt === maxRetries) {
              throw err;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          }
        }
        throw new Error('Upload failed after retries');
      };

      // Upload image if one was selected
      if (imageFile && session.user?.id) {
        try {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

          // Image file upload starting

          imageUrl = await uploadFileWithRetry(imageFile, fileName);
        } catch (uploadError: any) {
          const errorMessage = uploadError?.message || 'Unknown error';
          const userMessage = 
            errorMessage.includes('bucket') ? 'Storage service unavailable. Please try again.' :
            errorMessage.includes('size') ? 'File is too large. Please choose a smaller image.' :
            errorMessage.includes('format') ? 'Invalid image format. Use JPG, PNG, or WebP.' :
            `Image upload failed: ${errorMessage}`;
          
          setError(userMessage);
          setSubmitting(false);
          return;
        }
      }

      // Upload condition photos
      for (const photo of conditionPhotos) {
        try {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${session.user?.id}/condition/${Date.now()}-${Math.random().toString(36)}.${fileExt}`;

          const photoUrl = await uploadFileWithRetry(photo, fileName);
          conditionPhotosUrls.push(photoUrl);
        } catch (uploadError: any) {
          const errorMessage = uploadError?.message || 'Unknown error';
          setError(`Failed to upload condition photo: ${errorMessage}. You can proceed without condition photos.`);
          // Don't fail completely - condition photos are optional
          // Just continue without this photo
        }
      }

      // Create tool via secure API endpoint (with validation, CSRF, rate limiting)
      const response = await fetch('/api/tools/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          tool_value: roundedToolValue,
          daily_rate: roundedDailyRate,
          images: imageUrl ? [imageUrl] : [],
          csrf_token: csrfToken,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || 'Failed to create tool');
        setSubmitting(false);
        return;
      }

      const toolResult = await response.json();
      const toolId = toolResult.tool?.id;

      if (!toolId) {
        setError('Tool created but could not retrieve ID');
        setSubmitting(false);
        return;
      }

      // Check if user now qualifies for free Standard plan (3+ tools)
      if (session.user?.id) {
        try {
          // Get current tool count first
          const { data: currentTools } = await sb
            .from('tools')
            .select('id')
            .eq('owner_id', session.user.id);
          
          const newToolCount = currentTools?.length || 1;
          
          // Increment tools_count in users_ext
          const { error: updateError } = await sb
            .from('users_ext')
            .update({ tools_count: newToolCount })
            .eq('user_id', session.user.id);

          if (updateError) {
            // Silently continue - tools_count update is not critical
          }
        } catch (err) {
          // Don't fail the flow if update fails
        }
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      const errorMsg = err?.message || 'An unexpected error occurred';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Reassurance Panel */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-6">🛡️ Your Tools Are Protected</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="font-semibold text-green-900 mb-2">✓ You Control Everything</p>
              <p className="text-sm text-green-800">
                You approve or reject every borrow request. You decide who borrows, when, and for how long.
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-900 mb-2">✓ Damage Protection</p>
              <p className="text-sm text-green-800">
                Borrowers must have a payment method on file to protect against damage. You're covered if issues arise.
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-900 mb-2">✓ Earn 85% of Every Rental</p>
              <p className="text-sm text-green-800">
                Set your own daily rate and earn money when others rent your tools. No upfront fees.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Tool</h1>
          <p className="text-gray-600 mb-8">Share your tools with the community</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Tool Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tool Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Power Drill, Circular Saw"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Select a category</option>
                <option value="Power Tools">Power Tools</option>
                <option value="Hand Tools">Hand Tools</option>
                <option value="Garden">Garden Tools</option>
                <option value="Cleaning">Cleaning Equipment</option>
                <option value="Ladders">Ladders</option>
                <option value="Safety">Safety Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your tool, condition, and any special features..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Condition <span className="text-red-600">*</span>
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="like-new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            {/* Tool Value */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tool Value (£) <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">Approximate retail value, maximum £300 (helps set borrowing limits)</p>
                <input
                  type="number"
                  name="toolValue"
                  required
                  value={formData.toolValue}
                  onChange={handleInputChange}
                  placeholder="e.g., 150"
                  step="0.01"
                  min="0"
                  max="300"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
                />
            </div>

            {/* Daily Rental Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Daily Rental Rate (£/day) <span className="text-red-600">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">How much you want to charge per day for renting this tool</p>
              <input
                type="number"
                name="dailyRate"
                required
                value={formData.dailyRate}
                onChange={handleInputChange}
                placeholder="e.g., 3.50"
                step="0.50"
                min="0.50"
                max="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              />
            </div>

            {/* Postcode */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Postcode <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="postcode"
                required
                value={formData.postcode}
                onChange={handleInputChange}
                placeholder="e.g., 10001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 bg-white"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Main Tool Photo <span className="text-red-600">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition">
                {preview && (
                  <div className="mb-4">
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={handleImageChange}
                  className="w-full text-gray-900"
                />
                {!preview && (
                  <p className="text-gray-500 text-sm mt-2">Select an image to preview</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? 'Creating...' : 'List Tool'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50 text-center transition"
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
