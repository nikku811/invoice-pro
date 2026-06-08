"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface BusinessProfileData {
  orgName: string;
  orgAddress?: string | null;
  orgPhone?: string | null;
  orgEmail?: string | null;
  orgWebsite?: string | null;
  orgGstin?: string | null;
  orgLogo?: string | null;
}

interface BusinessProfileFormProps {
  initialData: BusinessProfileData | null;
}

// Max dimension for logo image (client-side resize before base64 encoding)
const MAX_LOGO_PX = 200;
const JPEG_QUALITY = 0.82;

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        // Scale down preserving aspect ratio
        if (width > MAX_LOGO_PX || height > MAX_LOGO_PX) {
          if (width > height) {
            height = Math.round((height * MAX_LOGO_PX) / width);
            width = MAX_LOGO_PX;
          } else {
            width = Math.round((width * MAX_LOGO_PX) / height);
            height = MAX_LOGO_PX;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function BusinessProfileForm({ initialData }: BusinessProfileFormProps) {
  const [formData, setFormData] = useState<BusinessProfileData>({
    orgName: initialData?.orgName ?? "",
    orgAddress: initialData?.orgAddress ?? "",
    orgPhone: initialData?.orgPhone ?? "",
    orgEmail: initialData?.orgEmail ?? "",
    orgWebsite: initialData?.orgWebsite ?? "",
    orgGstin: initialData?.orgGstin ?? "",
    orgLogo: initialData?.orgLogo ?? null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file (JPG, PNG, etc.).");
      return;
    }
    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image must be smaller than 5MB.");
      return;
    }

    setLogoLoading(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setFormData((prev) => ({ ...prev, orgLogo: base64 }));
    } catch {
      showToast("error", "Failed to process image. Please try another file.");
    } finally {
      setLogoLoading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, orgLogo: null }));
  };

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.orgName.trim()) {
      tempErrors.orgName = "Organization name is required.";
    }
    if (formData.orgEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.orgEmail)) {
      tempErrors.orgEmail = "Please enter a valid email address.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");

      showToast("success", "Business profile saved successfully!");
    } catch (err: any) {
      showToast("error", err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold border animate-in fade-in slide-in-from-top-3 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
              : "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Organization Identity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-50 dark:border-slate-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Organization Identity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your business name and logo appear on every PDF invoice</p>
            </div>
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-slate-50 dark:border-slate-800/60">
          {/* Logo Preview */}
          <div className="shrink-0">
            <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 relative">
              {logoLoading ? (
                <svg className="h-6 w-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : formData.orgLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.orgLogo}
                  alt="Organization logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <svg className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-slate-400 mt-1">No logo</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Logo</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Shown top-left on every PDF. Max 5MB. Will be auto-resized to 200×200px.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                id="logoFileInput"
                accept="image/*"
                className="hidden"
                onChange={handleLogoSelect}
                disabled={isLoading || logoLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || logoLoading}
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {formData.orgLogo ? "Change Logo" : "Upload Logo"}
              </Button>
              {formData.orgLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isLoading}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            {formData.orgLogo && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Logo ready — will appear on PDFs after saving
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Organization Name"
              id="orgName"
              placeholder="e.g. Acme Construction Pvt. Ltd."
              value={formData.orgName}
              onChange={handleChange}
              error={errors.orgName}
              disabled={isLoading}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="orgAddress" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Business Address
            </label>
            <textarea
              id="orgAddress"
              rows={3}
              placeholder="e.g. 12, MG Road, Bengaluru, Karnataka - 560001"
              value={formData.orgAddress ?? ""}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-sm hover:border-slate-400 dark:hover:border-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-50 dark:border-slate-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Contact Details</h2>
              <p className="text-xs text-slate-400 mt-0.5">Optional contact info displayed on invoices</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Phone Number"
            id="orgPhone"
            type="tel"
            placeholder="e.g. +91 98765 43210"
            value={formData.orgPhone ?? ""}
            onChange={handleChange}
            disabled={isLoading}
          />

          <Input
            label="Email Address"
            id="orgEmail"
            type="email"
            placeholder="e.g. billing@acmecorp.in"
            value={formData.orgEmail ?? ""}
            onChange={handleChange}
            error={errors.orgEmail}
            disabled={isLoading}
          />

          <Input
            label="Website"
            id="orgWebsite"
            type="url"
            placeholder="e.g. https://acmecorp.in"
            value={formData.orgWebsite ?? ""}
            onChange={handleChange}
            disabled={isLoading}
          />

          <Input
            label="GSTIN"
            id="orgGstin"
            placeholder="e.g. 29ABCDE1234F1Z5"
            value={formData.orgGstin ?? ""}
            onChange={handleChange}
            disabled={isLoading}
            helperText="15-digit GST Identification Number"
          />
        </div>
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-end gap-4">
        <p className="text-xs text-slate-400 flex items-center gap-1.5 mr-auto">
          <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Changes apply to all future PDF exports
        </p>
        <Button type="submit" isLoading={isLoading} size="lg">
          <svg className="h-4.5 w-4.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Profile
        </Button>
      </div>
    </form>
  );
}
