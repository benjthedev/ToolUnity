'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just show success state
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-lg text-gray-600">
            Have a question? We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Contact Methods */}
          <div className="md:col-span-1">
            <div className="space-y-8">
              {/* Email */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Email</h3>
                <a href="mailto:support@tooltree.com" className="text-blue-600 hover:text-blue-700">
                  support@tooltree.com
                </a>
                <p className="text-sm text-gray-600 mt-1">We'll respond within 24 hours</p>
              </div>

              {/* Phone */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Phone</h3>
                <a href="tel:+441234567890" className="text-blue-600 hover:text-blue-700 block">
                  +44 (0) 123 456 7890
                </a>
                <p className="text-sm text-gray-600 mt-1">Monday–Friday, 9 AM–5 PM GMT</p>
              </div>

              {/* General Inquiries */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Business Inquiries</h3>
                <a href="mailto:partnerships@tooltree.com" className="text-blue-600 hover:text-blue-700">
                  partnerships@tooltree.com
                </a>
              </div>

              {/* Urgent Issues */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Urgent Issues</h3>
                <a href="mailto:urgent@tooltree.com" className="text-blue-600 hover:text-blue-700">
                  urgent@tooltree.com
                </a>
                <p className="text-sm text-gray-600 mt-1">For security or safety concerns</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a message</h2>
              
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-green-800 font-semibold mb-2">Message sent!</p>
                  <p className="text-green-700 text-sm">
                    Thank you for reaching out. We'll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Common Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">How do I report a safety concern?</h3>
              <p className="text-gray-600 text-sm">
                For urgent safety issues, please email <a href="mailto:urgent@tooltree.com" className="text-blue-600 hover:text-blue-700">urgent@tooltree.com</a> or call us immediately.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What's the best way to reach support?</h3>
              <p className="text-gray-600 text-sm">
                Email is usually fastest for non-urgent issues. We'll respond within 24 hours. For immediate help, call us during business hours.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">How can I become a partner?</h3>
              <p className="text-gray-600 text-sm">
                We're excited about partnerships! Email <a href="mailto:partnerships@tooltree.com" className="text-blue-600 hover:text-blue-700">partnerships@tooltree.com</a> with details about your proposal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
