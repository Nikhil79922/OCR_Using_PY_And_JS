const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-poppler');
const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data'); // Import form-data module

// Your OCR.space API key
const apiKey = 'K81890360688957';

const app = express();
app.use(express.static('public'));
app.use(cors());

// Configure multer to handle file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    console.log(`Received file: ${filePath}`);

    if (path.extname(filePath) === '.pdf') {
        const pdfpath = path.join('uploads', path.basename(filePath));
        const output_dir = "pdf_images";

        if (!fs.existsSync(output_dir)) {
            fs.mkdirSync(output_dir, { recursive: true });
        }

        const convert_Pdf_Into_Img = async (pdfpath, output_dir) => {
            const opts = {
                format: 'png',
                out_dir: output_dir,
                out_prefix: path.basename(pdfpath, path.extname(pdfpath)),
            };

            try {
                await pdf.convert(pdfpath, opts);
                const imageFiles = fs.readdirSync(output_dir).filter(file => file.endsWith('.png'));
                console.log('Converted Images:', imageFiles);

                const img_dir = imageFiles.slice(-1)[0]; // Get the last image
                const imgPath = `./pdf_images/${img_dir}`;

                const resizedImagePath = `./pdf_images/resized_${img_dir}`;
                await sharp(imgPath).resize(1000, 1000, { fit: 'inside' }).toFile(resizedImagePath);

                // Call the function to extract text from image after resizing
                extractTextFromImage(resizedImagePath, res);
                fs.unlinkSync(pdfpath);
                fs.unlinkSync(imgPath);
            } catch (err) {
                console.error('Error during processing:', err);
                res.status(500).send('Error during processing');
            }
        };

        convert_Pdf_Into_Img(pdfpath, output_dir);
    } else {
        const resizedImagePath = `./uploads/resized_${path.basename(filePath)}`;
        sharp(filePath).resize(1000, 1000, { fit: 'inside' })
            .toFile(resizedImagePath)
            .then(() => {
                // Perform OCR on the resized image
                extractTextFromImage(resizedImagePath, res);

            })
            .catch(err => {
                console.error('Error during image resizing:', err);
                res.status(500).send('Error during image resizing');
            });
    }
});

async function extractTextFromImage(imagePath, res) {
    try {
        const imageFile = fs.createReadStream(imagePath);

        // Create form data and append necessary data
        const formData = new FormData();
        formData.append('apikey', apiKey);
        formData.append('file', imageFile);
        formData.append('filetype', 'PNG');

        // Perform OCR request to OCR.space
        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        if (response.data.IsErroredOnProcessing) {
            console.error('Error in OCR processing:', response.data.ErrorMessage);
            res.status(500).send('Error in OCR processing');
        } else {
            const extractedText = response.data.ParsedResults[0].ParsedText;
            console.log('Extracted Text:', extractedText);
            res.json({ extractedText });
        }
    } catch (error) {
        console.error('Error during OCR request:', error);
        res.status(500).send('Error during OCR request');
    }
}
// Start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
