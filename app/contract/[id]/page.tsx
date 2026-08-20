"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ContractDocument from "@/components/ContractDocument";
import { EventContract, getContract, signContract } from "@/lib/firebase";
import { Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContractByIdPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [contract, setContract] = useState<EventContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await getContract(id);
      if (cancelled) return;
      if (!data) setNotFound(true);
      else setContract(data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#011F15] text-white">
        <Navbar />
        <div className="pt-44 pb-28 px-4 text-center max-w-md mx-auto space-y-4">
          <Lock className="w-12 h-12 text-[#D4AF37] mx-auto opacity-70" />
          <h1 className="font-serif text-2xl font-bold">Contract not found</h1>
          <p className="text-xs text-emerald-100/70">
            This agreement link is invalid or has been removed. Ask Visriva for a fresh link.
          </p>
        </div>
        <Footer />
      </main>
    );
  }

  if (loading || !contract) {
    return <ContractDocument data={{
      clientName: "",
      eventType: "",
      eventDate: "",
      venue: "",
      services: [],
      totalAmount: 0,
      invoiceNumber: "",
    }} loading />;
  }

  return (
    <ContractDocument
      data={{
        clientName: contract.clientName,
        eventType: contract.eventType,
        eventDate: contract.eventDate,
        venue: contract.venue,
        services: contract.services || [],
        totalAmount: contract.totalAmount,
        customHashtag: contract.customHashtag,
        clientLogoUrl: contract.clientLogoUrl,
        isGstInvoice: contract.isGstInvoice,
        companyName: contract.companyName,
        companyGstin: contract.companyGstin,
        invoiceNumber: contract.invoiceNumber,
        signatureName: contract.signatureName,
        signedAt: contract.signedAt,
        status: contract.status,
      }}
      onSign={async (signatureName) => {
        const res = await signContract(contract.id, signatureName);
        if (res.success) {
          setContract({
            ...contract,
            signatureName,
            signedAt: new Date().toISOString(),
            termsAcceptedAt: new Date().toISOString(),
            status: "signed",
          });
        }
        return res;
      }}
    />
  );
}
