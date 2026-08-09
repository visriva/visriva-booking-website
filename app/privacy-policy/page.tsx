import React from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Privacy Policy | Visriva Live Station",
  description: "Privacy Policy for Visriva Live Station services and applications.",
  path: "/privacy-policy",
});

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold border-b pb-4 border-gray-200">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-wide">
          Last Updated: August 2026
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Introduction</h2>
          <p className="leading-relaxed">
            Welcome to Visriva Live Station ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy applies to all information collected through our website, WhatsApp AI Agent, and related services (collectively, the "Services").
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
          <p className="leading-relaxed">
            We collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us via our website or our official WhatsApp Business number.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Info:</strong> Name, phone number, email address, and event details.</li>
            <li><strong>WhatsApp Chat Data:</strong> Messages, media, and interaction history when you communicate with our business account.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
          <p className="leading-relaxed">
            We use personal information collected via our Services for a variety of business purposes described below:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To fulfill and manage your bookings and orders.</li>
            <li>To respond to user inquiries and offer support.</li>
            <li>To automate responses using our AI Agent (powered by Google Gemini) for faster customer service.</li>
            <li>To send administrative information to you.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Data Sharing and Third-Party Services</h2>
          <p className="leading-relaxed">
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Specifically, we utilize:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Meta / WhatsApp:</strong> For processing and delivering messages securely.</li>
            <li><strong>Google / Gemini API:</strong> For processing message intent and generating automated helpful responses.</li>
            <li><strong>Firebase:</strong> For secure database storage of conversation logs.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Data Retention and Security</h2>
          <p className="leading-relaxed">
            We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law. We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions or comments about this notice, you may email us at <strong>visriva.work@gmail.com</strong> or contact us via phone at <strong>+91 88844 84828</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
