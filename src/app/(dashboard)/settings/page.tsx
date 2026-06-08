import React from "react";
import { Metadata } from "next";
import { getBusinessProfile } from "@/app/actions/profile";
import { BusinessProfileForm } from "@/components/settings/BusinessProfileForm";

export const metadata: Metadata = {
  title: "Settings - InvoicePro",
  description: "Configure your business profile and organization details for PDF invoices.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Fetch existing profile (null on first visit)
  const profile = await getBusinessProfile();

  const serializedProfile = profile
    ? {
        orgName: profile.orgName,
        orgAddress: profile.orgAddress,
        orgPhone: profile.orgPhone,
        orgEmail: profile.orgEmail,
        orgWebsite: profile.orgWebsite,
        orgGstin: profile.orgGstin,
        orgLogo: profile.orgLogo,
      }
    : null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-2xl p-6 lg:p-8 shadow-md relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 h-36 w-36 rounded-full bg-white/5 blur-3xl -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center shrink-0">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              Configuration
            </span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight mt-0.5">
              Business Profile
            </h1>
            <p className="text-sm text-indigo-100 mt-1 max-w-lg">
              Your organization name and address appear on every generated PDF invoice. Keep this up to date.
            </p>
          </div>
        </div>
      </div>

      {/* Profile status banner on first visit */}
      {!profile && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-sm">
          <svg className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">Profile not set up yet</p>
            <p className="text-amber-600/80 dark:text-amber-500/70 mt-0.5 text-xs">
              Your PDFs currently show placeholder text. Fill in the form below to fix this.
            </p>
          </div>
        </div>
      )}

      {/* The form */}
      <BusinessProfileForm initialData={serializedProfile} />
    </div>
  );
}
