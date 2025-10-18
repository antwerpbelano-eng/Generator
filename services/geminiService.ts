
import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Define a custom error class for user-facing, known generation errors.
class AiGenerationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AiGenerationError';
    }
}

/**
 * Handles API errors, specifically checking for quota-related issues.
 * @param error The error object caught.
 * @param context A string describing the operation that failed (e.g., "image generation").
 * @returns A new Error with a user-friendly message.
 */
const handleApiError = (error: any, context: string): Error => {
    console.error(`An unexpected error occurred during ${context}:`, error);

    const errorMessage = error.message || '';

    // The Gemini SDK often includes specific status codes in the message for quota errors.
    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
         return new Error("Anda telah melampaui kuota API Anda. Silakan periksa paket dan detail tagihan Anda di Google AI Studio.");
    }

    // Fallback for other unexpected errors.
    return new Error(`Terjadi kesalahan tak terduga saat ${context}. Periksa koneksi Anda dan coba lagi.`);
};


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return only the base64 part
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

/**
 * Resizes an image file client-side to a smaller dimension for faster processing.
 * @param file The original image file.
 * @param maxWidth The maximum width of the resized image.
 * @param maxHeight The maximum height of the resized image.
 * @returns A promise that resolves to a new, resized image file.
 */
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Tidak dapat memperoleh konteks kanvas'));
            }
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                } else {
                    reject(new Error('Konversi kanvas ke Blob gagal'));
                }
            }, 'image/jpeg', 0.9); // Use JPEG for smaller file size
        };
        img.onerror = (error) => reject(error);
    });
};


export const generateImageFromPrompt = async (
  prompt: string,
  aspectRatio: string,
  referenceImage: File | null,
  clothingReferenceImage: File | null,
  productReferenceImage: File | null,
  motorcycleReferenceImage: File | null
): Promise<string> => {
  try {
    if (!referenceImage && !clothingReferenceImage && !productReferenceImage && !motorcycleReferenceImage) {
      // Mode 1: No reference image, use standard image generation model
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio.split(' ')[0] as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
      // If no image is returned, provide a more helpful error.
      throw new AiGenerationError("AI tidak mengembalikan gambar. Ini mungkin karena permintaan Anda melanggar kebijakan keamanan. Coba ubah prompt Anda.");

    } else {
      // Mode 2: At least one reference image provided, use multimodal model
      const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [];
      
      parts.push({ text: prompt });

      if (referenceImage) {
          const base64ImageData = await fileToBase64(referenceImage);
          parts.push({
              inlineData: {
                  data: base64ImageData,
                  mimeType: referenceImage.type,
              },
          });
      }

      if (clothingReferenceImage) {
          const base64ClothingData = await fileToBase64(clothingReferenceImage);
          parts.push({
              inlineData: {
                  data: base64ClothingData,
                  mimeType: clothingReferenceImage.type,
              },
          });
      }
      
      if (productReferenceImage) {
          const base64ProductData = await fileToBase64(productReferenceImage);
          parts.push({
              inlineData: {
                  data: base64ProductData,
                  mimeType: productReferenceImage.type,
              },
          });
      }
      
      if (motorcycleReferenceImage) {
        const base64MotorcycleData = await fileToBase64(motorcycleReferenceImage);
        parts.push({
            inlineData: {
                data: base64MotorcycleData,
                mimeType: motorcycleReferenceImage.type,
            },
        });
      }


      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: parts },
          config: {
              responseModalities: [Modality.IMAGE],
          },
      });

      // --- Refactored Error Handling and Response Parsing ---
      const candidate = response.candidates?.[0];
      const blockReason = response.promptFeedback?.blockReason;

      // 1. Check for explicit prompt-level block first
      if (blockReason) {
          throw new AiGenerationError(`Permintaan gambar diblokir karena: ${blockReason}. Coba ubah prompt Anda.`);
      }

      // 2. Check the candidate's finish reason for issues
      const finishReason = candidate?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
          if (finishReason === 'NO_IMAGE') {
               throw new AiGenerationError("Pembuatan gambar gagal karena model tidak dapat memproses kombinasi prompt dan gambar referensi. Coba sederhanakan prompt atau gunakan gambar referensi yang berbeda.");
          }
          throw new AiGenerationError(`Pembuatan gambar berhenti karena alasan tak terduga: ${finishReason}. Coba ubah prompt Anda.`);
      }

      // 3. If the candidate is valid, try to find the image data
      const responseParts = candidate?.content?.parts;
      if (responseParts && Array.isArray(responseParts)) {
          for (const part of responseParts) {
              if (part.inlineData?.data) {
                  const base64ImageBytes = part.inlineData.data;
                  return `data:image/jpeg;base64,${base64ImageBytes}`;
              }
          }
      }

      // 4. If no image was found, check for a text response as a fallback for error diagnosis
      const textResponse = response.text || '';
      if (textResponse) {
        const unhelpfulPhrases = [
            // General conversational starters
            "tentu, ini dia gambar",
            "here is the image you requested",
            "berikut adalah gambar yang anda minta",
            "ini dia gambar yang kamu minta",
            "baik, saya akan membuat adegan tersebut",
            "ini dia:",
            "sure, here is the image",
            "of course, here is the image",
            "baik, ini dia gambarnya",
            "i will now generate the image",
            "saya akan membuat gambar",
            "here is the image you asked for",
            
            // Keywords related to face replication which can appear in conversational text
            "wajah subjek yang direplikasi",
            "dari gambar referensi",
            "direplikasi secara identik",
            "membuat adegan tersebut dengan wajah subjek",
            
            // Specific phrases reported by the user to ensure they are caught
            "ini dia gambar yang kamu minta:",
            "baik, saya akan membuat adegan tersebut dengan wajah subjek yang direplikasi secara identik dari gambar referensi. ini dia:",
        ];
        
        const cleanedResponse = textResponse.trim().toLowerCase().replace(/[^\w\s]/g, '');
        
        const isUnhelpful = unhelpfulPhrases.some(phrase => 
            cleanedResponse.includes(phrase.replace(/[^\w\s]/g, ''))
        );

        if (isUnhelpful) {
             throw new AiGenerationError("AI memberikan respons teks yang tidak valid tanpa gambar. Coba ubah prompt Anda atau coba lagi.");
        }
        
        throw new AiGenerationError(`AI Gagal Menghasilkan Gambar: ${textResponse}`);
      }
      
      // 5. If we reach here, it's the "empty but valid" response. This is the most likely cause of the user's issue.
      throw new AiGenerationError("AI menyelesaikan permintaan tetapi tidak menghasilkan gambar. Ini sering terjadi karena kebijakan keamanan internal. Coba sederhanakan atau ubah prompt Anda.");
    }
  } catch(error) {
    if (error instanceof AiGenerationError) {
        // This is a custom, user-friendly error from our logic. Re-throw it to the UI.
        throw error;
    }
    // Use the centralized handler for all other errors.
    throw handleApiError(error, "pembuatan gambar");
  }
};

