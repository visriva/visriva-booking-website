"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ContractDocument from "@/components/ContractDocument";

function ContractContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId") || "";

  const paramClientName = searchParams.get("client") || "Valued Client";
  const paramEvent = searchParams.get("event") || "Luxury Sangeet / Gala Event";
  const paramDate = searchParams.get("date") || "14th December 2026";
  const paramVenue = searchParams.get("venue") || "Taj West End, Indiranagar, Bengaluru";
  const paramServices = searchParams.get("services") || "Instant Photo Booth, Custom Fridge Magnets";
  const paramAmount = Number(searchParams.get("amount")) || 38000;

  const [clientName, setClientName] = useState(paramClientName);
  const [eventType, setEventType] = useState(paramEvent);
  const [eventDate, setEventDate] = useState(paramDate);
  const [venue, setVenue] = useState(paramVenue);
  const [services, setServices] = useState<string[]>(
    paramServices.split(",").map((s) => s.trim())
  );
  const [totalAmount, setTotalAmount] = useState<number>(paramAmount);
  const [loading, setLoading] = useState<boolean>(Boolean(leadId));
  const [customHashtag, setCustomHashtag] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("");
  const [isGstInvoice, setIsGstInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");

  useEffect(() => {
    if (!leadId) return;
    async function fetchLead() {
      try {
        const docRef = doc(db, "bookings", leadId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.clientName) setClientName(data.clientName);
          if (data.eventType) setEventType(data.eventType);
          if (data.eventDate) setEventDate(data.eventDate);
          if (data.venue) setVenue(data.venue);
          if (data.customHashtag) setCustomHashtag(data.customHashtag);
          if (data.clientLogoUrl) setClientLogoUrl(data.clientLogoUrl);
          if (data.companyName) setCompanyName(data.companyName);
          if (data.companyGstin) setCompanyGstin(data.companyGstin);
          if (data.isGstInvoice !== undefined) setIsGstInvoice(data.isGstInvoice);
          if (data.services && Array.isArray(data.services)) setServices(data.services);
          if (data.estimatedBudget) {
            const num = parseInt(String(data.estimatedBudget).replace(/[^0-9]/g, ""), 10);
            if (!isNaN(num) && num > 0) setTotalAmount(num);
          }
        }
      } catch (err) {
        console.warn("Contract fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [leadId]);

  const invoiceNumber = `VIS-2026-${leadId ? leadId.slice(0, 6).toUpperCase() : "8848"}`;

  return (
    <ContractDocument
      loading={loading}
      data={{
        clientName,
        eventType,
        eventDate,
        venue,
        services,
        totalAmount,
        customHashtag,
        clientLogoUrl,
        isGstInvoice,
        companyName,
        companyGstin,
        invoiceNumber,
      }}
    />
  );
}

export default function ContractPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#011F15] text-white p-10 font-mono flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-[#D4AF37] animate-spin" />
          Loading agreement…
        </div>
      }
    >
      <ContractContent />
    </Suspense>
  );
}
