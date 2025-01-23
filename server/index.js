const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const pdfPoppler = require("pdf-poppler");
const sharp = require("sharp");
const cors = require("cors");


const app = express();

// Enable CORS for all origins
app.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
  
    cb(null, `${Date.now()}-${file.originalname}`)
  }
})

const upload = multer({ storage: storage })

app.use(express.json());

// Convert PDF to image using pdf-poppler
const convertPdfToImage = (filePath) => {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, "uploads", "output");
    const options = {
      format: "jpeg",
      out_dir: path.dirname(outputPath),
      out_prefix: path.basename(outputPath),
      page: null, // Converts all pages of the PDF
    };

    pdfPoppler.convert(filePath, options)
      .then(() => {
        // We assume that the file generated is output-1.jpg (for the first page)
        const imagePath = outputPath + "-1.jpg"; // Adjust this based on the generated files
        resolve(imagePath); // Return the correct image path
      })
      .catch((err) => reject(err));
  });
};

// Process the image using sharp (resize, etc.)
const processImage = (imagePath) => {
  return sharp(imagePath)
    .resize(800) // Resize image to width of 800px
    .toFile(imagePath.replace(".jpg", "_processed.jpg"));
};

// OCR using Python
const performOcr = (imagePath, language = "eng") => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", ["ocr_service.py", imagePath, language]);
    let result = "";
    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      reject(`Python error: ${data.toString()}`);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve(result);
      } else {
        reject("OCR failed");
      }
    });
  });
};

const cleanup = (filePath) => {
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);  // Delete the file after processing
  }
};

app.post("/ocr", upload.single("file"), async (req, res) => {
  const filePath = req.file.path; // Path to the uploaded PDF
  const language = req.body.lang || "eng"; // Default to "eng" if no language is specified

  try {
    console.log("File uploaded at:", filePath);
    // Step 1: Convert PDF to image
    const imagePath = await convertPdfToImage(filePath);
    console.log("PDF converted to image:", imagePath);

    // Step 2: Process the image using sharp (resize, etc.)
    await processImage(imagePath);
    console.log("Image processed:", imagePath.replace(".jpg", "_processed.jpg"));

    // Step 3: Perform OCR using Python
    const ocrResult = await performOcr(imagePath.replace(".jpg", "_processed.jpg"), language);
    console.log("OCR result:", ocrResult);

    res.json({ text: ocrResult });

    // Cleanup
    cleanup(imagePath);  // Clean up the generated image after processing
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to process the file" });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});