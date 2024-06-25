const AWS = require('../config/awsConfig');
const { storage, vertexAI } = require('../config/gcpConfig')
const openai = require('../config/openAIConfig');
const path = require('path');
const { recipeWiseSalesDataBetweenDates, typeWiseSalesDataBetweenDates } = require('./sales/salesHistory')
const Ingredient = require('../models/ingredient/ingredients');

const { PDFDocument } = require('pdf-lib')
const { createCanvas } = require('canvas')
const Jimp = require('jimp')
const { fromBuffer } = require('pdf2pic');
const { fileURLToPath } = require('url');

const s3 = new AWS.S3();

exports.formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // return `${day}-${month}-${year}`;
    return `${month}/${day}/${year}`;
};

exports.formatMonthYear = async (date) => {
    const options = { month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
    const [month, year] = formattedDate.split(' ');
    const lastTwoDigitsOfYear = year.slice(-2);

    const formattedResult = `${month}-${lastTwoDigitsOfYear}`;

    return formattedResult;
}

exports.inventoryCheck = async (ingredients, AllIngredients, UnitMaps) => {
    const allIngredientsPresent = await Promise.all(ingredients.map(async (ingredient) => {

        const matchingIngredient = AllIngredients.find(
            (allIngredient) => allIngredient._id.toString() === ingredient.ingredient_id.toString()
        );

        if (!matchingIngredient) {
            return false;
        }

        const unitMap = UnitMaps.find(
            (unitMap) => unitMap.ingredient_id.toString() === ingredient.ingredient_id.toString()
        );

        const toUnit = unitMap ? unitMap.toUnit : ingredient.unit;
        const convertedQuantity = ingredient.quantity * exports.getConversionFactor(ingredient.unit, toUnit, unitMap.fromUnit);
        const convertedInventory = matchingIngredient.inventory * exports.getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit);

        if (convertedQuantity > convertedInventory) {
            return false;
        }
        return true;
    }));
    return allIngredientsPresent.every((present) => present);
}

exports.costEstimation = async (ingredients, AllIngredients, UnitMaps) => {
    let totalCost = 0;

    for (const ingredient of ingredients) {

        const matchingIngredient = AllIngredients.find(
            (allIngredient) => allIngredient._id.toString() === ingredient.ingredient_id.toString()
        );

        if (matchingIngredient) {
            const unitMap = UnitMaps.find(
                (unitMap) => unitMap.ingredient_id.toString() === ingredient.ingredient_id.toString()
            );
            const toUnit = unitMap ? unitMap.toUnit : ingredient.unit;
            const convertedQuantity = ingredient.quantity * exports.getConversionFactor(ingredient.unit, toUnit, unitMap.fromUnit);
            const costPerUnit = matchingIngredient.avgCost / exports.getConversionFactor(matchingIngredient.invUnit, toUnit, unitMap.fromUnit) || 0;
            totalCost += costPerUnit * convertedQuantity;
        }
    }

    return totalCost;
}

exports.getConversionFactor = (fromUnit, toUnit, fromUnitArray) => {
    try {
        const conversionObject = fromUnitArray.find((unit) => unit.unit === fromUnit);
        return conversionObject ? conversionObject.conversion : 1;
    } catch (error) {
        console.error('Error getting conversion factor of ingredient:', error.message);
        throw error;
    }
};


