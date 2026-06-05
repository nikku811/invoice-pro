import React from "react";
import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account - InvoicePro",
  description: "Register a new Professional Invoice Generator account.",
};

export default function RegisterPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
        <div className="flex flex-col items-center">
          {/* Logo Icon */}
          <div className="h-12 w-12 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-200 dark:shadow-none mb-4">
            IP
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Get started
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Create an account to start generating professional invoices
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
