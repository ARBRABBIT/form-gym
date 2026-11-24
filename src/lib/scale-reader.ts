import { scaleReading } from "./health";
/** Local-only OCR. Only model/worker assets are fetched; image pixels stay in the tab. */
export async function readScaleOnDevice(
  photo: File,
  signal: AbortSignal,
  progress: (message: string) => void,
) {
  const { createWorker, PSM } = await import("tesseract.js");
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const worker = await createWorker("eng", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr",
    logger: (event) => {
      if (!signal.aborted && event.status === "recognizing text")
        progress(
          `Reading on your device… ${Math.round(event.progress * 100)}%`,
        );
    },
  });
  const cancel = () => {
    worker.terminate().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(cancel, 45000);
  try {
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    const image = await createImageBitmap(photo);
    const ratio = Math.min(2, 1800 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) {
      image.close();
      throw new Error("Canvas unavailable");
    }
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.filter = "grayscale(1) contrast(1.35)";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      tessedit_char_whitelist: "0123456789.,kgKGbBlLsS ",
      user_defined_dpi: "150",
    });
    const { data } = await worker.recognize(canvas);
    if (signal.aborted || data.confidence < 45) return null;
    return scaleReading(data.text);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
    await worker.terminate().catch(() => {});
  }
}
