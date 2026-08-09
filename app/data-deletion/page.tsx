import React from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Data Deletion Instructions | Visriva Live Station",
  description:
    "Learn how to request the deletion of your personal data from Visriva Live Station systems and applications.",
  path: "/data-deletion",
});

export default function DataDeletionInstructions() {
  return (
    <div className="min-h-screen bg-white text-gray-900 py-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold border-b pb-4 border-gray-200">
          User Data Deletion Instructions
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-wide">
          Last Updated: August 2026
        </p>

        <section className="space-y-4">
          <p className="leading-relaxed">
            At Visriva Live Station, we respect your privacy and provide a simple, transparent process to request the deletion of any personal data collected through our website, WhatsApp AI Assistant, or event booking services.
          </p>
          <p className="leading-relaxed">
            If you wish to request the deletion of your user data, please follow the instructions below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How to Request Data Deletion</h2>
          <p className="leading-relaxed">
            You can request your data deletion through any of the following official channels:
          </p>
          <ul className="list-decimal pl-6 space-y-3">
            <li>
              <strong>Email Request:</strong> Send an email to <a href="mailto:visriva.work@gmail.com" className="text-blue-600 hover:underline">visriva.work@gmail.com</a> with the subject line <em>"Data Deletion Request"</em>. Please specify the name, email address, or phone number associated with your data.
            </li>
            <li>
              <strong>WhatsApp Request:</strong> Message our official support team at <a href="https://wa.me/918884484828" className="text-blue-600 hover:underline">+91 88844 84828</a> and request the deletion of your interaction history or event booking details.
            </li>
            <li>
              <strong>Facebook Support:</strong> Visit our official Facebook page at <a href="https://www.facebook.com/visriva" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.facebook.com/visriva</a> and send a direct message to request deletion.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Types of Data We Delete</h2>
          <p className="leading-relaxed">
            Upon receiving your request, we will permanently delete the following data from our records within 24 to 48 hours:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your contact information (name, phone number, email address).</li>
            <li>Your event details and reservation logs.</li>
            <li>Your WhatsApp communication and AI chatbot interaction history.</li>
            <li>Any physical mockups or design specifications saved in our system.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Confirmation of Deletion</h2>
          <p className="leading-relaxed">
            Once the data deletion process is complete, we will send you a confirmation message or email through the channel you used to request deletion.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p className="leading-relaxed">
            If you have questions about this policy or require assistance, please contact us:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email: <strong>visriva.work@gmail.com</strong></li>
            <li>Phone & WhatsApp: <strong>+91 88844 84828</strong></li>
            <li>Facebook: <a href="https://www.facebook.com/visriva" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">facebook.com/visriva</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