export const analyzeImageForGender = async (imageFile: File): Promise<string> => {
    const TIMEOUT_MS = 30000; // 30-second timeout

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error("Deteksi jenis kelamin terlalu lama. Silakan pilih secara manual."));
        }, TIMEOUT_MS);
    });

    const analysisPromise = async (): Promise<string> => {
        try {
            // Resize the image to a much smaller size for faster upload and analysis.
            const resizedImage = await resizeImage(imageFile, 256, 256);

            const base64ImageData = await fileToBase64(resizedImage);
            const imagePart = {
                inlineData: {
                    data: base64ImageData,
                    mimeType: 'image/jpeg', // We converted to jpeg in resize
                },
            };
            const textPart = {
                text: "Jenis kelamin orang di foto? Jawab hanya 'Pria' atau 'Wanita'."
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [imagePart, textPart] },
            });

            const detectedGender = response.text.trim();

            if (detectedGender === "Pria" || detectedGender === "Wanita") {
                return detectedGender;
            } else {
                console.warn(`Gender detection returned an unexpected value: "${detectedGender}".`);
                throw new Error("Gagal mendeteksi jenis kelamin dari gambar.");
            }
        } catch (error) {
            console.error("Error during gender analysis:", error);
            throw new Error("Gagal menganalisis gambar untuk jenis kelamin. Silakan pilih secara manual.");
        }
    };

    // Race the analysis against the timeout
    return Promise.race([analysisPromise(), timeoutPromise]);
};


