/**
 * Visriva Live Station - Google Sheet Column Header Extractor Utility
 */

export function convertToCsvExportUrl(url: string): string {
  if (!url) return "";
  
  // If it's already a CSV URL or web app URL
  if (url.includes("/pub?output=csv") || url.includes("export?format=csv")) {
    return url;
  }

  // Extract Sheet ID from standard URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }

  return url;
}

export async function fetchGoogleSheetColumns(sheetUrl: string): Promise<string[]> {
  if (!sheetUrl || !sheetUrl.trim()) {
    return ["Guest Name", "WhatsApp Phone", "Item Choice", "Token Number", "Special Notes"];
  }

  try {
    const csvUrl = convertToCsvExportUrl(sheetUrl);
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const csvText = await response.text();
    const firstLine = csvText.split("\n")[0];

    if (!firstLine) {
      throw new Error("Empty CSV output");
    }

    // Split CSV line handling quotes
    const headers = firstLine
      .split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
      .map((header) => header.replace(/^"|"$/g, "").trim())
      .filter((header) => header.length > 0);

    if (headers.length > 0) {
      return headers;
    }
  } catch (err) {
    console.warn("Google Sheet CSV Fetch Note:", err);
  }

  // Default fallback headers if fetch fails or URL isn't published
  return ["Guest Name", "WhatsApp Phone", "Item Choice", "Token Number", "Special Notes"];
}
