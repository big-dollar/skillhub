import AdmZip from "adm-zip";

export function createZipBuffer(files: Record<string, string>): Buffer {
  const zip = new AdmZip();

  for (const [fileName, content] of Object.entries(files)) {
    zip.addFile(fileName, Buffer.from(content, "utf8"));
  }

  return zip.toBuffer();
}
