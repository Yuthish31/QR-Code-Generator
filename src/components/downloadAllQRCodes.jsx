import JSZip from "jszip";
import { saveAs } from "file-saver";

const downloadAllQRCodes = async () => {
  const zip = new JSZip();
  allData.forEach((row, index) => {
    const canvas = document.getElementById(`qr-${index}`);
    const dataUrl = canvas.toDataURL("image/png");
    const imgData = dataUrl.split(",")[1]; // Base64 part
    zip.file(`QR-${row.System}.png`, imgData, { base64: true });
  });
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "All_QRCodes.zip");
};