export const generateStorylinePrompts = async (context: string): Promise<string[]> => {
    const fullPrompt = `Anda adalah seorang Director of Photography dan Penulis Naskah ahli. Tugas Anda adalah membuat sembilan deskripsi adegan sinematik yang membentuk alur cerita yang koheren berdasarkan parameter dan inspirasi yang diberikan.

**Aturan Penceritaan Visual yang Konsisten (WAJIB DIIKUTI):**

1.  **Deskripsi Visual yang Diulang:** Untuk **SETIAP ADEGAN** dari 1 hingga 9, Anda **WAJIB** menulis ulang **SELURUH** deskripsi visual yang konsisten. Setiap deskripsi adegan harus secara eksplisit dan lengkap menyebutkan:
    *   **Penampilan Karakter Lengkap:** Deskripsi pakaian (konsisten dengan pilihan atau referensi), semua aksesoris yang dikenakan, gaya rambut (termasuk tekstur, warna, dan kerapian), dan penutup kepala (jika ada) secara sangat spesifik dan detail. Jika ada Referensi Wajah, sebutkan bahwa wajahnya harus konsisten.
    *   **Gaya Pencahayaan & Palet Warna:** Deskripsi gaya pencahayaan dan *color grading* yang khas (misalnya, "pencahayaan samping yang dramatis dengan bayangan panjang dan *color grading teal and orange* sinematik").
    *   **Lingkungan & Atmosfer:** Deskripsi elemen latar belakang atau lingkungan kunci dan atmosfernya (misalnya, "dinding bata ekspos di apartemen loteng yang remang-remang dan berdebu").

2.  **Konsistensi adalah Kunci:** Deskripsi visual yang lengkap ini **HARUS SAMA PERSIS** di setiap adegan (1-9) untuk memastikan konsistensi absolut saat gambar dihasilkan secara terpisah. Yang berbeda di setiap adegan hanyalah **AKSI** atau **PERKEMBANGAN CERITA** dari karakter.

3.  **Contoh Penerapan yang Benar:**
    *   **Adegan 1:** "Seorang pria dengan setelan jas hitam rapi, rambut hitam disisir ke belakang, berdiri di apartemen lotengnya yang berdinding bata. Pencahayaan samping yang dramatis menciptakan bayangan panjang, dengan *color grading teal and orange* sinematik. Ia melihat ke luar jendela."
    *   **Adegan 2:** "Seorang pria dengan setelan jas hitam rapi yang sama, rambut hitam disisir ke belakang, sekarang duduk di kursi kulit di apartemen lotengnya yang berdinding bata. Pencahayaan samping yang dramatis dan *color grading teal and orange* sinematik tetap konsisten saat ia membuka sebuah buku tua."
    *   Perhatikan bagaimana penampilan karakter, lokasi, pencahayaan, dan warna diulang secara eksplisit di Adegan 2. Lakukan ini untuk semua sembilan adegan.

4.  **Integrasikan Inspirasi:** Rangkai semua **Inspirasi Cerita** yang dipilih menjadi alur cerita yang logis dan mengalir, sambil tetap mematuhi aturan pengulangan deskripsi visual di setiap adegan.

5.  **Tanpa Singkatan:** Tulis semua kata secara lengkap. **JANGAN** gunakan singkatan dalam bentuk apa pun.

6.  **Elemen Audio:** Di akhir setiap deskripsi adegan, tambahkan baris 'SoundFX:' untuk suara lingkungan.

**KONTEKS LENGKAP UNTUK CERITA:**
${context}

Sekarang, berdasarkan **KONTEKS LENGKAP** di atas, buatlah sembilan adegan. Pastikan Anda mengikuti **SEMUA Aturan Penceritaan Visual yang Konsisten** dengan sangat ketat, mengulang deskripsi visual yang detail di setiap adegan dari 1 sampai 9.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "Deskripsi sinematik lengkap untuk satu adegan, termasuk bagian SoundFX.",
                            },
                        },
                    },
                    required: ["scenes"],
                },
            },
        });

        let jsonStr = response.text.trim();
        // Clean markdown code block if present
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        try {
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed.scenes) && parsed.scenes.length >= 9) {
                return parsed.scenes.slice(0, 9);
            }
        } catch (e) {
            console.error("Gagal mem-parsing JSON dari respons AI:", jsonStr, e);
            throw new Error("AI mengembalikan respons yang tidak terduga. Coba lagi.");
        }

        throw new Error("Respons AI tidak mengandung 9 adegan seperti yang diharapkan.");

    } catch (error) {
        throw handleApiError(error, "pembuatan alur cerita");
    }
};

export const generateSocialMediaPackage = async (prompts: string[]): Promise<{ title: string; intro: string; cta: string; hashtags:string; }> => {
    const storyContext = prompts.map((p, i) => `Adegan ${i + 1}: ${p}`).join('\n');
    const fullPrompt = `Anda adalah seorang manajer media sosial profesional untuk seorang influencer FB Pro. Berdasarkan alur cerita sembilan adegan berikut, buatlah paket konten yang menarik.
Paket ini harus mencakup:
1.  **title**: Judul yang sangat singkat, menarik, dan viral (maksimal 10 kata).
2.  **intro**: Teks intro singkat yang memikat yang menceritakan kisah dari 9 adegan tersebut (3-4 kalimat).
3.  **cta**: Ajakan bertindak (Call to Action) yang ramah untuk mengajak audiens mengikuti halaman Facebook Pro.
4.  **hashtags**: Serangkaian 5-7 tagar yang relevan dan sedang tren.

Konteks Cerita:
${storyContext}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        intro: { type: Type.STRING },
                        cta: { type: Type.STRING },
                        hashtags: { type: Type.STRING },
                    },
                    required: ["title", "intro", "cta", "hashtags"],
                },
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }

        try {
            const parsed = JSON.parse(jsonStr);
            return parsed;
        } catch (e) {
            console.error("Gagal mem-parsing JSON dari paket media sosial:", jsonStr, e);
            throw new Error("AI mengembalikan paket media sosial yang tidak valid. Coba lagi.");
        }
    } catch (error) {
        throw handleApiError(error, "pembuatan paket media sosial");
    }
};
