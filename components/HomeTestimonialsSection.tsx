"use client";

import React, { useEffect, useState } from "react";
import Testimonials from "@/components/Testimonials";
import {
  subscribeTestimonialsConfig,
  type TestimonialsConfig,
} from "@/lib/firebase";
import { DEFAULT_TESTIMONIALS_CONFIG } from "@/lib/testimonials";

export default function HomeTestimonialsSection() {
  const [config, setConfig] = useState<TestimonialsConfig>(DEFAULT_TESTIMONIALS_CONFIG);

  useEffect(() => subscribeTestimonialsConfig(setConfig), []);

  if (!config.enabled || !config.items?.length) return null;

  return (
    <Testimonials
      testimonials={config.items}
      title={config.title}
      subtitle={config.subtitle}
      badgeText={config.badgeText}
    />
  );
}