exports.uploadToGCS = async (fileBuffer, fileName, fileType, bucketName, folderPath) => {
    try {
        if (folderPath && !folderPath.endsWith('/')) {
            folderPath += '/';
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(folderPath + fileName);

        const stream = file.createWriteStream({
            metadata: {
                contentType: fileType,
            },
            predefinedAcl: 'publicRead',
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (error) => {
                console.error('Error uploading to GCS:', error.message);
                reject(error);
            });

            stream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucketName}/${folderPath}${fileName}`;
                resolve(publicUrl);
            });

            stream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error uploading to GCS:', error.message);
        throw error;
    }
};

exports.deleteFromGCS = async (objectUrl, bucketName) => {
    try {
        const url = new URL(objectUrl);
        const decodedObjectName = decodeURIComponent(url.pathname.substring(1));

        const objectNameWithoutBucket = decodedObjectName.replace(`${bucketName}/`, '');

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectNameWithoutBucket);

        await file.delete();
    } catch (error) {
        console.error('Error deleting file from GCS:', error.message);
        throw error;
    }
}

const getFileType = async (buffer) => {
    const { fileTypeFromBuffer } = await import('file-type');
    return await fileTypeFromBuffer(buffer);
}

const convertPdfToImage = async (buffer) => {
    const options = {
        density: 100,
        format: "png",
        width: 600,
        height: 600
    }
    const convert = fromBuffer(buffer, options)

    const imageResult = await convert(1, { responseType: "buffer" })
    console.log(imageResult.buffer);

    return imageResult.buffer
}

const uploadInvoiceToGCS = async (buffer, fileName, fileType) => {
    try {
        const bucketName = process.env.BUCKET_NAME
        const bucket = storage.bucket(bucketName);
        const extension = fileType === 'application/pdf' ? 'pdf' : 'png';
        const file = bucket.file(`extract/${fileName}.${extension}`);

        await file.save(buffer, {
            metadata: { contentType: fileType },
            public: true
        })

        return `gs://${bucketName}/extract/${fileName}.${extension}`
        // return `https://storage.googleapis.com/${bucketName}/extract/${fileName}.${extension}`
    } catch (error) {
        console.error('Error uploading invoice to GCS:', error.message);
        throw error;
    }
}

const extractTextFromPdf = async (buffer) => {
    const { createWorker } = require('tesseract.js')
    const worker = await createWorker("eng");
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    return data.text;
}

exports.modelprompt = `Extract Invoice number/Reference Number/REF# as invoiceNumber, Vendor Name the company that produced invoice as vendor, Invoice/Billing Date as invoiceDate, Total of items without any taxes or additional charges as total, Total payable amount after taxes as totalPayable and list of items named ingredients as array of objects with fields in which take description/item as name, Qty/Quantity as quantity, Unit Price per quantity as unitPrice, total Amount of particular item as total. Also return just JSON format in pretty format with no additional texts.
                       Imp: dont return any numerical value with commas or brackets or dollar signs in it. Eg. $3,240.97 should be just 3240.97
                        {
                            invoiceNumber: ''
                            vendor: '',
                            invoiceDate: 'mm-dd-yyyy',
                            ingredients: [
                                {
                                    name: 'item description/name'
                                    quantity: 'if item quantity not readable/mentioned in bill/invoice then take quantity as 1' 
                                    unitPrice: 'if quantity is 1 then item unitPrice and total same, if unitPrice not mentioned then take unitPrice as item total divided by quantity'
                                    total: 'if quantity is 1 then item unitPrice and total same'
                                },
                            ]
                            total: 'total without any additional charges/discounts/taxes'
                            additions: 'sum of all types of taxes or previous balance left'
                            deductions: 'sum of all discounts or amount already paid by customer or retainer'
                            totalPayable: 'should not be empty, it should be payable amt after all taxes/discounts, or after adding previous balance or deducting already paid amount or deducting the amount already paid as retainer'
                        }
                    `

exports.extractInvoiceOpenAI = async (buffer) => {
    try {
        const type = await getFileType(buffer);
        let imageBuffer;
        let extractedData;
        const fileName = `invoice_${Date.now()}`;

        if (type.mime === 'application/pdf') {
            const text = await extractTextFromPdf(buffer)
            console.log(text)
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Extract the following information from the provided text:\n\n${text}\n\n Return Invoice number as invoiceNumber, Vendor Name the company that produced invoice as vendor, Invoice Date as invoiceDate, Total Amount as total and list of items named ingredients as array of objects with fields description as name, Qty as quantity, Unit Price as unitPrice, Amount as total. Also return just JSON format with no additional texts` },
                        ],
                    },
                ],
                max_tokens: 1200,
            });

            extractedData = response.choices[0].message.content;
        } else if (['image/png', 'image/jpeg'].includes(type.mime)) {
            imageBuffer = buffer;
            const imageURL = await uploadInvoiceToGCS(imageBuffer, fileName);
            console.log(imageURL);
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text", text: exports.modelprompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageURL,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1200,
            });
            extractedData = response.choices[0].message.content
        } else {
            throw new Error('Unsupported file type');
        }

        const startIndex = extractedData.indexOf('{')
        const endIndex = extractedData.lastIndexOf('}') + 1
        const jsonStr = extractedData.slice(startIndex, endIndex)

        return JSON.parse(jsonStr)
    } catch (error) {
        console.error('Error extracting invoice data through openAI:', error.message);
        throw error;
    }
}

exports.extractInvoiceVertexAI = async (buffer) => {
    try {
        const type = await getFileType(buffer);
        let fileUrl;

        if (type.mime === 'application/pdf') {
            fileUrl = await uploadInvoiceToGCS(buffer, `invoice_${Date.now()}`, type.mime);
        } else if (['image/png', 'image/jpeg'].includes(type.mime)) {
            fileUrl = await uploadInvoiceToGCS(buffer, `invoice_${Date.now()}`, type.mime)
        } else {
            throw new Error('Unsupported file type')
        }

        console.log(fileUrl)

        const filePart = {
            file_data: {
                file_uri: fileUrl,
                mime_type: type.mime,
            },
        }

        const textPart = {
            text: exports.modelprompt,
        }

        const request = {
            contents: [{ role: 'user', parts: [filePart, textPart] }],
        };

        const generativeModel = await vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-preview-0409',
        })

        const resp = await generativeModel.generateContent(request)
        const extractedData = resp.response.candidates[0].content
        const jsonString = extractedData.parts[0].text.match(/```json\n([\s\S]*?)\n```/)[1].trim();
        const jsonResponse = JSON.parse(jsonString)

        await exports.deleteFromGCS(fileUrl, bucketName = process.env.BUCKET_NAME)

        return (jsonResponse)
    } catch (error) {
        console.error('Error extracting invoice data through vertexAI:', error.message);
        throw error;
    }
}

