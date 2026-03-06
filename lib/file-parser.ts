const MAX_EXTRACTED_CHARS = 5000;

export async function parseFileContent(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  let text = "";

  switch (fileType) {
    case "txt": {
      text = buffer.toString("utf-8");
      break;
    }
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
      await parser.destroy();
      break;
    }
    case "docx":
    case "doc": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case "csv": {
      const Papa = (await import("papaparse")).default;
      const csvText = buffer.toString("utf-8");
      const parsed = Papa.parse(csvText, { header: true });
      text = (parsed.data as Record<string, unknown>[])
        .map((row) =>
          Object.entries(row)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
        )
        .join("\n");
      break;
    }
    default:
      throw new Error(`不支援的檔案格式: ${fileType}`);
  }

  if (text.length > MAX_EXTRACTED_CHARS) {
    text = text.substring(0, MAX_EXTRACTED_CHARS) + "\n\n[... 內容已截斷]";
  }

  return text.trim();
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export const ALLOWED_FILE_TYPES = ["pdf", "csv", "docx", "doc", "txt"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
