import sys
import pytesseract
from PIL import Image

def perform_ocr(image_path, language="eng"):
    try:
        img = Image.open(image_path)  # Open the image file
        text = pytesseract.image_to_string(img, lang=language)  # OCR to extract text
        return text
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    file_path = sys.argv[1]  # Path to the image file
    language = sys.argv[2] if len(sys.argv) > 2 else "eng"  # Language argument, defaults to English

    # Perform OCR and print the result
    print(perform_ocr(file_path, language))
