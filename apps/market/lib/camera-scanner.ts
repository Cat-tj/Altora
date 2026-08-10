/**
 * Helper terpusat untuk membuka kamera barcode/QRIS di HP maupun Laptop.
 * Menggunakan strategi 3-tier fallback:
 * 1. facingMode: "environment" (Kamera belakang HP)
 * 2. facingMode: "user" (Kamera depan / Webcam Laptop)
 * 3. Html5Qrcode.getCameras() (List kamera terdeteksi)
 */
export async function startHtml5Scanner(
  containerId: string,
  onScanSuccess: (decodedText: string) => void,
  options?: {
    qrbox?: { width: number; height: number };
    aspectRatio?: number;
    fps?: number;
  }
) {
  // @ts-ignore - html5-qrcode type definition workaround
  const { Html5Qrcode } = (await import("html5-qrcode")) as any;

  // Pastikan elemen DOM ada sebelum membuat instance Html5Qrcode
  const element = document.getElementById(containerId);
  if (!element) {
    throw new Error(`Elemen wadah kamera #${containerId} belum siap di layar.`);
  }

  const scanner = new Html5Qrcode(containerId);
  const qrbox = options?.qrbox ?? { width: 250, height: 150 };
  const aspectRatio = options?.aspectRatio ?? 1.5;
  const fps = options?.fps ?? 10;
  const config = { fps, qrbox, aspectRatio };

  // Tier 1: Coba kamera belakang (HP)
  try {
    await scanner.start({ facingMode: "environment" }, config, onScanSuccess, () => {});
    return scanner;
  } catch (err1) {
    console.warn("[CameraScanner] facingMode environment gagal:", err1);
  }

  // Tier 2: Coba kamera depan/webcam (Laptop / Tablet)
  try {
    await scanner.start({ facingMode: "user" }, config, onScanSuccess, () => {});
    return scanner;
  } catch (err2) {
    console.warn("[CameraScanner] facingMode user gagal:", err2);
  }

  // Tier 3: Ambil daftar kamera fisik via getCameras()
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras && cameras.length > 0) {
      const rearCam = cameras.find(
        (c: { id: string; label: string }) =>
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("rear") ||
          c.label.toLowerCase().includes("environment")
      );
      const selectedCameraId = rearCam ? rearCam.id : cameras[0].id;
      await scanner.start(selectedCameraId, config, onScanSuccess, () => {});
      return scanner;
    }
  } catch (err3) {
    console.warn("[CameraScanner] getCameras() gagal:", err3);
  }

  throw new Error("Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan pada peramban/browser.");
}
