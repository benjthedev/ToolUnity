'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { getSupabase } from '@/lib/supabase';

const categories = ['Power Tools', 'Garden Tools', 'Camping Equipment', 'Sports Equipment', 'Other'];
const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];

export default function EditToolPage() {
  const router = useRouter();
  const params = useParams();
  const { session } = useAuth();
  const toolId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    category: 'Power Tools',
    description: '',
    condition: 'Good',
    toolValue: '',
    postcode: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

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

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    const csrf = cookies.find(c => c.trim().startsWith('__csrf_token='));
    if (csrf) {
      setCsrfToken(decodeURIComponent(csrf.split('=')[1]));
    }

    const fetchTool = async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb
          .from('tools')
          .select('*')
          .eq('id', toolId)
          .single();

        if (error) throw error;

        if (data && data.owner_id === session.user?.id) {
          setFormData({
            name: data.name || '',
            category: data.category || 'Power Tools',
            description: data.description || '',
            condition: data.condition || 'Good',
            toolValue: data.daily_rate?.toString() || data.tool_value?.toString() || '',
            postcode: data.postcode || '',
          });
          setCurrentImageUrl(data.image_url || '');
        } else {
          setError('You do not have permission to edit this tool.');
        }
      } catch (err) {
        setError('Failed to load tool details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [toolId, session, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const sb = getSupabase();
      let imageUrl = currentImageUrl;

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

      // Upload new image if selected
      if (imageFile && session?.user?.id) {
        try {
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
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

      // Call secure API endpoint instead of direct Supabase update
      const response = await fetch(`/api/tools/update?toolId=${toolId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          condition: formData.condition,
          daily_rate: parseFloat(formData.toolValue) || 0,
          image_url: imageUrl,
          csrf_token: csrfToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update tool');
        setSubmitting(false);
        return;
      }

      router.push('/owner-dashboard');
    } catch (err) {
      setError('Failed to update tool. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-gray-600">Loading tool details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 pt-32">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Tool</h1>
          <p className="text-gray-600">Update your tool details</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {/* Tool Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tool Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Power Drill"
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your tool condition, features, and what's included..."
            />
          </div>

          {/* Condition */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {conditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Rate */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tool Value (£) *
            </label>
            <input
              type="number"
              name="toolValue"
              value={formData.toolValue}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 150"
            />
          </div>

          {/* Tool Image */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tool Photo
            </label>
            <div className="space-y-4">
              {(preview || currentImageUrl) && (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={preview || currentImageUrl}
                    alt="Tool preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-sm text-gray-600">
                {preview || currentImageUrl ? 'Choose a different image or keep the current one' : 'Upload a clear photo of your tool'}
              </p>
            </div>
          </div>

          {/* Postcode */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Postcode *
            </label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., SW1A 1AA"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 text-center bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
