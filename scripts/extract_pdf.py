#!/usr/bin/env python3
import pathlib
from pdfminer.high_level import extract_text

# Resolve paths relative to this script
pdf_path = pathlib.Path(__file__).resolve().parent.parent / "SnapStation.in — Premium Wooden Photo Booths _ Pune.pdf"
output_path = pathlib.Path(__file__).resolve().parent.parent / "data" / "photoBoothContent.txt"

# Extract text from PDF
text = extract_text(str(pdf_path))

# Ensure output directory exists
output_path.parent.mkdir(parents=True, exist_ok=True)

# Write extracted text
output_path.write_text(text, encoding="utf-8")
print(f"Extracted text written to {output_path}")
